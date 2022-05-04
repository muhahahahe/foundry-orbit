let _orbitSocket;

Hooks.once("socketlib.ready", () => {
    _orbitSocket = socketlib.registerModule(MODULE_NAME_ORBIT);
});

Hooks.on("getSceneControlButtons", (controls, scene, user) => {
    if (!game.user.isGM) return;
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
            _orbit.mapTokenAndOrbitPaths();
            _orbit.resetPathIndex();
        }
    });
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
});