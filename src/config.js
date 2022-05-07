let _orbitSocket;

Hooks.once("socketlib.ready", () => {
    _orbitSocket = socketlib.registerModule(MODULE_NAME_ORBIT);
});

Hooks.on("getSceneControlButtons", (controls, scene, user) => {
    if (game.user.isGM) {
        if (!_orbit) _orbit = Orbit.get();
        basictools = controls.find((c) => c["name"] == "token").tools;
        basictools.push({
            name: "Orbit",
            icon: "fas fa-sun",
            active: _orbit.started,
            title: game.i18n.localize("orbit.tools.orbitToggle.hint"),
            onClick: (toggle) => {
                _orbit.started = toggle;
            },
            toggle: true,
        }, {
            button: true,
            visible: true,
            icon: "fas fa-draw-circle",
            name: "remapOrbitPaths",
            title: game.i18n.localize("orbit.tools.remapOrbitPaths.hint"),
            onClick: () => {
                console.log("remapOrbitPaths");
            }
        });
    }
});

Hooks.on("init", () => {
    game.settings.register(MODULE_NAME_ORBIT, "orbitStartOrientation", {
        name: game.i18n.localize("orbit.settings.orbitStartOrientation.name"),
        hint: game.i18n.localize("orbit.settings.orbitStartOrientation.hint"),
        scope: "world",
        config: true,
        type: String,
        chioces: {
            "north": game.i18n.localize("orbit.settings.orbitStartOrientation.north"),
            "east": game.i18n.localize("orbit.settings.orbitStartOrientation.east"),
            "south": game.i18n.localize("orbit.settings.orbitStartOrientation.south"),
            "west": game.i18n.localize("orbit.settings.orbitStartOrientation.west"),
        },
        default: "north",
        onChange: value => {
            console.log(`Orbit start orientation changed to ${value}`);
        }
    });

    game.settings.register(MODULE_NAME_ORBIT, "orbitStartDate", {
        name: game.i18n.localize("orbit.settings.orbitStartDate.name"),
        hint: game.i18n.localize("orbit.settings.orbitStartDate.hint"),
        scope: "world",
        config: true,
        type: Date,
        default: new Date(),
        onChange: value => {
            console.log(`Orbit start date changed to ${value}`);
        }
    });

    game.settings.register(MODULE_NAME_ORBIT, "orbitSpeed", {
        name: game.i18n.localize("orbit.settings.orbitSpeed.name"),
        hint: game.i18n.localize("orbit.settings.orbitSpeed.hint"),
        scope: "world",
        config: true,
        type: Number,
        range: {
            min: 1,
            max: 8760,
            step: 1,
        },
        default: 24,
        onChange: value => {
            console.log(`Orbit speed changed to ${value}`);
        }
    });

    libWrapper.register(MODULE_NAME_ORBIT,"Token.prototype.animateMovement", _orbitAnimateMovement, "OVERRIDE")
});

Hooks.on("renderTokenConfig", (app, html, data) => {
    if (!game.user.isGM) return;
    let toggleHTML= 
    `<div class="form-group">
        <label>${game.i18n.localize("orbit.tokenConfig.enableOrbit.name")}</label>
        <input type="checkbox" name="flags.${MODULE_NAME_ORBIT}.enableOrbit" data-dtype="Boolean">
    </div>
    <div class="form-group">
        <label>${game.i18n.localize("orbit.tokenConfig.makeOrbit.name")}</label>
        <select type="checkbox" name="flags.${MODULE_NAME_ORBIT}.makeOrbit" data-dtype="Boolean">
    <div class="form-group">
        <label>${game.i18n.localize("orbit.tokenConfig.orbitPathName.name")}</label>
        <input type="text" name="flags.${MODULE_NAME_ORBIT}.orbitPathName" value="">
        <label>${game.i18n.localize("orbit.tokenConfig.orbitNodeIndex.hint")}</label>
        <input type="text" name="flags.${MODULE_NAME_ORBIT}.orbitNodeIndex" value="">
    </div>`;
    const lockrotation = html.find("input[name='lockRotation']");
    const formGroup = lockrotation.closest(".form-group");
    formGroup.after(toggleHTML);
    html.find(`input[name='flags.${MODULE_NAME_ORBIT}.enableOrbit']`)[0].checked = app.token.getFlag(MODULE_NAME_ORBIT, "enableOrbit") || false;
    html.find(`input[name='flags.${MODULE_NAME_ORBIT}.orbitPathName']`)[0].value = app.token.getFlag(MODULE_NAME_ORBIT, "orbitPathName") || "";
    html.find(`input[name='flags.${MODULE_NAME_ORBIT}.orbitNodeIndex']`)[0].value = app.token.getFlag(MODULE_NAME_ORBIT, "orbitNodeIndex") || 0;
});

Hooks.on("createDrawing", () => {
    if (game.user.isGM) {
        _orbit.mapTokens();
        _pathOrbit.mapTokensAndOrbits();
    }
});

Hooks.on("updateDrawing", () => {
    if (game.user.isGM) {
        _orbit.mapTokens();
    }
});

Hooks.on("deleteDrawing", () => {
    if (game.user.isGM) {
        _orbit.mapTokens();
    }
});

Hooks.on("createToken", () => {
    if (game.user.isGM) {
        _orbit.mapTokens();
    }
});

Hooks.on("deleteToken", () => {
    if (game.user.isGM) {
        _orbit.mapTokens();
    }
});

Hooks.on("updateToken", async (tokend, updates) => {
    if (game.user.isGM && updates.flags?.orbit && (updates.flags.orbit.orbitPathIndex == undefined || updates.flags.orbit.pathID == undefined)) {
        let token = canvas.tokens.get(tokend.id)
        if (token.document.getFlag(MODULE_NAME_ORBIT, "makeOrbit")) {
            let pathName = token.document.getFlag(MODULE_NAME_ORBIT, "orbitPathName");
            let pathGroup = canvas.drawings.placeables.filter((d) => {
                if (d.data.text == pathName) {
                    return d;
                }
            });
            let pathID
            if (pathGroup[0] != undefined) {
                pathID = pathGroup[0].id;
            }
            await token.document.setFlag(MODULE_NAME_ORBIT, "pathID", pathID);
        }
        _orbit.mapTokens();
    }
});