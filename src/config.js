let _orbitSocket;

Hooks.once("socketlib.ready", () => {
    _orbitSocket = socketlib.registerModule(MODULE_NAME_ORBIT);
});

Hooks.on("getSceneControlButtons", (controls, a, b) => {
    if (game.user.isGM) {
        basictools = controls.find((c) => c["name"] == "token").tools;
        basictools.push({
            name: "Orbit",
            icon: "fas fa-globe",
            active: _orbit.started,
            title: game.i18n.localize("orbit.tools.orbitToggle.hint"),
            onClick: () => {
                console.log("Orbit button clicked");
            },
            toggle: true,
        }, {
            button: true,
            visible: true,
            icon: "far fa-dot-circle",
            name: "remapOrbitPaths",
            title: game.i18n.localize("orbit.tools.remapOrbitPaths.hint"),
            onClick: () => {
                console.log("Orbit Remap button clicked");
            }
        });
    }
});

Hooks.on("ready", () => {
    if (game.modules.get("foundryvtt-simple-calendar")?.active) {
        console.log("FoundryVTT Simple Calendar is active");
        console.log(SimpleCalendar.api.getAllMonths());
        console.log("end of log");
        game.settings.register(MODULE_NAME_ORBIT, "orbitStartOrientation", {
            name: game.i18n.localize("orbit.settings.orbitStartOrientation.name"),
            hint: game.i18n.localize("orbit.settings.orbitStartOrientation.hint"),
            scope: "world",
            config: true,
            type: Number,
            choices: {
                0: game.i18n.localize("orbit.settings.orbitStartOrientation.north"),
                1: game.i18n.localize("orbit.settings.orbitStartOrientation.east"),
                2: game.i18n.localize("orbit.settings.orbitStartOrientation.south"),
                3: game.i18n.localize("orbit.settings.orbitStartOrientation.west"),
            },
            default: 0,
            onChange: value => {
                console.log(`Orbit start orientation changed to ${value}`);
            }
        });

        // let currentCalendar = SimpleCalendar.api.getCurrentCalendar();
        // let months = currentCalendar.months;
        // let daysInMonth = months[0].numberOfDays;
        game.settings.register(MODULE_NAME_ORBIT, "orbitStartDateMonth", {
            name: game.i18n.localize("orbit.settings.orbitStartDateMonth.name"),
            hint: game.i18n.localize("orbit.settings.orbitStartDateMonth.hint"),
            scope: "world",
            config: true,
            type: Number,
            // choices: {
            //     // for each month in months add the choice form 1 to ...
            //     ...months.map((month, index) => {
            //         return {
            //             [index]: month.name,
            //         };
            //     }),
            // },
            default: 0,
        
            onChange: value => {
                console.log(`Orbit start month changed to ${value}`);
                //find the number of days in the month
                // let month = months.find((month) => month.name == value);
                // daysInMonth = month.numberOfDays;
            }
        });
        //create an array of days from 1 to ... from the single Number in daysInMonth
        // let days
        // for (let i = 1; i <= daysInMonth; i++) {
        //     days.push(i);
        // }
        game.settings.register(MODULE_NAME_ORBIT, "orbitStartDateDay", {
            name: game.i18n.localize("orbit.settings.orbitStartDateDay.name"),
            hint: game.i18n.localize("orbit.settings.orbitStartDateDay.hint"),
            scope: "world",
            config: true,
            type: Number,
            // choices: {
            //     // add a choice for each day in days
            //     ...days.map((day) => {
            //         return {
            //             [day]: day,
            //         };
            //     }),
            // },
            default: 0,
        
            onChange: value => {
                console.log(`Orbit start day changed to ${value}`);
            }
        });
        game.settings.register(MODULE_NAME_ORBIT, "orbitStartDateYear", {
            name: game.i18n.localize("orbit.settings.orbitStartDateYear.name"),
            hint: game.i18n.localize("orbit.settings.orbitStartDateYear.hint"),
            scope: "world",
            config: true,
            type: Number,
            default: 0,
        
            onChange: value => {
                console.log(`Orbit start Year changed to ${value}`);
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

        libWrapper.register(MODULE_NAME_ORBIT,"Token.prototype.animateMovement", _orbitAnimateMovement, "OVERRIDE");
    }
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
        <label>${game.i18n.localize("orbit.tokenConfig.orbitNodeIndex.name")}</label>
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