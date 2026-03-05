const IMAGE_FILES = [
  "4t_earth.avif",
  "4t_fire.avif",
  "4t_water.avif",
  "4t_wind.avif",
  "Anatomy.avif",
  "Angel.avif",
  "angelic.avif",
  "anothergenie.avif",
  "balloons.avif",
  "balloonslotus.avif",
  "cear.avif",
  "clockeyes.avif",
  "clockie.avif",
  "conflicted.avif",
  "connected.avif",
  "crowned.avif",
  "Devil.avif",
  "devious.avif",
  "Directions.avif",
  "directionsfull.avif",
  "dissolve.avif",
  "Doves.avif",
  "Fire.avif",
  "flowereyes.avif",
  "ghastly.avif",
  "glitch.avif",
  "grail_reptile.avif",
  "grail_tattoo.avif",
  "grail_zombie.avif",
  "grailgenie.avif",
  "hannibal1.avif",
  "hannibal2.avif",
  "hannibal3.avif",
  "hearttoheart.avif",
  "hearttohearttoheart.avif",
  "Hoodie.avif",
  "hoodie2.avif",
  "Loved.avif",
  "LovedBridge.avif",
  "moss.avif",
  "mossy.avif",
  "mystical.avif",
  "nakeddevil.avif",
  "natural.avif",
  "Overgrown.avif",
  "paint.avif",
  "pen.avif",
  "projector.avif",
  "psychedelic.avif",
  "pumpkin.avif",
  "ski.avif",
  "SkiSki.avif",
  "smoke.avif",
  "Smokie.avif",
  "Snakes.avif",
  "snakey.avif",
  "space.avif",
  "spacer.avif",
  "sparkle2.avif",
  "storm.avif",
  "Sundown.avif",
  "thinker.avif",
  "universal.avif",
  "windy.avif",
  "worldender.avif",
  "Yang.avif",
  "Yin.avif",
];

const LEVELS = [3, 4, 6, 8];
const LEVEL_COUNTDOWN = [3, 3, 5, 5];

const MUSIC_FILES = [
  "Out of Flux - morning.mp3",
  "Out of Flux - together.mp3",
  "Skygaze - COTTON CLOUDS.mp3",
  "Skygaze - POST BLOOM - Creative Cut - Chill.mp3",
  "Wav Two - Ocean Hued - Instrumental version.mp3",
  "Joley - Pine.mp3"
];

let currentLevel = 0;
let flippedCards = [];
let lockBoard = false;
let matchesFound = 0;
let moves = 0;
let seconds = 0;
let timerInterval = null;
let bestTime = null;
let audioCtx = null;
let backgroundMusic = null;
let soundEffectsMuted = false;
let musicStarted = false;
let musicVolume = 0.25;
let currentMusicIndex = 0;
let isMusicPaused = false;

const introScreen = document.getElementById("intro-screen");
const gameEl = document.getElementById("game");
const board = document.getElementById("board");
const status = document.getElementById("status");
const moveCount = document.getElementById("move-count");
const timerDisplay = document.getElementById("timer");
const bestTimeDisplay = document.getElementById("best-time");
const playAgainBtn = document.getElementById("play-again");
const countdownEl = document.getElementById("countdown");
const levelDotsEl = document.getElementById("level-dots");
const startBtn = document.getElementById("start-btn");
const levelSplash = document.getElementById("level-splash");
const winTitle = document.getElementById("win-title");
const winStats = document.getElementById("win-stats");
const scorecardWrap = document.getElementById("scorecard-wrap");
const scorecardImg = document.getElementById("scorecard-img");
const scorecardTime = document.getElementById("scorecard-time");
const scorecardMessage = document.getElementById("scorecard-message");
const scorecardSub = document.getElementById("scorecard-sub");
const scorecardFavicon = document.getElementById("scorecard-favicon");

// ===== INTRO =====
let introDone = false;
let introTimeout = null;

