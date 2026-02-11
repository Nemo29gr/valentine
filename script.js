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

const dialFillMax = 240;
const dialYesThreshold = 10;
const dialStartAngle = 210;
let dialFill = 0;
let lastDecay = performance.now();
const decayRate = 36;

const playEngineSound = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const audioContext = new AudioContextClass();
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const noiseBuffer = audioContext.createBuffer(
    1,
    audioContext.sampleRate,
    audioContext.sampleRate
  );
  const noiseSource = audioContext.createBufferSource();
  const noiseFilter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  const compressor = audioContext.createDynamicsCompressor();
  const filter = audioContext.createBiquadFilter();

  oscillator1.type = "sawtooth";
  oscillator2.type = "triangle";
  oscillator1.frequency.setValueAtTime(110, audioContext.currentTime);
  oscillator2.frequency.setValueAtTime(55, audioContext.currentTime);
  oscillator1.frequency.exponentialRampToValueAtTime(
    520,
    audioContext.currentTime + 0.4
  );
  oscillator2.frequency.exponentialRampToValueAtTime(
    260,
    audioContext.currentTime + 0.4
  );

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(320, audioContext.currentTime);
  filter.frequency.exponentialRampToValueAtTime(
    1400,
    audioContext.currentTime + 0.35
  );

  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(180, audioContext.currentTime);
  noiseFilter.frequency.exponentialRampToValueAtTime(
    380,
    audioContext.currentTime + 0.4
  );

  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    1.25,
    audioContext.currentTime + 0.06
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + 1.1
  );

  compressor.threshold.setValueAtTime(-20, audioContext.currentTime);
  compressor.knee.setValueAtTime(18, audioContext.currentTime);
  compressor.ratio.setValueAtTime(8, audioContext.currentTime);
  compressor.attack.setValueAtTime(0.005, audioContext.currentTime);
  compressor.release.setValueAtTime(0.12, audioContext.currentTime);

  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i += 1) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  oscillator1.connect(filter);
  oscillator2.connect(filter);
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(filter);
  filter.connect(gain);
  gain.connect(compressor);
  compressor.connect(audioContext.destination);

  oscillator1.start();
  oscillator2.start();
  noiseSource.start();
  oscillator1.stop(audioContext.currentTime + 1.1);
  oscillator2.stop(audioContext.currentTime + 1.1);
  noiseSource.stop(audioContext.currentTime + 1.1);
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
  dial.style.setProperty("--dial-fill", `${dialFill}deg`);
  dial.style.setProperty(
    "--dial-needle",
    `${dialStartAngle + dialFill}deg`
  );
  dialLabel.textContent = dialFill >= dialYesThreshold ? "YES" : "SPEED";
};

const decayDial = (timestamp) => {
  if (accepted) {
    return;
  }
  const delta = (timestamp - lastDecay) / 1000;
  lastDecay = timestamp;
  dialFill = Math.max(0, dialFill - decayRate * delta);
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

  dialFill = Math.min(dialFillMax, dialFill + 70);
  updateDial();

  if (dialFill >= dialYesThreshold) {
    accepted = true;
    dialFill = dialFillMax;
    updateDial();
    document.body.classList.add("accepted");
    noButton.disabled = true;
    noButton.style.pointerEvents = "none";
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("touchstart", handleTouchStart);
  }
});
