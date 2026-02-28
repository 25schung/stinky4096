function HTMLActuator() {
  // DOM
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.bestPoints       = document.querySelector(".best-points");
  this.messageContainer = document.querySelector(".game-message");
  this.sharingContainer = document.querySelector(".score-sharing");

  // State
  this.score  = 0;
  this.points = 0;

  // Config: change these in ONE place
  this.MAX_MERGE_TILE_VALUE = 4096;   // cap for merge logic (render uses it for styling/message)
  this.SUPER_TILE_THRESHOLD = 4096;   // tiles strictly greater than this get tile-super
  this.IMAGE_PATH = "img/";
  this.IMAGE_EXT  = ".jpg";
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) self.addTile(cell);
      });
    });

    self.updateScore(metadata.score, metadata.points);
    self.updateBestScore(metadata.bestScore, metadata.bestPoints);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // lose
      } else if (metadata.won) {
        // If your template sets `won` when a target is reached,
        // this will show "You win!" at that target (you should set that target to 4096 in logic).
        self.message(true);
      }
    }
  });
};

HTMLActuator.prototype.continueGame = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) container.removeChild(container.firstChild);
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper  = document.createElement("div");
  var inner    = document.createElement("div");
  var img      = document.createElement("img");

  var position = tile.previousPosition || { x: tile.x, y: tile.y };
  var classes  = this.getTileClasses(tile, position);

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");

  // Prefer image; fallback to text if missing image file
  img.src = this.IMAGE_PATH + tile.value + this.IMAGE_EXT;
  img.alt = String(tile.value);
  img.onerror = function () {
    // fallback: show value as text if image doesn't exist
    inner.textContent = String(tile.value);
    img.remove();
  };

  inner.appendChild(img);

  if (tile.previousPosition) {
    window.requestAnimationFrame(function () {
      classes = self.getTileClasses(tile, { x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes);
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  wrapper.appendChild(inner);
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.getTileClasses = function (tile, position) {
  var positionClass = this.positionClass(position);

  // base classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  // only mark as "super" once it's beyond your cap (or threshold)
  if (tile.value > this.SUPER_TILE_THRESHOLD) classes.push("tile-super");

  return classes;
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score, points) {
  this.clearContainer(this.scoreContainer);

  var pointDifference = points - this.points;

  this.score  = score;
  this.points = points;

  // top-left display (your template uses points)
  this.scoreContainer.textContent = this.points;

  if (pointDifference > 0) {
    var punti = document.createElement("div");
    punti.classList.add("score-addition");
    punti.textContent = "+" + pointDifference;
    this.scoreContainer.appendChild(punti);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore, bestPoints) {
  // top-right display (your template uses bestPoints)
  this.bestContainer.textContent = bestPoints;

  // second row right - name mapping
  this.bestPoints.textContent =
    bestScore > 0 ? getTileName(bestScore) : getTileName(2);
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "You win!" : "Game over!";

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};
