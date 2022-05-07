class Orbit {
    constructor() {
        this.tokens = [];
        this.characters = [];
        this.executeOrbit = false;
        this.started = false;
        this.orbitStartOrientation = game.settings.get(MODULE_NAME_ORBIT, "orbitStartOrientation");
        this.orbitSpeed = game.settings.get(MODULE_NAME_ORBIT, "orbitSpeed");
        this.orbitStartDate = game.settings.get(MODULE_NAME_ORBIT, "orbitStartDate");
        this.DEBUG = false;
    }

    static get() {
        return new Orbit();
    }

    mapOrbitPaths() {
        let orbitCircles = canvas.drawings.placeables.filter((p) => p.data.text == "Orbit");
        this.tokens = [];
        canvas.tokens.placeables.filter((t) => t.document.getFlag(MODULE_NAME_ORBIT, "enableOrbit")).forEach((t) => {
            let tokenDrawing;
            for (let circles of orbitCircles) {
                let c = PIXI.Circle(this.adjustCirclePoints(circles));
                if (c.contains(t.position)) tokenDrawing = c;
            }
            this.tokens.push({
                tokenDocument: t,
                visitedPositions: [`${t.x}-${t.y}`],
                orbitCircle: tokenDrawing 
            });
        });
        this.characters = canvas.tokens.placeables.filter((t) => t.actor && (t.actor?.type == "character" || t.actor?.type == "char" || t.actor?.hasPlayerOwner));
    }

    async orbitDelay() {
        setTimeout(() => {
            this.executeOrbit = true;
        }, /*game.settings.get(MODULE_NAME_ORBIT, "orbitDelay")*/ 250);
    }

    orbitStart() {
        this.mapTokens();
        this.orbitDelay();
        canvas.app.ticker.add(this.orbitCompute);
    }

    orbitStop() {
        canvas.app.ticker.remove(this.orbitCompute);
    }

    orbitCompute() {
        if (_orbit.executeOrbit && !game.paused && _orbit.started) {
            let perfStart, perfEnd;
            if (_orbit.DEBUG) perfStart = performance.now();
            _orbit.mapTokens();
            _orbit.executeOrbit = false;
            _orbit.orbitDelay();
            for (let token of _orbit.tokens) {
                if (token.tokenDocument._controlled) continue;
                let newPosition = _orbit.getNextPosition(token);
                updates.push({
                    _id: token.tokenDocument._id,
                    x: newPosition.x,
                    y: newPosition.y
                });
                token.visitedPositions.push(`${newPosition.x}-${newPosition.y}`);
            }
            canvas.scene.updateEmbeddedDocuments("Token", updates);

            if (_orbit.DEBUG) {
                perfEnd = performance.now();
                console.log(`Orbit compute took: ${perfEnd - perfStart}ms, FPS: ${Math.round(canvas.app.ticker.FPS)}`);
            }
        }
    }

    getNextPosition(token) {
        //calculate the next position on the circle from the current position
        let g = canvas.dimensions.size;
        let position = [
            {
              x: token.x + g,
              y: token.y,
              center: { x: token.center.x + g, y: token.center.y },
            },
            {
              x: token.x - g,
              y: token.y,
              center: { x: token.center.x - g, y: token.center.y },
            },
            {
              x: token.x,
              y: token.y + g,
              center: { x: token.center.x, y: token.center.y + g },
            },
            {
              x: token.x,
              y: token.y - g,
              center: { x: token.center.x, y: token.center.y - g },
            },
          ];
        let nextPosition = position[Math.floor(Math.random() * position.length)];
        if (token.orbitCircle) {
            let c = token.orbitCircle;
            let p = nextPosition;
            let cX = c.x;
            let cY = c.y;
            let pX = p.x;
            let pY = p.y;
            let cCenterX = c.center.x;
            let cCenterY = c.center.y;
            let pCenterX = p.center.x;
            let pCenterY = p.center.y;

            let a = Math.abs(cX - pX);
            let b = Math.abs(cY - pY);
            c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
            a = Math.abs(cCenterX - pCenterX);
            b = Math.abs(cCenterY - pCenterY);
            cCenter = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
            a = Math.abs(cX - cCenterX);
            b = Math.abs(cY - cCenterY);
            cX = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
            a = Math.abs(pX - pCenterX);
            b = Math.abs(pY - pCenterY);
            pX = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
            a = Math.abs(pX - cX);
            b = Math.abs(pY - cY);
            pX = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
            if (cX + cCenter + pX > c + cCenter + pCenter) {
                return nextPosition;
            } else {
                return this.getNextPosition(token);
            }
        } else {
            return nextPosition;
        }
    }

    adjustCirclePoints(circle) {
        let globalpoints = [];
        for (let i = 0; i < circle.points.length; i++) {
            let point = circle.points[i];
            globalpoints.push(circle.position.x + point.x);
            globalpoints.push(circle.position.y + point.y);
        }
        return globalpoints;
    }
}