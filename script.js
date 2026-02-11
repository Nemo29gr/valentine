const yesButton = document.querySelector(".btn--yes");
const noButton = document.querySelector(".btn--no");
const neonCard = document.querySelector(".neon-card");
const neonQuestion = document.querySelector(".neon-question");
const dial = document.querySelector(".cluster-dial");
const dialLabel = document.querySelector(".dial-label");

const padding = 18;
const alertDistance = 70;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const noPhrases = [
  "Are you sure?",
  "Still no?",
  "One more time?",
  "Dinner on me?",
  "Change your mind?",
  "Last chance?",
  "Please?",
  "Come on?",
  "Really sure?",
  "Think again?",
  "Maybe yes?",
  "Try the yes button?",
];
let phraseIndex = 0;
let accepted = false;

const speedMax = 240;
const clicksToFull = 5;
const speedIncrement = speedMax / clicksToFull;
const speedYesThreshold = speedMax * 0.6;
const speedAcceptThreshold = speedMax * 0.85;
const dialStartAngle = 210;
const dialSweepTotal = 240;
let speed = 0;
let lastDecay = performance.now();
const decayRate = 20;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let engineBuffer = null;

fetch("car-revving.mp3")
  .then((response) => response.arrayBuffer())
  .then((buffer) => audioContext.decodeAudioData(buffer))
  .then((decodedData) => {
    engineBuffer = decodedData;
  });

const playEngineSound = () => {
  if (!engineBuffer) return;
  if (audioContext.state === "suspended") audioContext.resume();
  const source = audioContext.createBufferSource();
  source.buffer = engineBuffer;
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 3;
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start(0, 1);
};

const setButtonPosition = (button, x, y) => {
  button.style.position = "fixed";
  button.style.left = `${x}px`;
  button.style.top = `${y}px`;
  button.style.transform = "rotate(0deg)";
};

const getSafePosition = (button) => {
  const rect = button.getBoundingClientRect();
  const minX = padding;
  const minY = padding;
  const maxX = window.innerWidth - padding - rect.width;
  const maxY = window.innerHeight - padding - rect.height;

  return {
    x: clamp(Math.random() * (maxX - minX) + minX, minX, maxX),
    y: clamp(Math.random() * (maxY - minY) + minY, minY, maxY),
  };
};

const isNear = (button, x, y, distance) => {
  const rect = button.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return Math.hypot(centerX - x, centerY - y) <= distance;
};

const moveNoButton = () => {
  if (accepted) {
    return;
  }
  const { x, y } = getSafePosition(noButton);
  setButtonPosition(noButton, x, y);
  phraseIndex = (phraseIndex + 1) % noPhrases.length;
  neonQuestion.textContent = noPhrases[phraseIndex];
};

const updateDial = () => {
  const progress = clamp(speed / speedMax, 0, 1);
  const fillDeg = progress * dialSweepTotal;
  dial.style.setProperty("--dial-fill", `${fillDeg}deg`);
  dial.style.setProperty(
    "--dial-needle",
    `${dialStartAngle + fillDeg}deg`
  );
  dialLabel.textContent = speed >= speedYesThreshold ? "YES" : "SPEED";
};

const decayDial = (timestamp) => {
  if (accepted) {
    return;
  }
  const delta = (timestamp - lastDecay) / 1000;
  lastDecay = timestamp;
  speed = Math.max(0, speed - decayRate * delta);
  updateDial();
  requestAnimationFrame(decayDial);
};

updateDial();
requestAnimationFrame(decayDial);

const handleMouseMove = (event) => {
  if (isNear(noButton, event.clientX, event.clientY, alertDistance)) {
    moveNoButton();
  }
};

const handleTouchStart = (event) => {
  if (!event.touches.length) {
    return;
  }
  const touch = event.touches[0];
  if (isNear(noButton, touch.clientX, touch.clientY, alertDistance)) {
    moveNoButton();
  }
};

window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("touchstart", handleTouchStart);

yesButton.addEventListener("click", () => {
  document.body.classList.remove("revving");
  void neonCard.offsetWidth;
  document.body.classList.add("revving");
  playEngineSound();

  speed = Math.min(speedMax, speed + speedIncrement);
  updateDial();

  if (speed >= speedAcceptThreshold) {
    accepted = true;
    updateDial();
    document.body.classList.add("accepted");
    noButton.disabled = true;
    noButton.style.pointerEvents = "none";
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("touchstart", handleTouchStart);
  }
});