function dismissIntro() {
  if (introDone) return;
  introDone = true;
  if (introTimeout) clearTimeout(introTimeout);
  
  // Resume audio context (required for autoplay)
  getAudioCtx();
  
  // Start music - user has interacted by clicking
  startBackgroundMusic();
  
  // Ensure music plays after a short delay to allow audio context to be ready
  setTimeout(() => {
    if (backgroundMusic && musicVolume > 0 && !isMusicPaused) {
      const playPromise = backgroundMusic.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          updatePlayPauseButton();
        }).catch(e => {
          console.log("Play failed, will retry:", e);
          // Retry once more after a brief delay
          setTimeout(() => {
            if (backgroundMusic && backgroundMusic.paused && musicVolume > 0) {
              backgroundMusic.play().then(() => {
                updatePlayPauseButton();
              }).catch(err => console.log("Retry failed:", err));
            }
          }, 200);
        });
      }
    }
  }, 100);
  
  introScreen.style.transition = "opacity 0.4s ease";
  introScreen.style.opacity = "0";
  introScreen.style.pointerEvents = "none";
  setTimeout(() => {
    introScreen.style.display = "none";
    gameEl.classList.remove("hidden");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        gameEl.classList.add("visible");
        // Show audio controls at the exact same time as game container
        const audioControls = document.getElementById("audio-controls");
        if (audioControls) {
          audioControls.classList.add("visible");
        }
        buildBoard();
      });
    });
  }, 400);
}

introTimeout = setTimeout(dismissIntro, 3400);
introScreen.addEventListener("click", dismissIntro);

// ===== AUDIO =====
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function startGame() {
  getAudioCtx();
  startBackgroundMusic();
  startBtn.style.display = "none";
  
  // Show audio controls - they should already be visible if intro was dismissed
  // but ensure they're visible when game starts directly
  const audioControls = document.getElementById("audio-controls");
  if (audioControls && !audioControls.classList.contains("visible")) {
    audioControls.classList.add("visible");
  }
  
  buildBoard();
}

// ===== IMAGE TO BASE64 =====
function toBase64(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(src);
    img.src = src + "?v=" + Date.now();
  });
}

function showLevelSplash(text, callback) {
  board.style.visibility = "hidden";
  levelSplash.style.display = "block";
  levelSplash.style.visibility = "visible";
  levelSplash.textContent = text;
  levelSplash.className = "";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      levelSplash.classList.add("show");
      setTimeout(() => {
        levelSplash.classList.remove("show");
        levelSplash.classList.add("hide");
        setTimeout(() => {
          levelSplash.textContent = "";
          levelSplash.className = "";
          levelSplash.style.display = "";
          board.style.visibility = "visible";
          if (callback) callback();
        }, 400);
      }, 1200);
    });
  });
}

function launchConfetti() {
  const colors = ["#4ecca3", "#ff4444", "#ffd166", "#a78bfa", "#f472b6", "#60a5fa", "#3d2b00"];
  for (let i = 0; i < 120; i++) {
    setTimeout(() => {
      const piece = document.createElement("div");
      piece.classList.add("confetti-piece");
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = (8 + Math.random() * 8) + "px";
      piece.style.height = (10 + Math.random() * 10) + "px";
      piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      const dur = 2 + Math.random() * 2;
      piece.style.animationDuration = dur + "s";
      piece.style.animationDelay = "0s";
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), dur * 1000 + 100);
    }, i * 18);
  }
}

function getScoreTier(secs) {
  if (secs <= 29) return {
    img: "page3.png",
    message: "Wow! Under 30 Seconds!",
    sub: "Your memory is incredible!"
  };
  if (secs <= 45) return {
    img: "page2.png",
    message: "Great Job!",
    sub: "Your memory is seriously impressive."
  };
  return {
    img: "page1.png",
    message: "Nice Work!",
    sub: "Can you beat that score next time?"
  };
}

