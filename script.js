const beginButton = document.querySelector("#begin-surprise");
const finalSurpriseButton = document.querySelector("#final-surprise");
const storySection = document.querySelector("#story");
const musicToggle = document.querySelector(".music-toggle");
const audio = document.querySelector("#birthday-music");
const slides = Array.from(document.querySelectorAll("[data-slide]"));
const progressBars = Array.from(document.querySelectorAll(".story__progress-bar"));
const nextStoryButton = document.querySelector("[data-story-next]");
const prevStoryButton = document.querySelector("[data-story-prev]");
const galleryButtons = Array.from(document.querySelectorAll("[data-lightbox-index]"));
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector(".lightbox__image");
const lightboxClose = document.querySelector(".lightbox__close");
const lightboxPrev = document.querySelector(".lightbox__nav--prev");
const lightboxNext = document.querySelector(".lightbox__nav--next");
const surpriseModal = document.querySelector("#surprise-modal");
const surpriseClose = document.querySelector(".surprise-modal__close");
const surpriseBackdrop = document.querySelector("[data-close-modal]");
const heartsContainer = document.querySelector(".surprise-modal__hearts");
const typingElement = document.querySelector(".typing-text");
const cursorGlow = document.querySelector(".cursor-glow");
const confettiCanvas = document.querySelector(".confetti-canvas");
const pageImages = Array.from(document.images);

const galleryImages = galleryButtons.map((button) => {
  const image = button.querySelector("img");
  return {
    src: image.src,
    alt: image.alt
  };
});

let currentSlideIndex = 0;
let slideIntervalId = null;
let currentLightboxIndex = 0;
let typingStarted = false;
let confettiPieces = [];
let confettiAnimationFrame = null;
let heartIntervalId = null;

function smoothScrollTo(element) {
  element.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function toggleMusic(forcePlay = false) {
  if (!audio) {
    return;
  }

  const shouldPlay = forcePlay || audio.paused;

  try {
    if (shouldPlay) {
      await audio.play();
      musicToggle.dataset.playing = "true";
      musicToggle.querySelector(".music-toggle__icon").textContent = "Pause";
      musicToggle.setAttribute("aria-label", "Pause background music");
    } else {
      audio.pause();
      musicToggle.dataset.playing = "false";
      musicToggle.querySelector(".music-toggle__icon").textContent = "Play";
      musicToggle.setAttribute("aria-label", "Play background music");
    }
  } catch (error) {
    musicToggle.querySelector(".music-toggle__label").textContent = "Music unavailable";
  }
}

function showSlide(index) {
  currentSlideIndex = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === currentSlideIndex);
  });

  progressBars.forEach((bar, barIndex) => {
    bar.classList.toggle("is-active", barIndex <= currentSlideIndex);
  });
}

function startStoryAutoplay() {
  stopStoryAutoplay();
  slideIntervalId = window.setInterval(() => {
    showSlide(currentSlideIndex + 1);
  }, 5200);
}

function stopStoryAutoplay() {
  if (slideIntervalId) {
    window.clearInterval(slideIntervalId);
  }
}

function openLightbox(index) {
  currentLightboxIndex = index;
  const item = galleryImages[currentLightboxIndex];

  lightboxImage.src = item.src;
  lightboxImage.alt = item.alt;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
}

function changeLightboxImage(direction) {
  currentLightboxIndex = (currentLightboxIndex + direction + galleryImages.length) % galleryImages.length;
  openLightbox(currentLightboxIndex);
}

function typeMessage() {
  if (!typingElement || typingStarted) {
    return;
  }

  typingStarted = true;
  const text = typingElement.dataset.typingText || "";
  let characterIndex = 0;

  typingElement.classList.add("is-typing");

  const typingTimer = window.setInterval(() => {
    typingElement.textContent = text.slice(0, characterIndex);
    characterIndex += 1;

    if (characterIndex > text.length) {
      window.clearInterval(typingTimer);
      typingElement.classList.remove("is-typing");
    }
  }, 28);
}

function createRevealObserver() {
  const revealElements = document.querySelectorAll(".reveal");

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);

        if (entry.target.closest(".message-card")) {
          typeMessage();
        }
      }
    });
  }, {
    threshold: 0.18
  });

  revealElements.forEach((element) => revealObserver.observe(element));
}

function setupParallax() {
  const parallaxTargets = [
    document.querySelector(".hero__backdrop")
  ].filter(Boolean);

  if (!parallaxTargets.length || window.innerWidth <= 767 || navigator.hardwareConcurrency <= 4) {
    return;
  }

  parallaxTargets.forEach((element) => {
    element.dataset.parallax = "true";
  });

  let rafId = null;
  let latestScrollY = window.scrollY;

  function updateParallax(scrollY) {
    parallaxTargets.forEach((element, index) => {
      const intensity = (index + 1) * 0.02;
      const offset = scrollY * intensity;
      element.style.transform = `translate3d(0, ${offset}px, 0)`;
    });

    rafId = null;
  }

  window.addEventListener("scroll", () => {
    if (window.innerWidth <= 767) {
      return;
    }

    latestScrollY = window.scrollY;

    if (rafId === null) {
      rafId = window.requestAnimationFrame(() => updateParallax(latestScrollY));
    }
  }, { passive: true });

  updateParallax(latestScrollY);
}

