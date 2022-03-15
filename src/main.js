const MODULE_NAME_ORBIT = "orbit";
let _orbit;
Hooks.on("canvasReady", () => {
    if (!game.user.isGM) return
    let orbitWasStarted = false;
    if (_orbit) {
        _orbit.orbitStop()
        orbitWasStarted = _orbit.started
    }
})