async function showWinScreen() {
  const isNewBest = bestTime === null || seconds < bestTime;
  if (isNewBest) {
    bestTime = seconds;
    bestTimeDisplay.textContent = `Best: ${bestTime}s`;
  }

  board.classList.add("fade-out");

  setTimeout(async () => {
    board.style.display = "none";
    countdownEl.style.display = "none";
    levelSplash.style.display = "none";

    const tier = getScoreTier(seconds);

    const [imgBase64, faviconBase64] = await Promise.all([
      toBase64(`Images/${tier.img}`),
      toBase64("favicon.png")
    ]);

    // Pre-crop the image to maintain aspect ratio (180:240 = 3:4)
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgBase64;

    await new Promise((resolve) => {
      if (img.complete) {
        resolve();
      } else {
        img.onload = resolve;
        img.onerror = resolve;
      }
    });

    // Calculate crop to maintain 3:4 aspect ratio
    const targetAspect = 180 / 240; // 0.75
    const naturalAspect = img.naturalWidth / img.naturalHeight;

    let cropWidth, cropHeight, cropX, cropY;

    if (naturalAspect > targetAspect) {
      // Image is wider - crop width
      cropHeight = img.naturalHeight;
      cropWidth = cropHeight * targetAspect;
      cropX = (img.naturalWidth - cropWidth) / 2;
      cropY = 0;
    } else {
      // Image is taller - crop height
      cropWidth = img.naturalWidth;
      cropHeight = cropWidth / targetAspect;
      cropX = 0;
      cropY = (img.naturalHeight - cropHeight) / 2;
    }

    // Create cropped canvas at high resolution (4x for sharp export)
    const scale = 4;
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = 180 * scale;
    cropCanvas.height = 240 * scale;
    const cropCtx = cropCanvas.getContext('2d');
    
    // Use high-quality image rendering
    cropCtx.imageSmoothingEnabled = true;
    cropCtx.imageSmoothingQuality = 'high';
    
    // Draw the cropped image at high resolution
    cropCtx.drawImage(
      img, 
      cropX, cropY, cropWidth, cropHeight, 
      0, 0, 
      180 * scale, 240 * scale
    );

    // Use the pre-cropped image
    scorecardImg.src = cropCanvas.toDataURL("image/png");
    scorecardFavicon.src = faviconBase64;
    scorecardTime.textContent = seconds + "s";
    scorecardMessage.textContent = tier.message;
    scorecardSub.textContent = tier.sub;

    scorecardWrap.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 16px; margin-top: 10px; opacity: 0; transition: opacity 0.6s ease;";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scorecardWrap.style.opacity = "1";
      });
    });
  }, 650);
}

