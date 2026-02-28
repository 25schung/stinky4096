// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  var requiredGlobals = [
    "GameManager",
    "KeyboardInputManager",
    "HTMLActuator",
    "LocalStorageManager"
  ];

  var missing = requiredGlobals.filter(function (name) {
    return typeof window[name] === "undefined";
  });

  if (missing.length) {
    console.error(
      "Game startup failed: missing required globals: " + missing.join(", ")
    );
    return;
  }

  new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
});
