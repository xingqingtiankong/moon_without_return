"use strict";

(function () {
    const config = globalThis.MoonMapConfig;
    const routes = [
        {
            id: "azhi",
            map: "F01",
            speed: 85,
            rx: 17,
            ry: 9,
            points: [[461.2, 434.3], [600, 430], [700, 350], [800, 300], [600, 300], [580, 400]]
        },
        {
            id: "xing8",
            map: "F03",
            speed: 95,
            rx: 13,
            ry: 7,
            points: [[994.8, 481], [900, 470], [800, 470], [720, 570], [700, 720], [880, 750], [860, 680], [900, 470]]
        }
    ];
    const facing = (dx, dy) => dy > .25 && dx < -.25 ? 1 : dy > .25 && dx > .25 ? 7 : dy < -.25 && dx < -.25 ? 5 : dy < -.25 && dx > .25 ? 3 : Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 2 : 6 : dy < 0 ? 4 : 0;

    class FamilyPatrol {
        constructor() {
            this.actors = routes.map(r => ({
                ...r,
                points: r.points.map(p => [...p]),
                x: r.points[0][0],
                y: r.points[0][1],
                target: 1,
                wait: 1.5,
                phase: 0,
                moving: false,
                facing: 0
            }));
        }

        footprint(actor) {
            const scale = config.getCharacterScale(actor.map);
            return {rx: actor.rx * scale, ry: actor.ry * scale};
        }

        overlaps(actor, x, y, rx, ry) {
            const f = this.footprint(actor);
            return ((x - actor.x) / (rx + f.rx)) ** 2 + ((y - actor.y) / (ry + f.ry)) ** 2 < 1;
        }

        blocks(map, x, y, rx, ry, except = null) {
            return this.actors.some(a => a !== except && a.map === map && this.overlaps(a, x, y, rx, ry));
        }

        visible(map) {
            return this.actors.filter(a => a.map === map);
        }

        update(dt, map, player) {
            if (!/^F0[1-5]$/.test(map)) return;
            for (const a of this.actors) {
                a.moving = false;
                if (a.wait > 0) {
                    a.wait = Math.max(0, a.wait - dt);
                    continue;
                }
                const [tx, ty] = a.points[a.target], dx = tx - a.x, dy = ty - a.y, distance = Math.hypot(dx, dy);
                if (distance < .01) {
                    a.target = (a.target + 1) % a.points.length;
                    a.wait = 3 + (a.target % 3);
                    a.phase = 0;
                    a.facing = 0;
                    continue;
                }
                const f = this.footprint(a), travel = Math.min(distance, a.speed * dt),
                    steps = Math.max(1, Math.ceil(travel / 3));
                for (let i = 0; i < steps; i++) {
                    const x = a.x + dx / distance * travel / steps, y = a.y + dy / distance * travel / steps;
                    const hitsPlayer = a.map === map && ((x - player.x) / (f.rx + player.rx)) ** 2 + ((y - player.y) / (f.ry + player.ry)) ** 2 < 1;
                    if (hitsPlayer || this.blocks(a.map, x, y, f.rx, f.ry, a) || !config.isWalkable(a.map, x, y, f.rx, f.ry)) break;
                    a.x = x;
                    a.y = y;
                    a.moving = true;
                    a.phase = MoonWalkAnimation.advance(a.phase, travel / steps, config.getCharacterScale(a.map));
                }
                if (a.moving) a.facing = facing(dx / distance, dy / distance);
            }
        }
    }

    globalThis.MoonFamilyPatrol = FamilyPatrol;
})();