async function downloadScorecard() {
  const card = document.getElementById("scorecard");
  
  // On mobile, temporarily remove scale transform for download to capture full size
  const isMobile = window.innerWidth <= 768;
  const computedStyle = window.getComputedStyle(card);
  const hasScaleTransform = computedStyle.transform && computedStyle.transform !== 'none' && computedStyle.transform.includes('scale');
  
  // Store original styles
  const originalBorderRadius = card.style.borderRadius;
  const originalTransform = card.style.transform;
  
  // Temporarily remove rounded corners and scale transform for clean capture
  if (isMobile && hasScaleTransform) {
    card.style.transform = 'none';
  }
  card.style.borderRadius = '0';
  
  // Wait for layout to settle after removing transform
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Get exact dimensions after transform removal
  const cardRect = card.getBoundingClientRect();
  const cardWidth = Math.floor(cardRect.width);
  const cardHeight = Math.floor(cardRect.height);
  
  // On mobile, use exact card dimensions (420px width, includes border)
  // The card has a 3px border, so actual content is 420px total
  const actualWidth = isMobile ? 420 : cardWidth;
  // Height is image (240px) + top padding (16px) + bottom padding (16px) + border (3px top + 3px bottom) = 278px
  const actualHeight = isMobile ? 278 : cardHeight;
  
  html2canvas(card, {
    backgroundColor: null, // No background - we want only the card
    scale: 4,
    useCORS: true,
    allowTaint: true,
    logging: false,
    imageTimeout: 0,
    width: actualWidth,
    height: actualHeight,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
    windowWidth: actualWidth,
    windowHeight: actualHeight,
    removeContainer: false,
    onclone: (clonedDoc) => {
      // Image is already pre-cropped, just ensure dimensions
      const clonedImg = clonedDoc.getElementById('scorecard-img');
      if (clonedImg) {
        clonedImg.style.width = '180px';
        clonedImg.style.height = '240px';
        clonedImg.style.objectFit = 'fill';
      }
      // On mobile, ensure no extra margins/padding/positioning
      if (isMobile) {
        const clonedCard = clonedDoc.getElementById('scorecard');
        if (clonedCard) {
          clonedCard.style.margin = '0';
          clonedCard.style.padding = '0';
          clonedCard.style.position = 'static';
          clonedCard.style.left = '0';
          clonedCard.style.top = '0';
          clonedCard.style.transform = 'none';
        }
        // Also ensure parent has no padding/margin
        const clonedWrap = clonedDoc.getElementById('scorecard-wrap');
        if (clonedWrap) {
          clonedWrap.style.margin = '0';
          clonedWrap.style.padding = '0';
        }
      }
    },
  }).then(canvas => {
    // Crop to exact card dimensions (remove any extra space)
    const scale = 4;
    
    // On mobile, crop to exact card dimensions
    if (isMobile) {
      const scale = 4;
      const targetWidth = 420 * scale; // Exact card width
      const targetHeight = 278 * scale; // Exact card height (240 image + 32 padding + 6 border)
      
      // The canvas should already be the right size, but crop to be sure
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = targetWidth;
      croppedCanvas.height = targetHeight;
      const croppedCtx = croppedCanvas.getContext('2d');
      
      // Draw only the card area (from top-left, exact dimensions)
      croppedCtx.drawImage(
        canvas,
        0,
        0,
        Math.min(targetWidth, canvas.width),
        Math.min(targetHeight, canvas.height),
        0,
        0,
        targetWidth,
        targetHeight
      );
      
      // Use the cropped canvas
      const link = document.createElement("a");
      link.download = "LT3ScoreCard.png";
      link.href = croppedCanvas.toDataURL("image/png", 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Restore original styles
      card.style.borderRadius = originalBorderRadius;
      card.style.margin = originalMargin;
      card.style.padding = originalPadding;
      if (isMobile && hasScaleTransform) {
        card.style.transform = originalTransform;
      }
      return;
    }
    
    // Desktop: use original cropping logic
    const targetWidth = actualWidth * scale;
    const targetHeight = actualHeight * scale;
    
    // Create a new canvas with exact dimensions
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = targetWidth;
    croppedCanvas.height = targetHeight;
    const croppedCtx = croppedCanvas.getContext('2d');
    
    // Fill with background color first
    croppedCtx.fillStyle = "#fdf8ee";
    croppedCtx.fillRect(0, 0, targetWidth, targetHeight);
    
    // Draw the original canvas, cropping to exact dimensions
    croppedCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);
    
    // Restore original styles (desktop only, mobile already restored)
    card.style.borderRadius = originalBorderRadius;
    
    const link = document.createElement("a");
    link.download = "LT3ScoreCard.png";
    link.href = croppedCanvas.toDataURL("image/png", 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }).catch(err => {
    // Restore original styles on error
    card.style.borderRadius = originalBorderRadius;
    card.style.margin = originalMargin;
    card.style.padding = originalPadding;
    if (isMobile && hasScaleTransform) {
      card.style.transform = originalTransform;
    }
    console.error("Download failed:", err);
    alert("Download failed. Try right-clicking the scorecard and saving as image.");
  });
}

function playCardFlip() {
  if (soundEffectsMuted) return;
  try {
    const ctx = getAudioCtx();
    const bufferSize = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.sin(t * Math.PI) * Math.pow(1 - t, 1.5);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch(e) {}
}

function playChime() {
  if (soundEffectsMuted) return;
  try {
    const ctx = getAudioCtx();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch(e) {}
}

function playBuzz() {
  if (soundEffectsMuted) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch(e) {}
}

function playWinFanfare() {
  if (soundEffectsMuted) return;
  try {
    const ctx = getAudioCtx();
    [
      { freq: 523.25, time: 0 },
      { freq: 659.25, time: 0.12 },
      { freq: 783.99, time: 0.24 },
      { freq: 1046.5, time: 0.36 },
      { freq: 783.99, time: 0.52 },
      { freq: 1046.5, time: 0.64 },
    ].forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.35);
      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + 0.35);
    });
  } catch(e) {}
}

function renderDots() {
  levelDotsEl.innerHTML = "";
  LEVELS.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.classList.add("dot");
    if (i < currentLevel) dot.classList.add("complete");
    if (i === currentLevel) dot.classList.add("active");
    levelDotsEl.appendChild(dot);
  });
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    seconds++;
    timerDisplay.textContent = `Time: ${seconds}s`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function resetStats() {
  moves = 0;
  seconds = 0;
  moveCount.textContent = "Moves: 0";
  timerDisplay.textContent = "Time: 0s";
}

