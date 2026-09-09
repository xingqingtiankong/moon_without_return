"use strict";

const aboutShell = document.getElementById("about-shell");
const memberGrid = document.getElementById("member-grid");
const memberCount = document.getElementById("member-count");
const recordCount = document.getElementById("record-count");
const archiveMessage = document.getElementById("archive-message");
const memberDetail = document.getElementById("member-detail");
const detailClose = document.getElementById("detail-close");
const detailFile = document.getElementById("detail-file");
const detailAvatar = document.getElementById("detail-avatar");
const detailName = document.getElementById("detail-name");
const detailRole = document.getElementById("detail-role");
const detailDescription = document.getElementById("detail-description");

const teamMembers = Array.isArray(window.MoonTeamData)
    ? window.MoonTeamData
    : [];

let activeMemberTrigger = null;
let detailCloseTimer = 0;

function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
}

function createMemberCard(member, index) {
    const card = document.createElement("article");
    const fileNumber = String(index + 1).padStart(2, "0");
    card.className = "member-card";

    const cardHeader = document.createElement("header");
    cardHeader.className = "member-card__header";
    cardHeader.append(
        createTextElement("span", "member-card__file", `PERSONNEL FILE // ${fileNumber}`),
        createTextElement("span", "member-card__status", "STATUS // ACTIVE")
    );

    const cardBody = document.createElement("div");
    cardBody.className = "member-card__body";

    const portraitFrame = document.createElement("figure");
    portraitFrame.className = "member-card__portrait-frame";

    const portrait = document.createElement("img");
    portrait.className = "member-card__portrait";
    portrait.src = member.avatar;
    portrait.alt = member.name;
    portraitFrame.append(portrait);

    const details = document.createElement("section");
    details.className = "member-card__details";
    details.setAttribute("aria-label", `${member.name}的成员资料摘要`);
    details.append(
        createTextElement("span", "member-card__label", "NAME"),
        createTextElement("h3", "member-card__name", member.name),
        createTextElement("span", "member-card__label", "ROLE"),
        createTextElement("p", "member-card__role", member.role),
        createTextElement("span", "member-card__action", "查看档案  /  VIEW FILE")
    );

    const openButton = document.createElement("button");
    openButton.className = "member-card__open";
    openButton.type = "button";
    openButton.setAttribute("aria-label", `查看${member.name}的成员详情`);
    openButton.setAttribute("aria-haspopup", "dialog");
    openButton.addEventListener("click", () => openMemberDetail(index, openButton));

    cardBody.append(portraitFrame, details);
    card.append(cardHeader, cardBody, openButton);

    return card;
}

function renderMembers() {
    memberGrid.replaceChildren();
    const fragment = document.createDocumentFragment();

    teamMembers.forEach((member, index) => {
        fragment.append(createMemberCard(member, index));
    });

    memberGrid.append(fragment);
    const formattedCount = String(teamMembers.length).padStart(2, "0");
    memberCount.textContent = formattedCount;
    recordCount.textContent = formattedCount;

    if (teamMembers.length !== 6) {
        archiveMessage.textContent = `ARCHIVE DATA CHECK // EXPECTED 06, RECEIVED ${formattedCount}`;
        archiveMessage.classList.add("is-visible");
    }
}

function openMemberDetail(index, trigger) {
    const member = teamMembers[index];

    if (!member) {
        return;
    }

    window.clearTimeout(detailCloseTimer);
    activeMemberTrigger = trigger;
    detailFile.textContent = `PERSONNEL FILE // ${String(index + 1).padStart(2, "0")}`;
    detailAvatar.src = member.avatar;
    detailAvatar.alt = member.name;
    detailName.textContent = member.name;
    detailRole.textContent = member.role;
    detailDescription.textContent = member.description;
    memberDetail.hidden = false;
    document.documentElement.classList.add("detail-open");
    document.body.classList.add("detail-open");

    window.requestAnimationFrame(() => {
        memberDetail.classList.add("is-open");
        detailClose.focus({preventScroll: true});
    });
}

function closeMemberDetail() {
    if (memberDetail.hidden) {
        return;
    }

    memberDetail.classList.remove("is-open");
    document.documentElement.classList.remove("detail-open");
    document.body.classList.remove("detail-open");

    detailCloseTimer = window.setTimeout(() => {
        memberDetail.hidden = true;

        if (activeMemberTrigger) {
            activeMemberTrigger.focus({preventScroll: true});
        }
    }, 240);
}

function handleDetailBackdrop(event) {
    if (event.target === memberDetail) {
        closeMemberDetail();
    }
}

function handleKeyboardNavigation(event) {
    if (event.key !== "Escape") {
        return;
    }

    event.preventDefault();

    if (!memberDetail.hidden) {
        closeMemberDetail();
        return;
    }

    MoonSystem.returnToMainMenu();
}

function initializeReturnNavigation() {
    MoonSystem.bindBackButton();
}

function initializeEntryAnimation() {
    window.requestAnimationFrame(() => aboutShell.classList.add("is-ready"));
}

function bindEventListeners() {
    detailClose.addEventListener("click", closeMemberDetail);
    memberDetail.addEventListener("click", handleDetailBackdrop);
    document.addEventListener("keydown", handleKeyboardNavigation);
    initializeReturnNavigation();
}

function initialize() {
    renderMembers();
    MoonSystem.initializeSystemClock();
    initializeEntryAnimation();
    bindEventListeners();
}

initialize();