function getTileName(value) {
  var names = {
    2: "Baby Emily",
    4: "Tiny Emily",
    8: "Mini Emily",
    16: "Emily",
    32: "Emily Pro",
    64: "Emily Supreme",
    128: "Mega Emily",
    256: "Ultra Emily",
    512: "Hyper Emily",
    1024: "Giga Emily",
    2048: "OMEGA Emily",
    4096: "STINK QUEEN",
  };
  return names[value] || ("Emily " + value);
}