function flipCardsUp(cards, callback) {
  cards.forEach((card, i) => {
    setTimeout(() => {
      playCardFlip();
      card.classList.add("flipped");
      if (i === cards.length - 1 && callback) setTimeout(callback, 200);
    }, i * 80);
  });
}

function flipCardsDown(cards, callback) {
  cards.forEach((card, i) => {
    setTimeout(() => {
      playCardFlip();
      card.classList.remove("flipped");
      if (i === cards.length - 1 && callback) setTimeout(callback, 200);
    }, i * 80);
  });
}

function runPreviewCountdown(secs, callback) {
  let count = secs;
  function showCount() {
    countdownEl.textContent = count;
    countdownEl.classList.remove("pulse");
    requestAnimationFrame(() => requestAnimationFrame(() => countdownEl.classList.add("pulse")));
  }
  showCount();
  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      showCount();
    } else {
      countdownEl.textContent = "";
      countdownEl.classList.remove("pulse");
      clearInterval(interval);
      callback();
    }
  }, 1000);
}

function buildBoard() {
  winTitle.className = "";
  winTitle.textContent = "";
  winStats.className = "";
  winStats.innerHTML = "";
  scorecardWrap.style.cssText = "display: none;";

  countdownEl.style.display = "";
  countdownEl.classList.remove("pulse");
  levelSplash.style.display = "";
  levelSplash.style.visibility = "";
  board.style.display = "";
  board.classList.remove("fade-out");
  board.style.visibility = "visible";
  board.innerHTML = "";

  matchesFound = 0;
  flippedCards = [];
  lockBoard = true;
  startBtn.style.display = "none";
  countdownEl.textContent = "";
  levelSplash.textContent = "";
  levelSplash.className = "";
  stopTimer();
  renderDots();

  const pairsCount = LEVELS[currentLevel];
  const uniqueImages = [...new Map(IMAGE_FILES.map(f => [f.toLowerCase(), f])).values()];
  const selectedImages = shuffle([...uniqueImages]).slice(0, pairsCount);
  const pairs = shuffle([...selectedImages, ...selectedImages]);

  const totalCards = pairs.length;
  let columns, cardSize;
  
  if (window.innerWidth <= 768) {
    // Mobile: smaller cards, adjust columns for better layout
    cardSize = window.innerWidth <= 480 ? 80 : 100;
    if (totalCards === 6) {
      columns = 3; // 3x2 grid
    } else if (totalCards === 8) {
      columns = 4; // 4x2 grid
    } else if (totalCards === 12) {
      columns = 3; // 3x4 grid
    } else {
      columns = 4; // 4x4 grid
    }
  } else {
    // Desktop: keep original
    columns = totalCards === 6 ? 3 : 4;
    cardSize = 160;
  }
  
  board.style.gridTemplateColumns = `repeat(${columns}, ${cardSize}px)`;

  const cardEls = [];
  pairs.forEach((filename) => {
    const card = document.createElement("div");
    card.classList.add("card");
    if (window.innerWidth <= 768) {
      card.style.width = cardSize + "px";
      card.style.height = cardSize + "px";
    } else {
      card.style.width = "";
      card.style.height = "";
    }
    card.dataset.image = filename;
    const inner = document.createElement("div");
    inner.classList.add("card-inner");
    const front = document.createElement("div");
    front.classList.add("card-front");
    const img = document.createElement("img");
    img.src = `Images/${filename}`;
    img.alt = filename.replace(/\.[^.]+$/, "");
    front.appendChild(img);
    const back = document.createElement("div");
    back.classList.add("card-back");
    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    card.addEventListener("click", onCardClick);
    board.appendChild(card);
    cardEls.push(card);
  });

  status.textContent = `Level ${currentLevel + 1} - Get ready...`;
  setTimeout(() => {
    status.textContent = `Level ${currentLevel + 1} - Memorise the cards!`;
    flipCardsUp(cardEls, () => {
      runPreviewCountdown(LEVEL_COUNTDOWN[currentLevel], () => {
        flipCardsDown(cardEls, () => {
          status.textContent = `Level ${currentLevel + 1} - Find the matching pairs.`;
          lockBoard = false;
          startTimer();
        });
      });
    });
  }, 600);
}