function optimizeImages() {
  pageImages.forEach((image) => {
    image.decoding = "async";

    if (image.loading === "lazy") {
      image.fetchPriority = "low";
    }
  });
}

function setupScrollPerformanceMode() {
  let scrollTimerId = null;

  window.addEventListener("scroll", () => {
    document.body.classList.add("is-scrolling");

    if (scrollTimerId) {
      window.clearTimeout(scrollTimerId);
    }

    scrollTimerId = window.setTimeout(() => {
      document.body.classList.remove("is-scrolling");
      scrollTimerId = null;
    }, 140);
  }, { passive: true });
}

function setupCursorGlow() {
  if (!cursorGlow || window.matchMedia("(pointer: coarse)").matches) {
    return;
  }

  let rafId = null;
  let pointerX = 0;
  let pointerY = 0;

  function paintCursorGlow() {
    cursorGlow.style.opacity = "1";
    cursorGlow.style.transform = `translate3d(${pointerX - 110}px, ${pointerY - 110}px, 0)`;
    rafId = null;
  }

  window.addEventListener("mousemove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;

    if (rafId === null) {
      rafId = window.requestAnimationFrame(paintCursorGlow);
    }
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    cursorGlow.style.opacity = "0";
  });
}

function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function launchConfetti() {
  const context = confettiCanvas.getContext("2d");

  resizeConfettiCanvas();
  confettiPieces = Array.from({ length: 180 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: -20 - Math.random() * confettiCanvas.height * 0.3,
    size: 6 + Math.random() * 8,
    speedY: 2 + Math.random() * 4,
    speedX: -2 + Math.random() * 4,
    rotation: Math.random() * Math.PI,
    rotationSpeed: -0.2 + Math.random() * 0.4,
    color: ["#ff8fb6", "#ffd77a", "#d0b2ff", "#ffc7a0", "#ffffff"][Math.floor(Math.random() * 5)]
  }));

  const startTime = performance.now();

  function render(now) {
    const elapsed = now - startTime;
    context.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiPieces.forEach((piece) => {
      piece.x += piece.speedX;
      piece.y += piece.speedY;
      piece.rotation += piece.rotationSpeed;

      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.fillStyle = piece.color;
      context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.6);
      context.restore();
    });

    if (elapsed < 5000) {
      confettiAnimationFrame = window.requestAnimationFrame(render);
    } else {
      context.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      window.cancelAnimationFrame(confettiAnimationFrame);
    }
  }

  confettiAnimationFrame = window.requestAnimationFrame(render);
}

function spawnHeart() {
  const heart = document.createElement("span");
  heart.className = "heart";
  heart.style.left = `${Math.random() * 100}%`;
  heart.style.animationDuration = `${3.5 + Math.random() * 2.5}s`;
  heart.style.setProperty("--heart-drift", `${-40 + Math.random() * 80}px`);
  heartsContainer.appendChild(heart);

  window.setTimeout(() => {
    heart.remove();
  }, 6500);
}

function openSurpriseModal() {
  surpriseModal.classList.add("is-open");
  surpriseModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  launchConfetti();

  if (audio && !audio.paused) {
    audio.volume = 0.7;
  }

  if (!heartIntervalId) {
    heartIntervalId = window.setInterval(spawnHeart, 260);
  }
}

function closeSurpriseModal() {
  surpriseModal.classList.remove("is-open");
  surpriseModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (audio && !audio.paused) {
    audio.volume = 0.45;
  }

  if (heartIntervalId) {
    window.clearInterval(heartIntervalId);
    heartIntervalId = null;
  }
}

beginButton?.addEventListener("click", async () => {
  await toggleMusic(true);
  if (audio) {
    audio.volume = 0.45;
  }
  smoothScrollTo(storySection);
});

musicToggle?.addEventListener("click", () => {
  toggleMusic();
});

nextStoryButton?.addEventListener("click", () => {
  showSlide(currentSlideIndex + 1);
  startStoryAutoplay();
});

prevStoryButton?.addEventListener("click", () => {
  showSlide(currentSlideIndex - 1);
  startStoryAutoplay();
});

galleryButtons.forEach((button, index) => {
  button.addEventListener("click", () => openLightbox(index));
});

lightboxClose?.addEventListener("click", closeLightbox);
lightboxPrev?.addEventListener("click", () => changeLightboxImage(-1));
lightboxNext?.addEventListener("click", () => changeLightboxImage(1));

finalSurpriseButton?.addEventListener("click", async () => {
  await toggleMusic(true);
  openSurpriseModal();
});

surpriseClose?.addEventListener("click", closeSurpriseModal);
surpriseBackdrop?.addEventListener("click", closeSurpriseModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLightbox();
    closeSurpriseModal();
  }

  if (lightbox.classList.contains("is-open")) {
    if (event.key === "ArrowRight") {
      changeLightboxImage(1);
    }

    if (event.key === "ArrowLeft") {
      changeLightboxImage(-1);
    }
  }
});

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

window.addEventListener("resize", resizeConfettiCanvas);

createRevealObserver();
optimizeImages();
setupScrollPerformanceMode();
setupParallax();
setupCursorGlow();
showSlide(0);
startStoryAutoplay();
resizeConfettiCanvas();