function onCardClick(e) {
  const card = e.currentTarget;
  if (lockBoard) return;
  if (card.classList.contains("flipped")) return;
  if (card.classList.contains("matched")) return;
  
  // Try to start/play music on first card click
  // (handles case where intro auto-dismissed and autoplay was blocked)
  if (!musicStarted) {
    // Music hasn't been started at all
    getAudioCtx();
    startBackgroundMusic();
    setTimeout(() => {
      if (backgroundMusic && backgroundMusic.paused && musicVolume > 0 && !isMusicPaused) {
        backgroundMusic.play().then(() => {
          updatePlayPauseButton();
        }).catch(e => console.log("Play failed:", e));
      }
    }, 50);
  } else if (backgroundMusic && backgroundMusic.paused && musicVolume > 0 && !isMusicPaused) {
    // Music was started but is paused (autoplay was blocked), try to play now with user interaction
    getAudioCtx(); // Ensure audio context is resumed
    backgroundMusic.play().then(() => {
      updatePlayPauseButton();
    }).catch(e => {
      console.log("Play failed on card click:", e);
      // If it still fails, try once more after a brief delay
      setTimeout(() => {
        if (backgroundMusic && backgroundMusic.paused) {
          backgroundMusic.play().then(() => {
            updatePlayPauseButton();
          }).catch(err => console.log("Retry failed:", err));
        }
      }, 100);
    });
  }
  
  playCardFlip();
  card.style.transform = "none";
  card.classList.add("flipped");
  flippedCards.push(card);
  if (flippedCards.length === 2) {
    moves++;
    moveCount.textContent = `Moves: ${moves}`;
    checkForMatch();
  }
}

function checkForMatch() {
  lockBoard = true;
  const [first, second] = flippedCards;
  const isMatch = first.dataset.image === second.dataset.image;
  if (isMatch) {
    first.classList.add("matched");
    second.classList.add("matched");
    playChime();
    matchesFound++;
    flippedCards = [];
    lockBoard = false;
    if (matchesFound === LEVELS[currentLevel]) {
      if (currentLevel < LEVELS.length - 1) {
        stopTimer();
        status.textContent = "";
        showLevelSplash(`Level ${currentLevel + 1} Complete!`, () => {
          currentLevel++;
          buildBoard();
        });
      } else {
        stopTimer();
        status.textContent = "";
        playWinFanfare();
        launchConfetti();
        showWinScreen();
      }
    }
  } else {
    first.classList.add("wrong");
    second.classList.add("wrong");
    playBuzz();
    setTimeout(() => {
      playCardFlip();
      first.style.transform = "none";
      first.classList.remove("flipped", "wrong");
      setTimeout(() => {
        playCardFlip();
        second.style.transform = "none";
        second.classList.remove("flipped", "wrong");
      }, 80);
      flippedCards = [];
      lockBoard = false;
    }, 1000);
  }
}

function restartGame() {
  currentLevel = 0;
  resetStats();
  buildBoard();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function toggleSoundEffects() {
  soundEffectsMuted = !soundEffectsMuted;
  const sfxToggle = document.getElementById("sfx-toggle");
  if (soundEffectsMuted) {
    sfxToggle.classList.remove("sfx-on");
    sfxToggle.classList.add("sfx-off");
  } else {
    sfxToggle.classList.remove("sfx-off");
    sfxToggle.classList.add("sfx-on");
  }
}

function toggleRadioMute() {
  const volumeSlider = document.getElementById("volume-slider");
  const radioIcon = document.getElementById("radio-icon");
  
  if (musicVolume === 0) {
    // Unmute: restore to previous volume or default to 0.25
    musicVolume = 0.25;
    volumeSlider.value = musicVolume;
  } else {
    // Mute: save current volume and set to 0
    musicVolume = 0;
    volumeSlider.value = 0;
  }
  
  updateMusicVolume();
}

function updateMusicVolume() {
  const volumeSlider = document.getElementById("volume-slider");
  musicVolume = parseFloat(volumeSlider.value);
  const radioIcon = document.getElementById("radio-icon");
  
  if (backgroundMusic) {
    backgroundMusic.volume = musicVolume;
    if (musicVolume === 0) {
      radioIcon.src = "radiooff.png";
      backgroundMusic.pause();
      isMusicPaused = true;
      updatePlayPauseButton();
    } else {
      radioIcon.src = "radioon.png";
      if (musicStarted && backgroundMusic.paused && !isMusicPaused) {
        backgroundMusic.play().catch(e => console.log("Play failed:", e));
        updatePlayPauseButton();
      }
    }
  } else {
    // Update icon even if music hasn't started yet
    radioIcon.src = musicVolume === 0 ? "radiooff.png" : "radioon.png";
  }
}

function startBackgroundMusic() {
  if (musicStarted) return;
  musicStarted = true;
  
  currentMusicIndex = Math.floor(Math.random() * MUSIC_FILES.length);
  loadAndPlayMusic();
}

function loadAndPlayMusic() {
  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic = null;
  }
  
  const track = MUSIC_FILES[currentMusicIndex];
  backgroundMusic = new Audio(track);
  backgroundMusic.loop = true;
  backgroundMusic.volume = musicVolume;
  
  backgroundMusic.addEventListener('ended', () => {
    skipSong(1);
  });
  
  backgroundMusic.addEventListener('canplaythrough', () => {
    // Try to play when audio is ready
    if (musicVolume > 0 && !isMusicPaused) {
      const playPromise = backgroundMusic.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.log("Autoplay prevented:", e);
        });
      }
      updatePlayPauseButton();
    }
  });
  
  updatePlayPauseButton();
  
  // Try to play immediately (will work if user has interacted)
  if (musicVolume > 0 && !isMusicPaused) {
    const playPromise = backgroundMusic.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        console.log("Autoplay prevented, will play on user interaction");
      });
    }
  }
  updatePlayPauseButton();
}

function togglePlayPause() {
  if (!backgroundMusic || musicVolume === 0) return;
  
  isMusicPaused = !isMusicPaused;
  
  if (isMusicPaused) {
    backgroundMusic.pause();
  } else {
    backgroundMusic.play().catch(e => console.log("Play failed:", e));
  }
  
  updatePlayPauseButton();
}

function updatePlayPauseButton() {
  const playPauseBtn = document.getElementById("play-pause-btn");
  if (!playPauseBtn) return;
  
  if (isMusicPaused || (backgroundMusic && backgroundMusic.paused)) {
    playPauseBtn.textContent = "▶";
    playPauseBtn.classList.add("play-icon");
    playPauseBtn.classList.remove("pause-icon");
  } else {
    playPauseBtn.textContent = "⏸";
    playPauseBtn.classList.add("pause-icon");
    playPauseBtn.classList.remove("play-icon");
  }
}

function skipSong(direction) {
  if (!musicStarted || MUSIC_FILES.length === 0) return;
  
  currentMusicIndex += direction;
  
  if (currentMusicIndex < 0) {
    currentMusicIndex = MUSIC_FILES.length - 1;
  } else if (currentMusicIndex >= MUSIC_FILES.length) {
    currentMusicIndex = 0;
  }
  
  const wasPlaying = backgroundMusic && !backgroundMusic.paused && !isMusicPaused;
  loadAndPlayMusic();
  
  if (wasPlaying && musicVolume > 0) {
    isMusicPaused = false;
    backgroundMusic.play().catch(e => console.log("Play failed:", e));
    updatePlayPauseButton();
  }
}

// Start music on first user interaction (desktop)
// On mobile, music will start automatically when intro dismisses
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if (!isMobile) {
  document.addEventListener('click', function startMusicOnInteraction() {
    if (!musicStarted) {
      startBackgroundMusic();
    }
    document.removeEventListener('click', startMusicOnInteraction);
  }, { once: true });
}

// On mobile, start music when intro screen is shown (will play after user interaction or auto-dismiss)
if (isMobile) {
  // Try to start music immediately on mobile - will work if autoplay is allowed
  // Otherwise it will start when dismissIntro() is called
  setTimeout(() => {
    if (!musicStarted) {
      startBackgroundMusic();
    }
  }, 100);
}