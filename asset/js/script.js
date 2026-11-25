/* ==========================================================================
   PORTFOLIO - KERLYN LAWRANCE
   Script: asset/js/script.js
   Interaktivitas:
   1. Background Stripe Vertikal Interaktif (Wavy saat disentuh kursor)
   2. Awan Mengambang & Interaktif (Bergerak saat disentuh/didekati kursor)
   3. Animasi Entrance Teks Hero (Baru muncul saat website dibuka)
   4. Navigasi Aktif
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initHeroEntrance();
  initHeroScrollCue();
  initWavyStripesBackground();
  initCloudInteractions();
  initNavInteractions();
  initScrollCloudShatter();
  initAboutPhotoInteractions();
  initStarInteractions();
  initJourneyInteractions();
  initScrollSpyNav();
  initProjectModals();
  initChineseLanternSky();
  initContactSection();
  try {
    initJourneyMiniGame();
  } catch (err) {
    console.error("Mini game init error:", err);
  }
});

/* --------------------------------------------------------------------------
   1. ANIMASI ENTRANCE TEKS HERO
   Teks "A Little About What I Create" baru muncul bertahap setelah website dibuka.
   -------------------------------------------------------------------------- */
function initHeroEntrance() {
  const heroTextWrap = document.getElementById("heroTextWrap");
  if (!heroTextWrap) return;

  // Jeda lembut setelah halaman dibuka agar efek pop-up terlihat jelas dan membal
  setTimeout(() => {
    heroTextWrap.classList.add("hero-revealed");
  }, 220);
}

/* --------------------------------------------------------------------------
   1B. INDIKATOR SCROLL KE BAWAH (#home - Scroll Down for Next Page)
   - Klik untuk scroll mulus ke section berikutnya (#about)
   - Memicu animasi pop up "Hello!" dan avatar berjatuhan secara mulus
   - Otomatis sembunyi saat scroll ke bawah dan muncul kembali saat di atas
   -------------------------------------------------------------------------- */
function initHeroScrollCue() {
  const heroScrollCue = document.getElementById("heroScrollCue");
  const aboutSection = document.getElementById("about");
  if (!heroScrollCue) return;

  // Klik: scroll mulus ke #about
  heroScrollCue.addEventListener("click", (e) => {
    e.preventDefault();
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" });

      // Update navbar aktif ke About
      const navLinks = document.querySelectorAll(".nav-link");
      navLinks.forEach((link) => {
        if (link.getAttribute("href") === "#about") {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });

      // Pemicu animasi Hello dan transisi berjatuhan
      const helloTitle = document.getElementById("aboutHelloTitle");
      if (helloTitle) {
        helloTitle.classList.remove("about-hello-revealed");
        void helloTitle.offsetWidth;
        helloTitle.classList.add("about-hello-revealed");
      }
      const fallingWrap = document.getElementById("fallingBrandingTransition");
      if (fallingWrap) {
        fallingWrap.classList.remove("is-falling");
        void fallingWrap.offsetWidth;
        fallingWrap.classList.add("is-falling");
      }
    }
  });

  // Scroll listener: fade out halus saat scroll menjauhi home, fade in saat kembali ke home
  window.addEventListener(
    "scroll",
    () => {
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY > 70) {
        heroScrollCue.classList.add("is-hidden");
      } else {
        heroScrollCue.classList.remove("is-hidden");
      }
    },
    { passive: true }
  );
}

/* --------------------------------------------------------------------------
   2. BACKGROUND STRIPE VERTIKAL WAVY (BEROMBAK SAAT DISENTUH KURSOR)
   - Garis vertikal ke bawah dengan warna #fedf85 dan #fde9a0.
   - Ketika kursor menyentuh atau bergerak di atas latar, garis-garis
     akan meliuk bergelombang (wavy ripples) secara dinamis & mulus (60 FPS).
   - Mendukung mouse desktop & touch pada perangkat mobile / tablet.
   -------------------------------------------------------------------------- */
function initWavyStripesBackground() {
  const canvas = document.getElementById("heroBgCanvas");
  const bgWrapper = document.getElementById("heroBgWrapper");
  if (!canvas || !bgWrapper) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Warna sesuai spesifikasi
  const COLOR_DARK = "#fedf85";   // Kuning tua
  const COLOR_LIGHT = "#fde9a0";  // Kuning muda

  let width = 0;
  let height = 0;
  let dpr = 1;

  // Status kursor
  let mouseX = -9999;
  let mouseY = -9999;
  let lastMouseX = -9999;
  let lastMouseY = -9999;
  let isHovering = false;
  let cursorEnergy = 0;
  let idleTimer = null;

  // Kumpulan ripple ombak dinamis
  const ripples = [];
  const MAX_RIPPLES = 16;

  // Ukuran lebar tiap stripe vertikal (px)
  const STRIPE_WIDTH = 44;

  // Buffer titik vertikal untuk zero-allocation per frame
  const yStep = 16;
  let yCoords = null;
  let totalPoints = 0;
  let colBufferA = null;
  let colBufferB = null;
  const nearRipples = new Array(MAX_RIPPLES);

  // Penyesuaian ukuran canvas & retina display (dpr dibatasi max 2 agar hemat GPU)
  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = bgWrapper.getBoundingClientRect();
    width = rect.width;
    height = rect.height;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Pre-calculate array titik vertikal y dari -15 hingga height + 25
    totalPoints = Math.ceil((height + 40) / yStep) + 2;
    colBufferA = new Float32Array(totalPoints);
    colBufferB = new Float32Array(totalPoints);
    yCoords = new Float32Array(totalPoints);

    let idx = 0;
    for (let y = -15; y <= height + 25; y += yStep) {
      yCoords[idx++] = y;
    }
    totalPoints = idx;
  }

  window.addEventListener("resize", resizeCanvas, { passive: true });
  resizeCanvas();

  // Handler interaksi mouse
  window.addEventListener("mousemove", (e) => {
    const rect = bgWrapper.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    isHovering = true;
    clearTimeout(idleTimer);

    // Hitung kecepatan gerak kursor
    let speed = 0;
    if (lastMouseX > -999) {
      speed = Math.hypot(curX - lastMouseX, curY - lastMouseY);
    }

    mouseX = curX;
    mouseY = curY;
    lastMouseX = curX;
    lastMouseY = curY;

    // Tingkatkan energi gelombang secara halus namun responsif
    cursorEnergy = Math.min(cursorEnergy + speed * 0.035 + 0.25, 1.35);

    // Buat ripple ombak
    if (speed > 2.2) {
      ripples.push({
        x: curX,
        y: curY,
        strength: Math.min(speed * 0.42 + 5.5, 16.0),
        radius: 0,
        maxRadius: 280,
        age: 0,
        maxAge: 60
      });

      if (ripples.length > MAX_RIPPLES) {
        ripples.shift();
      }
    }

    idleTimer = setTimeout(() => {
      isHovering = false;
    }, 1800);
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    isHovering = false;
    mouseX = -9999;
    mouseY = -9999;
  });

  // Handler touch mobile (saat layar disentuh atau diusap)
  window.addEventListener("touchstart", (e) => {
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = bgWrapper.getBoundingClientRect();
      const curX = touch.clientX - rect.left;
      const curY = touch.clientY - rect.top;

      mouseX = curX;
      mouseY = curY;
      lastMouseX = curX;
      lastMouseY = curY;

      isHovering = true;
      cursorEnergy = Math.min(cursorEnergy + 0.8, 1.35);

      ripples.push({
        x: curX,
        y: curY,
        strength: 15.0,
        radius: 0,
        maxRadius: 260,
        age: 0,
        maxAge: 55
      });

      if (ripples.length > MAX_RIPPLES) {
        ripples.shift();
      }
    }
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = bgWrapper.getBoundingClientRect();
      const curX = touch.clientX - rect.left;
      const curY = touch.clientY - rect.top;

      let speed = 0;
      if (lastMouseX > -999) {
        speed = Math.hypot(curX - lastMouseX, curY - lastMouseY);
      }

      mouseX = curX;
      mouseY = curY;
      lastMouseX = curX;
      lastMouseY = curY;

      isHovering = true;
      cursorEnergy = Math.min(cursorEnergy + speed * 0.05 + 0.35, 1.35);

      ripples.push({
        x: curX,
        y: curY,
        strength: Math.min(speed * 0.45 + 6.0, 16.0),
        radius: 0,
        maxRadius: 270,
        age: 0,
        maxAge: 55
      });

      if (ripples.length > MAX_RIPPLES) {
        ripples.shift();
      }

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isHovering = false;
      }, 1600);
    }
  }, { passive: true });

  // Fungsi publik untuk memicu riak latar belakang (misal saat awan disentuh)
  window.spawnBgRipple = function (clientX, clientY, strength = 18.0) {
    const rect = bgWrapper.getBoundingClientRect();
    const curX = clientX - rect.left;
    const curY = clientY - rect.top;

    isHovering = true;
    cursorEnergy = Math.min(cursorEnergy + 0.9, 1.35);

    ripples.push({
      x: curX,
      y: curY,
      strength: strength,
      radius: 0,
      maxRadius: 300,
      age: 0,
      maxAge: 65
    });

    if (ripples.length > MAX_RIPPLES) {
      ripples.shift();
    }

    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      isHovering = false;
    }, 1800);
  };

  // Fungsi kalkulasi pergeseran satu garis batas vertikal secara optimal
  function computeBoundary(x, outBuf, pointsCount, time) {
    const isNearMouse = (isHovering && mouseX > -999 && Math.abs(x - mouseX) < 270);

    let nearRippleCount = 0;
    for (let r = 0; r < ripples.length; r++) {
      if (Math.abs(x - ripples[r].x) < ripples[r].radius + 75) {
        nearRipples[nearRippleCount++] = ripples[r];
      }
    }

    for (let p = 0; p < pointsCount; p++) {
      const y = yCoords[p];
      let dx = 0;

      // 1. Gelombang langsung di sekitar kursor saat disentuh (~24px)
      if (isNearMouse) {
        const yDiff = Math.abs(y - mouseY);
        if (yDiff < 270) {
          const dist = Math.hypot(x - mouseX, yDiff);
          if (dist < 270) {
            const factor = Math.cos((dist / 270) * (Math.PI / 2));
            dx += Math.sin((y - mouseY) * 0.024 - time * 3.8) * 24.0 * factor * cursorEnergy;
          }
        }
      }

      // 2. Ripple ombak yang menyebar keluar
      if (nearRippleCount > 0) {
        for (let rIdx = 0; rIdx < nearRippleCount; rIdx++) {
          const r = nearRipples[rIdx];
          const yDiff = Math.abs(y - r.y);
          if (yDiff < r.radius + 75) {
            const d = Math.hypot(x - r.x, yDiff);
            const diff = d - r.radius;
            if (Math.abs(diff) < 75) {
              const envelope = (1 - Math.abs(diff) / 75) * (1 - r.age / r.maxAge);
              dx += Math.sin(diff * 0.048) * r.strength * envelope;
            }
          }
        }
      }

      // 3. Sentuhan mikro alami saat diam (aliran ambient 3.2px bernyawa)
      dx += Math.sin(y * 0.009 + time * 1.4 + x * 0.006) * 3.2;

      outBuf[p] = x + dx;
    }
  }

  // Render Loop Utama Wavy Stripes (Delta Time + Zero Allocation Buffer Swap)
  let lastTimestamp = performance.now();
  let time = 0;
  let isSectionVisible = true;
  let rafId = null;

  function render(timestamp) {
    if (!timestamp) timestamp = performance.now();
    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
    lastTimestamp = timestamp;

    time += dt * 1.5;

    // Luruhkan energi kursor secara smooth berbasis waktu
    cursorEnergy *= Math.pow(0.96, dt * 60);
    if (cursorEnergy < 0.001) cursorEnergy = 0;

    // Perbarui ripple ombak
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.age += dt * 60;
      r.radius += 4.5 * (dt * 60);
      r.strength *= Math.pow(0.965, dt * 60);
      if (r.age >= r.maxAge || r.strength < 0.2) {
        ripples.splice(i, 1);
      }
    }

    ctx.clearRect(0, 0, width, height);

    const numStripes = Math.ceil(width / STRIPE_WIDTH) + 4;
    const startX = -STRIPE_WIDTH * 2;

    if (!colBufferA || totalPoints <= 0) {
      rafId = requestAnimationFrame(render);
      return;
    }

    let curBuf = colBufferA;
    let nextBuf = colBufferB;

    // Hitung boundary paling kiri (stripe 0 sisi kiri)
    computeBoundary(startX, curBuf, totalPoints, time);

    for (let i = 0; i < numStripes; i++) {
      const x2 = startX + (i + 1) * STRIPE_WIDTH;
      computeBoundary(x2, nextBuf, totalPoints, time);

      const fillColor = (i % 2 === 0) ? COLOR_DARK : COLOR_LIGHT;

      ctx.beginPath();
      // Sisi kanan: bergerak dari atas ke bawah
      ctx.moveTo(nextBuf[0], yCoords[0]);
      for (let p = 1; p < totalPoints; p++) {
        ctx.lineTo(nextBuf[p], yCoords[p]);
      }
      // Sisi kiri: bergerak dari bawah kembali ke atas
      for (let p = totalPoints - 1; p >= 0; p--) {
        ctx.lineTo(curBuf[p], yCoords[p]);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Tukar buffer untuk stripe berikutnya (reuse tanpa kalkulasi ulang)
      const tmp = curBuf;
      curBuf = nextBuf;
      nextBuf = tmp;
    }

    if (isSectionVisible) {
      rafId = requestAnimationFrame(render);
    } else {
      rafId = null;
    }
  }

  // IntersectionObserver agar rendering berhenti saat scroll ke bawah (#about, #journey, dll.)
  if ("IntersectionObserver" in window) {
    const homeEl = document.getElementById("home");
    if (homeEl) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isSectionVisible = true;
            if (!rafId) {
              lastTimestamp = performance.now();
              rafId = requestAnimationFrame(render);
            }
          } else {
            isSectionVisible = false;
            if (rafId) {
              cancelAnimationFrame(rafId);
              rafId = null;
            }
          }
        });
      }, { threshold: 0.01 });
      observer.observe(homeEl);
    }
  }

  rafId = requestAnimationFrame(render);
}

/* --------------------------------------------------------------------------
   3. INTERAKTIVITAS AWAN DI SEKELILING BORDER (RESPONSIF KETIKA DISENTUH BERGERAK)
   - Bergerak membal & melayang dinamis saat disentuh jari mobile atau kursor desktop.
   - Mengikuti arah sentuhan / kursor dengan efek tilt & elastisitas clay yang hidup.
   - Memicu riak ombak pada latar belakang saat awan dipuff/disentuh.
   -------------------------------------------------------------------------- */
function initCloudInteractions() {
  const cloudClusters = document.querySelectorAll(".cloud-cluster");
  if (!cloudClusters || cloudClusters.length === 0) return;

  cloudClusters.forEach((cloud) => {
    const cloudType = cloud.getAttribute("data-cloud");

    // Arah pentalan alami keluar border untuk tiap sudut & orientasi
    const baseOffset = {
      tl: { x: -16, y: -18, rot: -5 },
      tr: { x: 16, y: -16, rot: 5 },
      bl: { x: -16, y: 16, rot: -5 },
      br: { x: 18, y: 18, rot: 5 },
      left: { x: -18, y: 0, rot: -4 },
      right: { x: 18, y: 0, rot: 4 },
      top: { x: 0, y: -18, rot: 2 },
      bottom: { x: 0, y: 16, rot: -2 }
    }[cloudType] || { x: 0, y: -14, rot: 0 };

    let isInteracting = false;

    // Fungsi pergerakan dinamis mengikuti sentuhan / kursor
    function updateCloudMovement(clientX, clientY) {
      if (cloud.classList.contains("is-puffing")) return;

      const rect = cloud.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Normalisasi posisi -1 hingga 1 dari titik tengah awan
      const normX = Math.max(-1.2, Math.min(1.2, (clientX - cx) / (rect.width / 2)));
      const normY = Math.max(-1.2, Math.min(1.2, (clientY - cy) / (rect.height / 2)));

      // Gerakan elastis awan mengikuti sentuhan kursor/jari
      const moveX = baseOffset.x + normX * 14;
      const moveY = baseOffset.y + normY * 12;
      const rot = baseOffset.rot + normX * 6;

      cloud.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) scale(1.24) rotate(${rot}deg)`;
    }

    // 1. Respon Desktop (Pointer / Mouse)
    cloud.addEventListener("pointerenter", (e) => {
      isInteracting = true;
      cloud.classList.add("active-touch");
      updateCloudMovement(e.clientX, e.clientY);
    });

    cloud.addEventListener("pointermove", (e) => {
      if (!isInteracting) return;
      updateCloudMovement(e.clientX, e.clientY);
    });

    cloud.addEventListener("pointerleave", () => {
      isInteracting = false;
      cloud.classList.remove("active-touch");
      if (!cloud.classList.contains("is-puffing")) {
        cloud.style.transform = "";
      }
    });

    // 2. Respon Mobile (Touch)
    cloud.addEventListener("touchstart", (e) => {
      isInteracting = true;
      cloud.classList.add("active-touch");
      if (e.touches && e.touches[0]) {
        updateCloudMovement(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    cloud.addEventListener("touchmove", (e) => {
      if (!isInteracting) return;
      if (e.touches && e.touches[0]) {
        updateCloudMovement(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    cloud.addEventListener("touchend", () => {
      isInteracting = false;
      cloud.classList.remove("active-touch");
      triggerCloudPuff(cloud);
    }, { passive: true });

    // 3. Efek Klik / Tap Membal Menggemaskan (Squish Bounce & Riak Latar)
    cloud.addEventListener("click", () => {
      triggerCloudPuff(cloud);
    });
  });

  // Animasi Puff & Riak Background saat Awan Disentuh
  function triggerCloudPuff(cloud) {
    cloud.classList.remove("is-puffing");
    // Trigger reflow agar animasi @keyframes bisa dimulai ulang
    void cloud.offsetWidth;
    cloud.classList.add("is-puffing");
    cloud.style.transform = "";

    // Memicu riak ombak elegan pada background stripe dari posisi awan
    if (window.spawnBgRipple) {
      const rect = cloud.getBoundingClientRect();
      window.spawnBgRipple(rect.left + rect.width / 2, rect.top + rect.height / 2, 20.0);
    }

    setTimeout(() => {
      cloud.classList.remove("is-puffing");
    }, 850);
  }
}

/* --------------------------------------------------------------------------
   4. NAVIGASI BAR AKTIF
   Menangani transisi tombol clay aktif saat menu diklik.
   -------------------------------------------------------------------------- */
function initNavInteractions() {
  const navLinks = document.querySelectorAll(".nav-link");
  if (!navLinks) return;

  navLinks.forEach((link) => {
    link.addEventListener("click", function () {
      navLinks.forEach((item) => item.classList.remove("active"));
      this.classList.add("active");

      // Re-trigger animasi pop up kata-kata saat menu Home diklik
      if (this.getAttribute("href") === "#home") {
        const heroTextWrap = document.getElementById("heroTextWrap");
        if (heroTextWrap) {
          heroTextWrap.classList.remove("hero-revealed");
          void heroTextWrap.offsetWidth; // Force reflow
          heroTextWrap.classList.add("hero-revealed");
        }
      }

      // Re-trigger animasi pop up kata Hello! & transisi berjatuhan saat menu About diklik
      if (this.getAttribute("href") === "#about") {
        const helloTitle = document.getElementById("aboutHelloTitle");
        if (helloTitle) {
          helloTitle.classList.remove("about-hello-revealed");
          void helloTitle.offsetWidth; // Force reflow
          helloTitle.classList.add("about-hello-revealed");
        }
        const fallingWrap = document.getElementById("fallingBrandingTransition");
        if (fallingWrap) {
          fallingWrap.classList.remove("is-falling");
          void fallingWrap.offsetWidth;
          fallingWrap.classList.add("is-falling");
        }
      }
    });
  });
}

/* --------------------------------------------------------------------------
   5. TRANSISI SCROLL & AVATAR RING INTERAKTIF
   - Ketika scroll dari Home ke About: awan pecah / hancur dan karakter
     branding.webp berjatuhan cepat & sekali jatuh (~1.5s).
   - Ketika avatar ring DITEKAN: karakter branding.webp berjatuhan lagi.
   - Kata "Hello!" pop up membal saat memasuki section About.
   -------------------------------------------------------------------------- */
function initScrollCloudShatter() {
  const transitionWrap = document.getElementById("cloudShatterTransition");
  const fallingWrap = document.getElementById("fallingBrandingTransition");
  const aboutSection = document.getElementById("about");
  const brandingAvatar = document.getElementById("brandingAvatarBadge");
  const helloTitle = document.getElementById("aboutHelloTitle");
  if (!aboutSection) return;

  let isShattered = false;
  let isHelloRevealed = false;

  function onScrollTransition() {
    const scrollY = window.scrollY || window.pageYOffset;
    const aboutTop = aboutSection.offsetTop;
    const triggerPoint = aboutTop - window.innerHeight * 0.72;
    const helloTriggerPoint = aboutTop - window.innerHeight * 0.50;

    // 1. Transisi Awan Hancur & Karakter Berjatuhan saat scroll dari Home ke About
    if (scrollY >= triggerPoint && scrollY <= aboutTop + aboutSection.offsetHeight) {
      if (!isShattered) {
        isShattered = true;
        if (transitionWrap) transitionWrap.classList.add("is-shattered");
        if (fallingWrap) {
          fallingWrap.classList.remove("is-falling");
          void fallingWrap.offsetWidth; // Force reflow untuk animasi sekali jatuh
          fallingWrap.classList.add("is-falling");
        }
        if (brandingAvatar) {
          brandingAvatar.style.transform = "scale(1.22) rotate(8deg)";
          setTimeout(() => {
            brandingAvatar.style.transform = "";
          }, 450);
        }
      }
    } else if (scrollY < triggerPoint - 120) {
      // Reset ketika user kembali ke atas (Home) sehingga bisa berjatuhan lagi jika scroll ke bawah lagi
      if (isShattered) {
        isShattered = false;
        if (transitionWrap) transitionWrap.classList.remove("is-shattered");
        if (fallingWrap) fallingWrap.classList.remove("is-falling");
      }
    }

    // 2. Pop Up Kata "Hello!" saat About terlihat
    if (scrollY >= helloTriggerPoint) {
      if (!isHelloRevealed) {
        isHelloRevealed = true;
        if (helloTitle) {
          helloTitle.classList.add("about-hello-revealed");
        }
      }
    } else {
      if (isHelloRevealed && scrollY < aboutTop - window.innerHeight * 0.85) {
        isHelloRevealed = false;
        if (helloTitle) {
          helloTitle.classList.remove("about-hello-revealed");
        }
      }
    }
  }

  window.addEventListener("scroll", onScrollTransition, { passive: true });
  onScrollTransition();

  // 3. Avatar Ring Interaktif: Ketika ditekan, avatar branding berjatuhan lagi (hanya ketika ditekan saja)
  if (brandingAvatar && fallingWrap) {
    let fallingTimeout = null;

    function playFallingAvatars() {
      // a. Efek tekan membal pada avatar ring (squish-bounce & ripple)
      brandingAvatar.classList.remove("is-pressed");
      void brandingAvatar.offsetWidth; // Force reflow
      brandingAvatar.classList.add("is-pressed");

      setTimeout(() => {
        brandingAvatar.classList.remove("is-pressed");
      }, 480);

      // Pemicu riak ombak latar dari posisi avatar
      if (window.spawnBgRipple) {
        const rect = brandingAvatar.getBoundingClientRect();
        window.spawnBgRipple(rect.left + rect.width / 2, rect.top + rect.height / 2, 22.0);
      }

      // b. Karakter avatar branding berjatuhan cepat & elegan sekali saja
      fallingWrap.classList.remove("is-falling");
      void fallingWrap.offsetWidth; // Force reflow agar animasi bisa diputar ulang setiap kali ditekan
      fallingWrap.classList.add("is-falling");

      // Reset kelas setelah animasi selesai (~2.1 detik)
      clearTimeout(fallingTimeout);
      fallingTimeout = setTimeout(() => {
        fallingWrap.classList.remove("is-falling");
      }, 2100);
    }

    brandingAvatar.addEventListener("click", playFallingAvatars);
    brandingAvatar.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        playFallingAvatars();
      }
    });
  }

  // Hover & click bounce pada avatar yang berjatuhan
  if (fallingWrap) {
    const fallingItems = fallingWrap.querySelectorAll(".falling-brand-item");
    fallingItems.forEach((item) => {
      item.addEventListener("click", () => {
        item.style.transform = "scale(1.5) rotate(360deg)";
        setTimeout(() => {
          item.style.transform = "";
        }, 500);
      });
    });
  }
}

/* --------------------------------------------------------------------------
   6. FOTO INTERAKTIF DI SISI KIRI (#about)
   foto1.webp dan foto4.webp membesar secara dinamis saat disentuh/di-hover kursor,
   dengan pelacakan 3D tilt yang responsif dan tactile.
   -------------------------------------------------------------------------- */
function initAboutPhotoInteractions() {
  const photoCards = document.querySelectorAll(".photo-card");
  if (!photoCards || photoCards.length === 0) return;

  photoCards.forEach((card) => {
    // 1. Hover & Pelacakan Tilt 3D pada Desktop
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const normX = (e.clientX - cx) / (rect.width / 2);
      const normY = (e.clientY - cy) / (rect.height / 2);

      const tiltX = -normY * 7;
      const tiltY = normX * 7;

      card.style.transform = `scale(1.18) rotate(0deg) translateY(-8px) perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.classList.remove("is-active");
    });

    // 2. Sentuhan Touch pada Mobile (Toggle Focus)
    card.addEventListener("click", () => {
      const wasActive = card.classList.contains("is-active");
      photoCards.forEach((c) => c.classList.remove("is-active"));
      if (!wasActive) {
        card.classList.add("is-active");
      }
    });
  });
}

/* --------------------------------------------------------------------------
   7. BINTANG BIRU & KUNING INTERAKTIF (#about)
   Bintang berputar 360°, membesar dengan pendaran cahaya (glow),
   dan mengeluarkan efek sparkle saat disentuh atau diklik.
   -------------------------------------------------------------------------- */
function initStarInteractions() {
  const stars = document.querySelectorAll(".clay-star");
  if (!stars || stars.length === 0) return;

  stars.forEach((star) => {
    // Respon Hover / Touch
    star.addEventListener("pointerenter", () => {
      star.classList.add("active-star");
    });

    star.addEventListener("pointerleave", () => {
      star.classList.remove("active-star");
    });

    // Respon Klik / Tap: Memunculkan kilatan bintang ekstra
    star.addEventListener("click", (e) => {
      star.classList.add("active-star");

      const isYellow = star.classList.contains("star-yellow");
      createStarSparkle(e.clientX, e.clientY, isYellow ? "#ffd447" : "#8aabce");

      setTimeout(() => {
        star.classList.remove("active-star");
      }, 700);
    });
  });

  function createStarSparkle(x, y, color) {
    for (let i = 0; i < 4; i++) {
      const sparkle = document.createElement("div");
      sparkle.className = "dynamic-sparkle-dot";
      sparkle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 8px;
        height: 8px;
        background-color: ${color};
        border-radius: 50%;
        box-shadow: 0 0 10px ${color};
        pointer-events: none;
        z-index: 9999;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease;
      `;
      document.body.appendChild(sparkle);

      const angle = (i * Math.PI) / 2 + (Math.random() - 0.5) * 0.5;
      const dist = 32 + Math.random() * 20;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;

      requestAnimationFrame(() => {
        sparkle.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
        sparkle.style.opacity = "0";
      });

      setTimeout(() => sparkle.remove(), 650);
    }
  }
}

/* --------------------------------------------------------------------------
   8. SCROLLSPY NAVIGASI OTOMATIS
   Memperbarui tombol menu aktif (#home atau #about) sesuai posisi scroll.
   -------------------------------------------------------------------------- */
function initScrollSpyNav() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");
  if (!sections || !navLinks) return;

  function onScroll() {
    const scrollPos = window.scrollY + 200;

    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute("id");

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach((link) => {
          if (link.getAttribute("href") === `#${id}`) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        });
      }
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
}

/* --------------------------------------------------------------------------
   9. INTERAKSI SECTION #JOURNEY
   - Accordion Interaktif (Experiences, Education, Expertise):
     Terbuka mulus hanya ketika kursor menekan header.
   - Foto Interaktif:
     Ketika kursor mengarah/hover ke foto pertama (foto3.webp),
     berubah secara dinamis menjadi foto kedua (foto2.webp).
   -------------------------------------------------------------------------- */
function initJourneyInteractions() {
  // 1. Accordion Drawer: Terbuka saat ditekan kursor
  const accordionHeaders = document.querySelectorAll(".journey-accordion-header");
  accordionHeaders.forEach((header) => {
    header.addEventListener("click", function () {
      const parentItem = this.closest(".journey-accordion-item");
      if (!parentItem) return;

      const isOpen = parentItem.classList.contains("is-open");

      // Toggle state item yang diklik
      if (isOpen) {
        parentItem.classList.remove("is-open");
        this.setAttribute("aria-expanded", "false");
      } else {
        parentItem.classList.add("is-open");
        this.setAttribute("aria-expanded", "true");

        // Efek riak ombak clay saat accordion dibuka
        if (window.spawnBgRipple) {
          const rect = this.getBoundingClientRect();
          window.spawnBgRipple(rect.left + rect.width / 2, rect.top + rect.height / 2, 18.0);
        }
      }
    });
  });

  // 2. Foto Interaktif: Ketika kursor mengarah/hover ke foto pertama (foto3.webp),
  // berubah menjadi foto kedua (foto2.webp) dan MENETAP di foto kedua.
  const photoCard = document.getElementById("journeyPhotoCard");
  if (photoCard) {
    function settleOnPhoto2() {
      if (!photoCard.classList.contains("is-swapped")) {
        photoCard.classList.add("is-swapped");

        // Riak ombak lembut dari posisi kartu foto saat bertransformasi
        if (window.spawnBgRipple) {
          const rect = photoCard.getBoundingClientRect();
          window.spawnBgRipple(rect.left + rect.width / 2, rect.top + rect.height / 2, 20.0);
        }
      }
    }

    // Mendeteksi saat kursor mendekat / hover maupun saat layar disentuh
    photoCard.addEventListener("mouseenter", settleOnPhoto2);
    photoCard.addEventListener("pointerenter", settleOnPhoto2);
    photoCard.addEventListener("touchstart", settleOnPhoto2, { passive: true });
    photoCard.addEventListener("click", settleOnPhoto2);
  }
}

/* --------------------------------------------------------------------------
   10. INTERAKSI SECTION #PROJECT
   5 Balok Proyek Desain Pilihan:
   - Balok interaktif dengan efek claymorphism & transisi senja ke malam.
   - Ketika balok diklik / di-enter, modal detail lengkap proyek muncul.
   - Menampilkan visual karya, kategori, peran, tahun, konsep & deliverables.
   - Penutupan modal: tombol silang (✕), klik area luar, atau tombol Escape.
   -------------------------------------------------------------------------- */
function initProjectModals() {
  const projectCards = document.querySelectorAll(".project-block-card");
  const modalBackdrop = document.getElementById("projectModalBackdrop");
  const closeBtn = document.getElementById("projectModalCloseBtn");

  const modalImageCol = document.getElementById("modalImageCol") || modalBackdrop?.querySelector(".modal-image-col");
  const modalImg = document.getElementById("modalProjectImg");
  const modalGalleryPrev = document.getElementById("modalGalleryPrev");
  const modalGalleryNext = document.getElementById("modalGalleryNext");
  const modalGalleryDots = document.getElementById("modalGalleryDots");
  const modalTitle = document.getElementById("modalProjectTitle");
  const modalRole = document.getElementById("modalProjectRole");
  const modalYear = document.getElementById("modalProjectYear");
  const modalDesc = document.getElementById("modalProjectDesc");
  const modalHighlights = document.getElementById("modalProjectHighlights");

  if (!projectCards || !modalBackdrop) return;

  let currentGallery = [];
  let currentSlideIdx = 0;
  let galleryTimer = null;
  let slideFadeTimeout = null;
  let activeModalTitle = "";

  // Data Kurasi Lengkap 5 Proyek Desain
  const PROJECTS_DATA = {
    "1": {
      title: 'Brand Identity & Packaging Design "Soordle"',
      img: "asset/image/soordle1.webp",
      images: [
        "asset/image/soordle1.webp",
        "asset/image/soordle2.webp",
        "asset/image/soordle3.webp",
        "asset/image/soordle4.webp",
        "asset/image/soordle5.webp"
      ],
      tags: ["Brand Identity", "Packaging Design", "Food Branding"],
      desc: "A branding project for Soordle, a gluten-free instant noodle brand made from locally sourced sorghum, tapioca, and rice flour. The project aims to introduce sorghum as an alternative grain through a playful, colorful, and approachable brand identity. Combining local ingredients with a modern food concept, Soordle makes gluten-free noodles more appealing and accessible to younger consumers.",
      highlights: [
        "Brand strategy and positioning development",
        "Brand naming, logo, and visual identity",
        "Color palette, typography, and graphic elements",
        "Product packaging and flavor variations",
        "Marketing collateral and brand applications"
      ],
      ctaInvite: "Curious about my creative approach?",
      ctaButton: "Let’s Connect"
    },
    "2": {
      title: 'Brand Identity & Rebranding "Lion Air"',
      img: "asset/image/lion1.webp",
      images: [
        "asset/image/lion1.webp",
        "asset/image/lion2.webp",
        "asset/image/lion3.webp",
        "asset/image/lion4.webp",
        "asset/image/lion5.webp",
        "asset/image/lion6.webp",
        "asset/image/lion7.webp"
      ],
      tags: ["Brand Identity", "Rebranding", "Brand Strategy"],
      desc: "A rebranding project that aims to reshape Lion Air's brand perception from a low-cost airline into an affordable and reliable airline. The project focuses on developing a refreshed visual identity that communicates trust, accessibility, and professionalism while maintaining the brand's recognizable winged lion symbol and signature red and white color palette.",
      highlights: [
        "Brand repositioning and strategy development",
        "Logo refinement and visual identity redesign",
        "Color palette and typography system",
        "Brand guidelines and visual applications",
        "Marketing collateral and brand mockups"
      ],
      ctaInvite: "Have a bold idea ready to take off?",
      ctaButton: "Get in Touch"
    },
    "3": {
      title: 'Travel Poster Design "Los Angeles"',
      img: "asset/image/losangeles1.webp",
      images: [
        "asset/image/losangeles1.webp",
        "asset/image/losangeles2.webp"
      ],
      tags: ["Illustration", "Typography", "Poster Design"],
      desc: "A poster design project inspired by the vibrant atmosphere and iconic identity of Los Angeles. The design explores the city's distinctive character through visual elements, typography, and composition, capturing its urban energy and cultural appeal in a compelling visual representation.",
      highlights: [
        "Visual concept and creative direction",
        "Typography exploration and composition",
        "Color palette development",
        "Visual storytelling"
      ],
      ctaInvite: "Inspired to create something memorable?",
      ctaButton: "Start a Conversation"
    },
    "4": {
      title: 'Editorial Design "The Original Dog Bible"',
      img: "asset/image/book1.webp",
      images: ["asset/image/book1.webp", "asset/image/book2.webp", "asset/image/book3.webp"],
      tags: ["Book Layout", "Typography", "Print Design"],
      desc: "A comprehensive book layout project designed to present everything about dogs in an engaging, informative, and visually organized way. Through thoughtful typography, structured layouts, and a balanced combination of text and imagery, the design aims to create an enjoyable reading experience while maintaining clarity and consistency throughout the publication.",
      highlights: [
        "Editorial book layout and page composition",
        "Book cover and sleeve design",
        "Grid system and consistent layout structure",
        "Chapter openers and section dividers",
        "Integration of photography, text, and graphic elements"
      ],
      ctaInvite: "Looking for a fresh creative perspective?",
      ctaButton: "Work With Me"
    },
    "5": {
      title: "Self Identity",
      img: "asset/image/self-identity1.webp",
      images: [
        "asset/image/self-identity1.webp",
        "asset/image/self-identity2.webp",
        "asset/image/self-identity3.webp",
        "asset/image/self-identity4.webp"
      ],
      tags: ["Personal Branding", "Visual Identity", "Logo Design"],
      desc: "A self-identity project that explores personal characteristics and individuality through visual communication. The project translates personal traits, values, and personality into a cohesive visual identity by developing icons, indexes, and symbols, alongside a distinctive logotype. Through the exploration of visual elements and their meanings, the identity is designed to represent a unique and authentic personal expression.",
      highlights: [
        "Self identity exploration and concept development",
        "Icon, index, and symbol creation",
        "Logotype design and development",
        "Visual identity system and applications"
      ],
      ctaInvite: "Ready to bring your unique story to life?",
      ctaButton: "Say Hello"
    }
  };

  function stopGalleryAutoPlay() {
    if (galleryTimer) {
      clearInterval(galleryTimer);
      galleryTimer = null;
    }
  }

  function updateGalleryDots() {
    if (!modalGalleryDots) return;
    const dots = modalGalleryDots.querySelectorAll(".modal-gallery-dot");
    dots.forEach((dot, idx) => {
      dot.classList.toggle("is-active", idx === currentSlideIdx);
    });
  }

  function showSlide(nextIdx, animate = true) {
    if (!modalImg || currentGallery.length === 0) return;
    currentSlideIdx = (nextIdx + currentGallery.length) % currentGallery.length;
    const targetSrc = currentGallery[currentSlideIdx];
    updateGalleryDots();

    clearTimeout(slideFadeTimeout);
    if (!animate) {
      modalImg.classList.remove("is-switching");
      modalImg.src = targetSrc;
      modalImg.alt = `${activeModalTitle} (${currentSlideIdx + 1}/${currentGallery.length})`;
      return;
    }

    modalImg.classList.add("is-switching");
    slideFadeTimeout = setTimeout(() => {
      modalImg.src = targetSrc;
      modalImg.alt = `${activeModalTitle} (${currentSlideIdx + 1}/${currentGallery.length})`;
      modalImg.classList.remove("is-switching");
    }, 170);
  }

  function startGalleryAutoPlay() {
    stopGalleryAutoPlay();
    if (currentGallery.length > 1) {
      galleryTimer = setInterval(() => {
        showSlide(currentSlideIdx + 1, true);
      }, 2800);
    }
  }

  function openModal(projId) {
    const data = PROJECTS_DATA[projId];
    if (!data) return;

    stopGalleryAutoPlay();
    activeModalTitle = data.title;
    currentGallery = Array.isArray(data.images) && data.images.length > 0
      ? data.images
      : [data.img];
    currentSlideIdx = 0;

    // Preload seluruh gambar galeri agar pergantian foto halus tanpa jeda
    currentGallery.forEach((src) => {
      const preload = new Image();
      preload.src = src;
    });

    const hasMultiple = currentGallery.length > 1;
    if (modalImageCol) {
      modalImageCol.classList.toggle("has-gallery", hasMultiple);
    }
    if (modalGalleryPrev) {
      modalGalleryPrev.style.display = hasMultiple ? "" : "none";
    }
    if (modalGalleryNext) {
      modalGalleryNext.style.display = hasMultiple ? "" : "none";
    }
    if (modalGalleryDots) {
      if (hasMultiple) {
        modalGalleryDots.style.display = "";
        modalGalleryDots.innerHTML = currentGallery
          .map((_, idx) => `<button type="button" class="modal-gallery-dot${idx === 0 ? " is-active" : ""}" data-slide="${idx}" aria-label="Slide ${idx + 1}"></button>`)
          .join("");
        modalGalleryDots.querySelectorAll(".modal-gallery-dot").forEach((dot) => {
          dot.addEventListener("click", (e) => {
            e.stopPropagation();
            const idx = Number(dot.getAttribute("data-slide") || 0);
            showSlide(idx, true);
            startGalleryAutoPlay();
          });
        });
      } else {
        modalGalleryDots.style.display = "none";
        modalGalleryDots.innerHTML = "";
      }
    }

    showSlide(0, false);
    if (hasMultiple) {
      startGalleryAutoPlay();
    }

    if (modalTitle) {
      modalTitle.textContent = data.title;
      modalTitle.style.whiteSpace = "normal";
      modalTitle.style.wordBreak = "break-word";
      modalTitle.style.overflowWrap = "break-word";
      modalTitle.style.fontSize = "";
      modalTitle.style.paddingRight = "";
    }
    if (modalRole) modalRole.textContent = data.role || "";
    if (modalYear) modalYear.textContent = data.year || "";
    const modalMeta = modalBackdrop.querySelector(".modal-meta");
    const modalDot = modalBackdrop.querySelector(".modal-dot");
    if (modalMeta) {
      modalMeta.style.display = (data.role || data.year) ? "" : "none";
    }
    if (modalDot) {
      modalDot.style.display = (data.role && data.year) ? "" : "none";
    }
    if (modalDesc) modalDesc.textContent = data.desc;
    if (modalHighlights) {
      modalHighlights.innerHTML = data.highlights
        .map((item) => `<li>${item}</li>`)
        .join("");
    }

    // Set CTA text unik untuk setiap proyek
    const modalCtaInvite = document.getElementById("modalCtaInvite");
    const modalCtaBtnText = document.getElementById("modalCtaBtnText");
    if (modalCtaInvite) {
      modalCtaInvite.textContent = data.ctaInvite || "Curious about my creative approach?";
    }
    if (modalCtaBtnText) {
      modalCtaBtnText.textContent = data.ctaButton || "Let’s Connect";
    }

    modalBackdrop.classList.add("is-open");
    modalBackdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Pemicu riak latar belakang lembut
    if (window.spawnBgRipple) {
      window.spawnBgRipple(window.innerWidth / 2, window.innerHeight / 2, 22.0);
    }
  }

  function closeModal() {
    stopGalleryAutoPlay();
    clearTimeout(slideFadeTimeout);
    modalBackdrop.classList.remove("is-open");
    modalBackdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (modalGalleryPrev) {
    modalGalleryPrev.addEventListener("click", (e) => {
      e.stopPropagation();
      showSlide(currentSlideIdx - 1, true);
      startGalleryAutoPlay();
    });
  }

  if (modalGalleryNext) {
    modalGalleryNext.addEventListener("click", (e) => {
      e.stopPropagation();
      showSlide(currentSlideIdx + 1, true);
      startGalleryAutoPlay();
    });
  }

  if (modalImageCol) {
    modalImageCol.addEventListener("mouseenter", stopGalleryAutoPlay);
    modalImageCol.addEventListener("mouseleave", () => {
      if (modalBackdrop.classList.contains("is-open") && currentGallery.length > 1) {
        startGalleryAutoPlay();
      }
    });
  }

  projectCards.forEach((card) => {
    const projId = card.getAttribute("data-proj");
    card.addEventListener("click", () => openModal(projId));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(projId);
      }
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) {
      closeModal();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (!modalBackdrop.classList.contains("is-open")) return;
    if (e.key === "Escape") {
      closeModal();
    } else if (e.key === "ArrowRight" && currentGallery.length > 1) {
      showSlide(currentSlideIdx + 1, true);
      startGalleryAutoPlay();
    } else if (e.key === "ArrowLeft" && currentGallery.length > 1) {
      showSlide(currentSlideIdx - 1, true);
      startGalleryAutoPlay();
    }
  });

  // Navigasi CTA Tombol Modal ke Section #contact
  const modalCtaBtn = document.getElementById("modalCtaBtn");
  if (modalCtaBtn) {
    modalCtaBtn.addEventListener("click", function (e) {
      e.preventDefault();
      closeModal();

      const targetHref = this.getAttribute("href") || "#contact";
      const targetSection = document.querySelector(targetHref);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" });
      }

      // Sinkronisasi navigasi bar aktif ke Contact
      const navLinks = document.querySelectorAll(".nav-link");
      navLinks.forEach((link) => {
        if (link.getAttribute("href") === targetHref) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });

      if (history.pushState) {
        history.pushState(null, "", targetHref);
      } else {
        window.location.hash = targetHref;
      }
    });
  }
}

/* --------------------------------------------------------------------------
   11. INTERAKSI SECTION #PLAY (CHINESE LANTERN DIGITAL NIGHT SKY)
   Website interaktif tradisi lentera Tionghoa di langit malam digital:
   - Suasana tenang, emosional, magis, dan sinematik.
   - Kanvas langit malam berbintang & bulan sabit dengan komet berkala.
   - Lentera harapan anonim (Shared Sky via LocalStorage).
   - Pengunjung dapat merilis lentera baru:
     * Lentera melayang naik sekali dari bawah layar, mencari posisinya,
       dan menetap permanen di angkasa (tidak hilang / tidak loop tanpa henti).
   - Umur lentera: Lentera baru lebih besar & terang, lentera lama mengecil
     dan redup seperti bintang kejora yang tenang (tidak pernah menghilang).
   - Klik lentera: Memperbesar lentera, mengaburkan latar belakang,
     dan menampilkan kartu harapan anonim.
   - Musik latar ambient (Web Audio API serenade sintetis lembut).
   - Intro sinematik: “Every light carries someone’s untold story.”
   - Dashboard admin rahasia: Kode akses 'kerlyn' untuk meninjau waktu & menghapus lentera.
   -------------------------------------------------------------------------- */
function initChineseLanternSky() {
  const playSection = document.getElementById("wishlight") || document.getElementById("play");
  const canvas = document.getElementById("nightSkyCanvas");
  const lanternSkyArea = document.getElementById("lanternSkyArea");
  const countText = document.getElementById("lanternCountText");

  // Modal Rilis
  const openReleaseBtn = document.getElementById("openReleaseModalBtn");
  const releaseModal = document.getElementById("releaseModalBackdrop");
  const closeReleaseBtn = document.getElementById("closeReleaseModalBtn");
  const releaseForm = document.getElementById("releaseWishForm");
  const wishInput = document.getElementById("wishTextInput");
  const wishCharCount = document.getElementById("wishCharCount");
  const miniLanternPreview = document.getElementById("miniLanternPreview");
  const colorChoiceBtns = document.querySelectorAll(".color-choice-btn");

  // Modal Baca Harapan
  const viewModal = document.getElementById("viewModalBackdrop");
  const closeViewBtn = document.getElementById("closeViewModalBtn");
  const viewContent = document.getElementById("viewWishContentText");
  const viewTime = document.getElementById("viewWishTimestamp");

  // Dashboard Admin
  const adminBtn = document.getElementById("adminAccessBtn");
  const adminModal = document.getElementById("adminModalBackdrop");
  const closeAdminBtn = document.getElementById("closeAdminModalBtn");
  const adminLoginForm = document.getElementById("adminLoginForm");
  const adminPassInput = document.getElementById("adminPasswordInput");
  const adminErrorMsg = document.getElementById("adminErrorMsg");
  const adminPasscodeScreen = document.getElementById("adminPasscodeScreen");
  const adminDataScreen = document.getElementById("adminDataScreen");
  const adminWishesTbody = document.getElementById("adminWishesTbody");

  if (!playSection || !canvas || !lanternSkyArea) return;

  const ctx = canvas.getContext("2d");
  const STORAGE_KEY = "kerlyn_sky_wishes";
  const USER_WISHES_KEY = "kerlyn_sky_user_wishes";
  const DELETED_IDS_KEY = "kerlyn_sky_deleted_ids";

  // ========================================================================
  // REAL-TIME MULTI-DEVICE CLOUD DATABASE (FIREBASE REALTIME DATABASE)
  // ========================================================================
  // Konfigurasi Cloud Database agar pesan tersimpan permanen & real-time
  // antar semua perangkat (HP, tablet, laptop) pengunjung di seluruh dunia.
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyB73KWxpi_W2NavBvoSkopGNZ33hq6_AHY",
    authDomain: "kerlyn-portfolio.firebaseapp.com",
    databaseURL: "https://kerlyn-portfolio-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "kerlyn-portfolio",
    storageBucket: "kerlyn-portfolio.firebasestorage.app",
    messagingSenderId: "678244364665",
    appId: "1:678244364665:web:217ec6a8c3af557348ffa8",
    measurementId: "G-D2QD4Q9F9T"
  };

  let firebaseDbRef = null;
  let isFirebaseReady = false;

  // Warna Lentera Tionghoa: Kuning (#fedf85) & Biru (#8aabce) Sesuai Bagian Atas
  const LANTERN_COLORS = ["yellow", "blue"];
  const COLOR_GLOW_MAP = {
    yellow: "#fedf85",
    blue: "#8aabce"
  };

  // Kumpulan 14 Harapan Awal: Harmoni Kuning (#fedf85) & Biru (#8aabce) di area langit aman
  const DEFAULT_WISHES = [
    {
      id: "wish-def-1",
      text: "May all wounds gently heal in time, and may tomorrow bring a sincere, warm smile.",
      timestamp: Date.now() - 1000 * 60 * 22,
      top: 25,
      left: 24,
      color: "yellow"
    },
    {
      id: "wish-def-2",
      text: "To whoever is fighting quietly on their own tonight: you are doing wonderful, please don't give up.",
      timestamp: Date.now() - 1000 * 60 * 75,
      top: 30,
      left: 74,
      color: "blue"
    },
    {
      id: "wish-def-3",
      text: "Hoping that distance will never fade the warmth between two hearts.",
      timestamp: Date.now() - 1000 * 60 * 60 * 6,
      top: 36,
      left: 14,
      color: "yellow"
    },
    {
      id: "wish-def-4",
      text: "May this final thesis and design journey be completed with joy and pride for mom and dad.",
      timestamp: Date.now() - 1000 * 60 * 60 * 14,
      top: 28,
      left: 48,
      color: "blue"
    },
    {
      id: "wish-def-5",
      text: "May my grandmother find eternal peace, watching over us like this warm golden lantern.",
      timestamp: Date.now() - 1000 * 60 * 60 * 28,
      top: 40,
      left: 84,
      color: "yellow"
    },
    {
      id: "wish-def-6",
      text: "Grateful for having the strength to keep holding on and walking this far.",
      timestamp: Date.now() - 1000 * 60 * 60 * 52,
      top: 34,
      left: 60,
      color: "blue"
    },
    {
      id: "wish-def-7",
      text: "I wish to find the courage to say the words I've kept hidden in my heart for three years.",
      timestamp: Date.now() - 1000 * 60 * 60 * 80,
      top: 26,
      left: 88,
      color: "yellow"
    },
    {
      id: "wish-def-8",
      text: "May our little family always stay healthy, close, and blessed with simple happiness.",
      timestamp: Date.now() - 1000 * 60 * 60 * 120,
      top: 46,
      left: 36,
      color: "blue"
    },
    {
      id: "wish-def-9",
      text: "May peace gently touch the quietest and most tired corners of this world.",
      timestamp: Date.now() - 1000 * 60 * 60 * 170,
      top: 32,
      left: 32,
      color: "yellow"
    },
    {
      id: "wish-def-10",
      text: "I hope one day our paths cross again, when both our hearts have found forgiveness.",
      timestamp: Date.now() - 1000 * 60 * 60 * 240,
      top: 42,
      left: 10,
      color: "blue"
    },
    {
      id: "wish-def-11",
      text: "May the quiet dreams written in my little notebook slowly blossom into reality.",
      timestamp: Date.now() - 1000 * 60 * 60 * 340,
      top: 27,
      left: 78,
      color: "yellow"
    },
    {
      id: "wish-def-12",
      text: "To the stranger who feels completely lost: take a deep breath. The stars are listening.",
      timestamp: Date.now() - 1000 * 60 * 60 * 480,
      top: 38,
      left: 52,
      color: "blue"
    },
    {
      id: "wish-def-13",
      text: "Hoping my little sister gets well soon and runs joyfully once more under the morning sun.",
      timestamp: Date.now() - 1000 * 60 * 60 * 650,
      top: 25,
      left: 66,
      color: "yellow"
    },
    {
      id: "wish-def-14",
      text: "I wish I could hug you one last time.",
      timestamp: Date.now() - 1000 * 60 * 60 * 850,
      top: 33,
      left: 20,
      color: "blue"
    }
  ];

  // Peta teks bahasa Inggris untuk lentera bawaan
  const DEFAULT_TEXT_MAP = {};
  DEFAULT_WISHES.forEach((w) => {
    DEFAULT_TEXT_MAP[w.id] = w.text;
  });

  function getDeletedIds() {
    try {
      let raw = null;
      try { raw = localStorage.getItem(DELETED_IDS_KEY); } catch (e) { }
      if (!raw) {
        try { raw = sessionStorage.getItem(DELETED_IDS_KEY); } catch (e) { }
      }
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch (e) {
      console.warn("Storage access restricted:", e);
    }
    return new Set();
  }

  function addDeletedId(id) {
    try {
      const deleted = getDeletedIds();
      deleted.add(id);
      const str = JSON.stringify(Array.from(deleted));
      try { localStorage.setItem(DELETED_IDS_KEY, str); } catch (e) { }
      try { sessionStorage.setItem(DELETED_IDS_KEY, str); } catch (e) { }
    } catch (e) {
      console.warn("Could not save deleted id:", e);
    }
  }

  function getUserWishes() {
    try {
      let raw = null;
      try { raw = localStorage.getItem(USER_WISHES_KEY); } catch (e) { }
      if (!raw) {
        try { raw = sessionStorage.getItem(USER_WISHES_KEY); } catch (e) { }
      }
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (e) { }
    return [];
  }

  function saveUserWish(wish) {
    try {
      const existing = getUserWishes().filter((w) => w.id !== wish.id);
      existing.unshift(wish);
      const str = JSON.stringify(existing);
      try { localStorage.setItem(USER_WISHES_KEY, str); } catch (e) { }
      try { sessionStorage.setItem(USER_WISHES_KEY, str); } catch (e) { }
    } catch (e) {
      console.warn("Could not save user wish backup:", e);
    }
  }

  function removeUserWish(id) {
    try {
      const existing = getUserWishes().filter((w) => w.id !== id);
      const str = JSON.stringify(existing);
      try { localStorage.setItem(USER_WISHES_KEY, str); } catch (e) { }
      try { sessionStorage.setItem(USER_WISHES_KEY, str); } catch (e) { }
    } catch (e) { }
  }

  function saveWishes(wishesArr) {
    try {
      const str = JSON.stringify(wishesArr);
      try { localStorage.setItem(STORAGE_KEY, str); } catch (e) { }
      try { sessionStorage.setItem(STORAGE_KEY, str); } catch (e) { }
    } catch (e) {
      console.warn("Could not save wishes:", e);
    }
    // Jika ada backend lokal / server API yang berjalan, simpan langsung ke file JSON di disk
    trySyncToServer(wishesArr);
  }

  function trySyncToServer(wishesArr) {
    try {
      fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wishesArr, null, 2)
      }).catch(() => { });
    } catch (e) { }
  }

  // Muat data dari Storage secara permanen & anti-reset
  function loadWishes() {
    const deletedIds = getDeletedIds();
    let userWishes = getUserWishes().filter((w) => !deletedIds.has(w.id));

    try {
      let stored = null;
      try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { }
      if (!stored) {
        try { stored = sessionStorage.getItem(STORAGE_KEY); } catch (e) { }
      }

      if (stored !== null && stored !== "") {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Amankan pesan buatan user sebelumnya ke cadangan khusus & perbarui pesan bawaan ke bahasa Inggris
          parsed.forEach((w) => {
            if (w && w.id && DEFAULT_TEXT_MAP[w.id]) {
              w.text = DEFAULT_TEXT_MAP[w.id];
            }
            if (w && w.id && !w.id.startsWith("wish-def-") && !deletedIds.has(w.id)) {
              if (!userWishes.some((uw) => uw.id === w.id)) {
                userWishes.push(w);
                saveUserWish(w);
              }
            }
          });

          // Saring hanya pesan yang belum dihapus oleh admin
          const filtered = parsed.filter((w) => !deletedIds.has(w.id));

          // Pastikan semua pesan user selalu ada & terus bertambah
          userWishes.forEach((uw) => {
            if (!filtered.some((w) => w.id === uw.id)) {
              filtered.unshift(uw);
            }
          });

          // Pastikan warna konsisten kuning & biru dan posisi top berada di zona langit aman (bebas navbar)
          filtered.forEach((w, idx) => {
            if (w.color !== "yellow" && w.color !== "blue") {
              w.color = (idx % 2 === 0) ? "yellow" : "blue";
            }
            if (typeof w.top === "number" && w.top < 24) {
              w.top = 25 + (Math.abs(w.top) % 15);
            }
          });

          saveWishes(filtered);
          return filtered;
        }
      }
    } catch (e) {
      console.warn("Storage access restricted:", e);
    }

    // Jika belum ada data sama sekali di browser ini (kunjungan awal):
    // Gabungkan pesan user yang ada dengan lentera awal yang belum pernah dihapus
    const initial = [
      ...userWishes,
      ...DEFAULT_WISHES.filter((w) => !deletedIds.has(w.id) && !userWishes.some((uw) => uw.id === w.id))
    ];
    saveWishes(initial);
    return initial;
  }

  let activeWishes = loadWishes();

  // Sinkronisasi otomatis dengan file data/wishes.json saat web dibuka
  async function syncWishesFromJSONFile() {
    const candidatePaths = [
      "data/wishes.json",
      "./data/wishes.json"
    ];

    let jsonData = null;
    for (const p of candidatePaths) {
      try {
        const res = await fetch(p + "?t=" + Date.now());
        if (res.ok) {
          const parsed = await res.json();
          if (Array.isArray(parsed) && parsed.length > 0) {
            jsonData = parsed;
            break;
          }
        }
      } catch (err) { }
    }

    if (!jsonData) return;

    const deletedIds = getDeletedIds();
    let hasChanges = false;

    // Tambahkan harapan dari file JSON yang belum ada dan belum pernah dihapus oleh admin
    jsonData.forEach((jw) => {
      if (!jw || !jw.id || deletedIds.has(jw.id)) return;
      const exists = activeWishes.some((w) => w.id === jw.id);
      if (!exists) {
        activeWishes.push(jw);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      saveWishes(activeWishes);
      renderAllLanterns();
      if (adminDataScreen && adminDataScreen.style.display === "block") {
        renderAdminWishesTable();
      }
    }
  }

  syncWishesFromJSONFile();

  // ------------------------------------------------------------------------
  // INISIALISASI FIREBASE REALTIME DATABASE UNTUK SINKRONISASI MULTI-DEVICE
  // ------------------------------------------------------------------------
  function initFirebaseDatabase() {
    if (typeof firebase === "undefined") {
      setTimeout(initFirebaseDatabase, 200);
      return;
    }
    if (!FIREBASE_CONFIG || !FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey.startsWith("YOUR_")) {
      return;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      firebaseDbRef = firebase.database().ref("wishes");
      isFirebaseReady = true;

      // 1. Dengarkan pesan baru dari orang lain di seluruh dunia secara real time
      firebaseDbRef.on("child_added", (snapshot) => {
        const wish = snapshot.val();
        if (!wish || !wish.id) return;
        const deletedIds = getDeletedIds();
        if (deletedIds.has(wish.id)) return;

        const exists = activeWishes.some((w) => w.id === wish.id);
        if (!exists) {
          activeWishes.unshift(wish);
          saveUserWish(wish);
          saveWishes(activeWishes);

          // Jika pesan baru saja dirilis oleh orang lain (dalam 20 detik terakhir), terbangkan lenteranya!
          const isFresh = (Date.now() - (wish.timestamp || 0)) < 20000;
          if (isFresh) {
            launchFlyingLanternToSky(wish, null);
          } else {
            const lanternEl = createLanternDOM(wish, false);
            lanternSkyArea.appendChild(lanternEl);
          }
          updateSkyCountText();
          if (adminDataScreen && adminDataScreen.style.display === "block") {
            renderAdminWishesTable();
          }
        }
      });

      // 2. Dengarkan penghapusan pesan oleh admin secara real time di seluruh device
      firebaseDbRef.on("child_removed", (snapshot) => {
        const wish = snapshot.val();
        if (!wish || !wish.id) return;
        activeWishes = activeWishes.filter((w) => w.id !== wish.id);
        addDeletedId(wish.id);
        removeUserWish(wish.id);

        const lanternEl = lanternSkyArea.querySelector(`.floating-lantern[data-id="${wish.id}"]`);
        if (lanternEl) {
          lanternEl.style.transition = "transform 0.5s ease, opacity 0.5s ease";
          lanternEl.style.opacity = "0";
          lanternEl.style.transform = "scale(0.2)";
          setTimeout(() => lanternEl.remove(), 500);
        }
        updateSkyCountText();
        if (adminDataScreen && adminDataScreen.style.display === "block") {
          renderAdminWishesTable();
        }
      });

      // 3. Jika database masih kosong pada setup pertama kali, salin harapan awal ke Firebase
      firebaseDbRef.once("value", (snapshot) => {
        if (!snapshot.exists()) {
          DEFAULT_WISHES.forEach((w) => {
            firebaseDbRef.child(w.id).set(w);
          });
        }
      });
    } catch (err) {
      console.warn("Wishlight: Firebase error:", err);
    }
  }

  initFirebaseDatabase();

  // ------------------------------------------------------------------------
  // A. KANVAS LANGIT MALAM BERBINTANG (STARS & COSMIC GLOW)
  // ------------------------------------------------------------------------
  let width = 0;
  let height = 0;
  let dpr = 1;
  const stars = [];
  const shootingStars = [];

  function initStarfield() {
    stars.length = 0;
    const starCount = Math.floor(Math.min(width, 1400) * 0.16);
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.9,
        radius: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.7 + 0.25,
        twinkleSpeed: (Math.random() * 0.02 + 0.008) * (Math.random() > 0.5 ? 1 : -1),
        color: Math.random() > 0.25 ? "#fff6d9" : "#b0d0f5"
      });
    }
  }

  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    const rect = playSection.getBoundingClientRect();
    width = rect.width;
    height = rect.height;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    initStarfield();
  }

  window.addEventListener("resize", resizeCanvas, { passive: true });
  resizeCanvas();

  // Peluncur Komet / Bintang Jatuh Berkala (Lebih Sering & Elegan)
  let lastShootingStarTime = 0;
  function maybeSpawnShootingStar() {
    const now = Date.now();
    const timeSinceLast = now - lastShootingStarTime;
    const isReadyByTime = timeSinceLast > 850 && Math.random() < 0.055;
    const isForceSpawn = timeSinceLast > 2100; // jaminan maksimal ~2.1 detik pasti muncul komet

    if (shootingStars.length < 4 && (isReadyByTime || isForceSpawn)) {
      lastShootingStarTime = now;
      const isWarm = Math.random() > 0.45;
      shootingStars.push({
        x: Math.random() * width * 0.8 + width * 0.05,
        y: Math.random() * height * 0.45,
        len: Math.random() * 95 + 65,
        speed: Math.random() * 9 + 13,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.35,
        lineWidth: Math.random() * 0.8 + 1.4,
        color: isWarm ? "255, 235, 175" : "200, 230, 255",
        opacity: 1
      });
    }
  }

  function renderSky() {
    ctx.clearRect(0, 0, width, height);

    // 1. Gambar Bintang Berkelip
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.alpha += s.twinkleSpeed;
      if (s.alpha > 0.95 || s.alpha < 0.18) {
        s.twinkleSpeed = -s.twinkleSpeed;
      }

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0.1, Math.min(1, s.alpha));
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 2. Gambar Bintang Jatuh / Shooting Stars
    maybeSpawnShootingStar();
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const ss = shootingStars[i];
      const tailX = ss.x - Math.cos(ss.angle) * ss.len;
      const tailY = ss.y - Math.sin(ss.angle) * ss.len;

      const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
      const color = ss.color || "255, 245, 210";
      grad.addColorStop(0, `rgba(${color}, ${ss.opacity})`);
      grad.addColorStop(1, `rgba(${color}, 0)`);

      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = ss.lineWidth || 1.8;
      ctx.stroke();

      ss.x += Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;
      ss.opacity -= 0.022;

      if (ss.opacity <= 0 || ss.x > width + 100 || ss.y > height + 100) {
        shootingStars.splice(i, 1);
      }
    }

    requestAnimationFrame(renderSky);
  }

  requestAnimationFrame(renderSky);

  // ------------------------------------------------------------------------
  // B. UMUR LENTERA, PALET WARNA-WARNI & LINTASAN PERGERAKAN MELAYANG
  // ------------------------------------------------------------------------
  function getLanternAgeTier(timestamp) {
    const ageMs = Date.now() - timestamp;
    const hours = ageMs / (1000 * 60 * 60);

    if (hours < 24) {
      return "lantern-fresh";
    } else if (hours < 168) {
      return "lantern-mid";
    } else {
      return "lantern-distant";
    }
  }

  function formatRelativeTime(timestamp) {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 30) return `${diffDay} days ago`;
    return new Date(timestamp).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function createLanternDOM(wish, isRising = false) {
    const tier = getLanternAgeTier(wish.timestamp);
    // Warna hanya Kuning (#fedf85) atau Biru (#8aabce) sesuai bagian atas
    const color = (wish.color === "blue" || wish.color === "azure") ? "blue" : "yellow";

    const lantern = document.createElement("div");
    lantern.className = `floating-lantern ${tier} lantern-color-${color}`;
    lantern.setAttribute("data-id", wish.id);
    lantern.setAttribute("role", "button");
    lantern.setAttribute("tabindex", "0");
    lantern.setAttribute("aria-label", `Floating anonymous ${color} wish lantern`);

    // Posisi fix yang stabil dan presisi di langit malam
    lantern.style.top = `${wish.top}%`;
    lantern.style.left = `${wish.left}%`;
    lantern.style.transform = "translate(-50%, -50%)";

    // Bentuk silinder lentera Tionghoa tradisional bercahaya kuning atau biru
    lantern.innerHTML = `
      <div class="lantern-body">
        <div class="lantern-cap-top"></div>
        <div class="lantern-flame-core"></div>
        <div class="lantern-cap-bottom"></div>
        <div class="lantern-tassel"></div>
      </div>
    `;

    // Interaksi Klik: Memperbesar lentera & menampilkan kartu harapan
    function handleOpenWish() {
      if (viewContent) viewContent.textContent = `“${wish.text}”`;
      if (viewTime) viewTime.textContent = formatRelativeTime(wish.timestamp);

      // Sesuaikan warna box & blockquote sesuai warna lenteranya (kuning / biru)
      const wishColor = (wish.color === "blue" || wish.color === "azure") ? "blue" : "yellow";
      const wishCard = viewModal ? viewModal.querySelector(".lantern-wish-card-modal") : null;
      if (wishCard) {
        wishCard.classList.remove("theme-yellow", "theme-blue");
        wishCard.classList.add(`theme-${wishColor}`);
      }

      if (viewModal) {
        viewModal.classList.add("is-open");
        viewModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      }

      // Riak latar lembut
      if (window.spawnBgRipple) {
        const rect = lantern.getBoundingClientRect();
        window.spawnBgRipple(rect.left + rect.width / 2, rect.top + rect.height / 2, 20.0);
      }
    }

    lantern.addEventListener("click", handleOpenWish);
    lantern.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOpenWish();
      }
    });

    return lantern;
  }

  function renderAllLanterns() {
    lanternSkyArea.innerHTML = "";
    activeWishes.forEach((wish) => {
      const lanternEl = createLanternDOM(wish, false);
      lanternSkyArea.appendChild(lanternEl);
    });
    updateSkyCountText();
  }

  function updateSkyCountText() {
    if (countText) {
      countText.textContent = `${activeWishes.length} Lanterns Shining in the Sky`;
    }
  }

  renderAllLanterns();

  // ------------------------------------------------------------------------
  // C. MERILIS LENTERA BARU KE ANGKASA (KUNING / BIRU)
  // ------------------------------------------------------------------------
  let selectedLanternColor = "yellow";

  if (colorChoiceBtns) {
    colorChoiceBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        colorChoiceBtns.forEach((b) => b.classList.remove("is-selected"));
        this.classList.add("is-selected");
        selectedLanternColor = this.getAttribute("data-color") || "yellow";

        if (miniLanternPreview) {
          const glowColor = COLOR_GLOW_MAP[selectedLanternColor] || "#fedf85";
          miniLanternPreview.style.filter = `drop-shadow(0 0 18px ${glowColor})`;
        }
      });
    });
  }

  function openReleaseModal() {
    if (releaseModal) {
      releaseModal.classList.add("is-open");
      releaseModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (wishInput) {
        setTimeout(() => wishInput.focus(), 150);
      }
    }
  }

  function closeReleaseModal() {
    if (releaseModal) {
      releaseModal.classList.remove("is-open");
      releaseModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
  }

  if (openReleaseBtn) openReleaseBtn.addEventListener("click", openReleaseModal);
  if (closeReleaseBtn) closeReleaseBtn.addEventListener("click", closeReleaseModal);
  if (releaseModal) {
    releaseModal.addEventListener("click", (e) => {
      if (e.target === releaseModal) closeReleaseModal();
    });
  }

  if (wishInput && wishCharCount) {
    wishInput.addEventListener("input", function () {
      wishCharCount.textContent = this.value.length;
    });
  }

  function spawnFlightEmber(x, y, color) {
    const ember = document.createElement("div");
    ember.className = "flight-sparkle-dot";
    const size = (3.5 + Math.random() * 4).toFixed(1);
    const driftX = ((Math.random() - 0.5) * 16).toFixed(1);
    const driftY = (8 + Math.random() * 18).toFixed(1);
    ember.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      box-shadow: 0 0 10px ${color}, 0 0 20px ${color};
      opacity: 0.95;
      pointer-events: none;
      z-index: 35;
      transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.3, 1), opacity 0.8s ease;
    `;
    if (lanternSkyArea) {
      lanternSkyArea.appendChild(ember);
    } else {
      document.body.appendChild(ember);
    }

    requestAnimationFrame(() => {
      ember.style.transform = `translate(${driftX}px, ${driftY}px) scale(0.2)`;
      ember.style.opacity = "0";
    });

    setTimeout(() => ember.remove(), 850);
  }

  // ------------------------------------------------------------------------
  // FUNGSI TERBANG LENTERA DARI TOMBOL RILIS KE LANGIT (BEBAS LEPAS DI DALAM #WISHLIGHT)
  // ------------------------------------------------------------------------
  function launchFlyingLanternToSky(newWish, startElementOrPoint) {
    const skyRect = lanternSkyArea.getBoundingClientRect();

    // 1. Dapatkan koordinat awal tombol rilis relatif terhadap container lanternSkyArea
    let startX = skyRect.width * 0.5;
    let startY = skyRect.height * 0.82;

    if (startElementOrPoint && typeof startElementOrPoint.getBoundingClientRect === "function") {
      const rect = startElementOrPoint.getBoundingClientRect();
      startX = rect.left - skyRect.left + rect.width / 2;
      startY = rect.top - skyRect.top + rect.height / 2;
    } else if (startElementOrPoint && typeof startElementOrPoint.x === "number") {
      startX = startElementOrPoint.x - skyRect.left;
      startY = startElementOrPoint.y - skyRect.top;
    }

    // Pastikan batas koordinat awal tidak keluar dari batas aman container
    startX = Math.max(skyRect.width * 0.15, Math.min(skyRect.width * 0.85, startX));
    startY = Math.max(skyRect.height * 0.65, Math.min(skyRect.height * 0.88, startY));

    // 2. Dapatkan koordinat tujuan di langit malam (#wishlight) relatif terhadap container
    const targetX = (newWish.left / 100) * skyRect.width;
    const targetY = (newWish.top / 100) * skyRect.height;

    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    const swayDir = deltaX >= 0 ? 1 : -1;

    // 3. Buat lentera terbang di dalam container lanternSkyArea (tidak akan pernah menembus navbar / halaman lain)
    const color = (newWish.color === "blue" || newWish.color === "azure") ? "blue" : "yellow";
    const flyingEl = document.createElement("div");
    flyingEl.className = `active-flying-lantern lantern-color-${color}`;
    flyingEl.style.left = `${startX}px`;
    flyingEl.style.top = `${startY}px`;
    flyingEl.innerHTML = `
      <div class="lantern-body">
        <div class="lantern-cap-top"></div>
        <div class="lantern-flame-core"></div>
        <div class="lantern-cap-bottom"></div>
        <div class="lantern-tassel"></div>
      </div>
    `;
    lanternSkyArea.appendChild(flyingEl);

    // 4. Efek riak cahaya lepas landas di kanvas
    if (window.spawnBgRipple) {
      window.spawnBgRipple(skyRect.left + startX, skyRect.top + startY, 26.0);
    }

    // 5. Jejak kilau stardust emas / biru berjatuhan di udara selama lentera meluncur naik
    const emberColor = color === "blue" ? "#a6c5e2" : "#ffe082";
    const trailInterval = setInterval(() => {
      if (!flyingEl.isConnected) {
        clearInterval(trailInterval);
        return;
      }
      const r = flyingEl.getBoundingClientRect();
      const sRect = lanternSkyArea.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        for (let i = 0; i < 2; i++) {
          const px = (r.left - sRect.left) + r.width * (0.35 + Math.random() * 0.3);
          const py = (r.bottom - sRect.top) - 4 + Math.random() * 6;
          spawnFlightEmber(px, py, emberColor);
        }
      }
    }, 65);

    // 6. Lintasan terbang dinamis, anggun, tidak terlalu jauh, dan mendarat presisi di titik tujuan
    const flightKeyframes = [
      {
        transform: "translate3d(-50%, -50%, 0) scale(1.6) rotate(-2deg)",
        opacity: 0.95,
        offset: 0
      },
      {
        transform: `translate3d(calc(-50% + ${deltaX * 0.20 - swayDir * 10}px), calc(-50% + ${deltaY * 0.22}px), 0) scale(1.48) rotate(1.5deg)`,
        opacity: 1,
        offset: 0.20
      },
      {
        transform: `translate3d(calc(-50% + ${deltaX * 0.45 + swayDir * 12}px), calc(-50% + ${deltaY * 0.48}px), 0) scale(1.32) rotate(-1deg)`,
        opacity: 1,
        offset: 0.45
      },
      {
        transform: `translate3d(calc(-50% + ${deltaX * 0.72 - swayDir * 8}px), calc(-50% + ${deltaY * 0.74}px), 0) scale(1.18) rotate(0.8deg)`,
        opacity: 1,
        offset: 0.72
      },
      {
        transform: `translate3d(calc(-50% + ${deltaX * 0.90 + swayDir * 3}px), calc(-50% + ${deltaY * 0.92}px), 0) scale(1.06) rotate(-0.3deg)`,
        opacity: 1,
        offset: 0.90
      },
      {
        transform: `translate3d(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px), 0) scale(1) rotate(0deg)`,
        opacity: 1,
        offset: 1
      }
    ];

    const animation = flyingEl.animate(flightKeyframes, {
      duration: 3800,
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      fill: "forwards"
    });

    animation.onfinish = () => {
      clearInterval(trailInterval);

      // Buat lentera permanen di container langit malam pada posisi fix yang sama persis
      const settledLantern = createLanternDOM(newWish, false);
      lanternSkyArea.appendChild(settledLantern);
      updateSkyCountText();

      // Hembuskan lingkaran riak gelombang cahaya kedatangan di langit
      const halo = document.createElement("div");
      halo.className = "lantern-arrival-halo";
      settledLantern.appendChild(halo);
      setTimeout(() => halo.remove(), 1600);

      // Riak kanvas halus di langit tempat lentera menetap
      if (window.spawnBgRipple) {
        window.spawnBgRipple(skyRect.left + targetX, skyRect.top + targetY, 28.0);
      }

      // Hapus elemen terbang sementara secara mulus
      flyingEl.remove();
    };
  }

  if (releaseForm) {
    releaseForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const rawText = wishInput ? wishInput.value.trim() : "";
      const text = rawText || "May every quiet wish find its light under the stars.";

      // Target posisi lentera baru: tetap berada di zona langit aman (26% - 50%)
      // Jarak terbang proporsional (tidak kejauhan), dan tidak melewati navbar atau batas halaman
      const targetTop = Number((26 + Math.random() * 24).toFixed(1));
      const targetLeft = Number((12 + Math.random() * 76).toFixed(1));

      const newWish = {
        id: "wish-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        text: text,
        timestamp: Date.now(),
        top: targetTop,
        left: targetLeft,
        color: selectedLanternColor || "yellow"
      };

      // Simpan ke Shared Sky (LocalStorage & Cadangan User)
      activeWishes.unshift(newWish);
      saveUserWish(newWish);
      saveWishes(activeWishes);

      // Simpan ke Cloud Firebase agar tersinkronisasi real-time ke semua orang di seluruh dunia
      if (isFirebaseReady && firebaseDbRef) {
        firebaseDbRef.child(newWish.id).set(newWish).catch((err) => {
          console.warn("Wishlight: Could not save wish to Firebase:", err);
        });
      }

      // Ambil posisi tombol rilis yang ditekan sebelum modal ditutup
      const submitBtn = document.getElementById("submitWishBtn") || e.target;
      const launchCoords = submitBtn ? submitBtn.getBoundingClientRect() : null;

      // Tutup modal secara instan (0ms) agar pemandangan langit malam langsung terbuka lebar
      if (releaseModal) {
        releaseModal.classList.remove("is-open");
        releaseModal.setAttribute("aria-hidden", "true");
        releaseModal.style.display = "none";
        setTimeout(() => { releaseModal.style.display = ""; }, 500);
      }
      document.body.style.overflow = "";

      if (wishInput) wishInput.value = "";
      if (wishCharCount) wishCharCount.textContent = "0";

      // TERBANGKAN LENTERA LANGSUNG DARI TOMBOL RILIS TERUS KE LANGIT MALAM
      launchFlyingLanternToSky(newWish, launchCoords);
    });
  }

  // ------------------------------------------------------------------------
  // E. MODAL MEMBACA HARAPAN (VIEW WISH MODAL)
  // ------------------------------------------------------------------------
  function closeViewModal() {
    if (viewModal) {
      viewModal.classList.remove("is-open");
      viewModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
  }

  if (closeViewBtn) closeViewBtn.addEventListener("click", closeViewModal);
  if (viewModal) {
    viewModal.addEventListener("click", (e) => {
      if (e.target === viewModal) closeViewModal();
    });
  }

  // ------------------------------------------------------------------------
  // G. PRIVATE ADMIN DASHBOARD (PENGELOLAAN HARAPAN ANONIM)
  // ------------------------------------------------------------------------
  function openAdminModal() {
    if (adminModal) {
      adminModal.classList.add("is-open");
      adminModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      // Cek apakah admin sudah login dalam sesi browser ini
      let isAuth = false;
      try {
        isAuth = sessionStorage.getItem("kerlyn_admin_auth") === "true";
      } catch (e) { }

      if (isAuth) {
        if (adminPasscodeScreen) adminPasscodeScreen.style.display = "none";
        if (adminDataScreen) adminDataScreen.style.display = "block";
        renderAdminWishesTable();
      } else {
        if (adminPasscodeScreen) adminPasscodeScreen.style.display = "block";
        if (adminDataScreen) adminDataScreen.style.display = "none";
      }
    }
  }

  function closeAdminModal() {
    if (adminModal) {
      adminModal.classList.remove("is-open");
      adminModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (adminPassInput) adminPassInput.value = "";
      if (adminErrorMsg) adminErrorMsg.style.display = "none";
    }
  }

  if (adminBtn) adminBtn.addEventListener("click", openAdminModal);
  if (closeAdminBtn) closeAdminBtn.addEventListener("click", closeAdminModal);
  if (adminModal) {
    adminModal.addEventListener("click", (e) => {
      if (e.target === adminModal) closeAdminModal();
    });
  }

  // Verifikasi Kode Akses Admin ('kerlyn')
  if (adminLoginForm && adminPassInput) {
    adminLoginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = adminPassInput.value.trim().toLowerCase();
      if (code === "kerlyn") {
        try {
          sessionStorage.setItem("kerlyn_admin_auth", "true");
        } catch (e) { }
        if (adminErrorMsg) adminErrorMsg.style.display = "none";
        if (adminPasscodeScreen) adminPasscodeScreen.style.display = "none";
        if (adminDataScreen) adminDataScreen.style.display = "block";
        renderAdminWishesTable();
      } else {
        if (adminErrorMsg) {
          adminErrorMsg.textContent = "Incorrect passcode.";
          adminErrorMsg.style.display = "block";
        }
      }
    });
  }

  function formatAdminDateTime(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  const adminWishesCount = document.getElementById("adminWishesCount");
  const adminDownloadJsonBtn = document.getElementById("adminDownloadJsonBtn");
  const adminCopyJsonBtn = document.getElementById("adminCopyJsonBtn");

  function renderAdminWishesTable() {
    if (adminWishesCount) {
      adminWishesCount.textContent = activeWishes.length;
    }
    if (!adminWishesTbody) return;
    adminWishesTbody.innerHTML = "";

    if (activeWishes.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td colspan="3" style="text-align: center; color: rgba(201, 216, 234, 0.6); padding: 24px; font-style: italic;">
          No active wishes found in the sky.
        </td>
      `;
      adminWishesTbody.appendChild(tr);
      return;
    }

    activeWishes.forEach((wish) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="white-space: nowrap; font-size: 11.5px; color: #8aabce;">${formatAdminDateTime(wish.timestamp)}</td>
        <td style="max-width: 300px; line-height: 1.4;">${wish.text}</td>
        <td>
          <button type="button" class="admin-delete-btn font-urca" data-id="${wish.id}">Delete</button>
        </td>
      `;

      const deleteBtn = tr.querySelector(".admin-delete-btn");
      deleteBtn.addEventListener("click", () => {
        deleteWishById(wish.id);
      });

      adminWishesTbody.appendChild(tr);
    });
  }

  // Tombol Unduh / Download File wishes.json
  if (adminDownloadJsonBtn) {
    adminDownloadJsonBtn.addEventListener("click", () => {
      const jsonContent = JSON.stringify(activeWishes, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const tempLink = document.createElement("a");
      tempLink.href = url;
      tempLink.download = "wishes.json";
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(url);
    });
  }

  // Tombol Salin Data JSON ke Clipboard
  if (adminCopyJsonBtn) {
    adminCopyJsonBtn.addEventListener("click", function () {
      const jsonContent = JSON.stringify(activeWishes, null, 2);
      const btn = this;
      const initialText = btn.innerHTML;

      function showCopiedFeedback() {
        btn.innerHTML = "<span>✓ Copied!</span>";
        btn.style.color = "#81c784";
        btn.style.borderColor = "#81c784";
        setTimeout(() => {
          btn.innerHTML = initialText;
          btn.style.color = "";
          btn.style.borderColor = "";
        }, 2000);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(jsonContent)
          .then(showCopiedFeedback)
          .catch(() => fallbackCopy(jsonContent, showCopiedFeedback));
      } else {
        fallbackCopy(jsonContent, showCopiedFeedback);
      }
    });
  }

  function fallbackCopy(text, callback) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      if (callback) callback();
    } catch (e) {
      console.warn("Copy fallback failed:", e);
    }
    document.body.removeChild(ta);
  }

  function deleteWishById(id) {
    // Catat ID yang dihapus agar tidak pernah dipulihkan atau ter-reset
    addDeletedId(id);
    removeUserWish(id);

    // Hapus dari data aktif
    activeWishes = activeWishes.filter((w) => w.id !== id);
    saveWishes(activeWishes);

    // Hapus dari Cloud Firebase secara real time jika terhubung
    if (isFirebaseReady && firebaseDbRef) {
      firebaseDbRef.child(id).remove().catch((err) => {
        console.warn("Wishlight: Could not remove wish from Firebase:", err);
      });
    }

    // Hapus lentera dari kanvas/DOM dengan transisi menghilang
    const lanternEl = lanternSkyArea.querySelector(`.floating-lantern[data-id="${id}"]`);
    if (lanternEl) {
      lanternEl.style.transition = "transform 0.5s ease, opacity 0.5s ease";
      lanternEl.style.opacity = "0";
      lanternEl.style.transform = "scale(0.2)";
      setTimeout(() => lanternEl.remove(), 500);
    }

    renderAdminWishesTable();
    updateSkyCountText();
  }

  // Shortcut tombol Escape untuk menutup semua modal
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (releaseModal && releaseModal.classList.contains("is-open")) closeReleaseModal();
      if (viewModal && viewModal.classList.contains("is-open")) closeViewModal();
      if (adminModal && adminModal.classList.contains("is-open")) closeAdminModal();
    }
  });
}

/* --------------------------------------------------------------------------
   12. INTERAKTIVITAS SECTION #CONTACT & FOOTER
   - 1-Click Copy Email dengan feedback visual "Copied!"
   - Pemilih topik kolaborasi interaktif (pills)
   - Form pesan interaktif dengan konfirmasi pesan sukses
   - Avatar interaktif dengan speech bubble yang berputar ramah
   - Tombol Back to Top yang menggulir halus ke bagian paling atas website (#home)
   -------------------------------------------------------------------------- */
function initContactSection() {
  // 1. Copy Email Button
  const copyEmailBtn = document.getElementById("copyEmailBtn");
  const emailTextEl = document.getElementById("emailAddressText");

  if (copyEmailBtn && emailTextEl) {
    const copyBtnText = copyEmailBtn.querySelector(".copy-btn-text");
    copyEmailBtn.addEventListener("click", () => {
      const email = emailTextEl.textContent.trim() || "kerlynlawranceee@gmail.com";

      navigator.clipboard.writeText(email).then(() => {
        if (copyBtnText) copyBtnText.textContent = "Copied!";
        copyEmailBtn.style.background = "#fedf85";
        copyEmailBtn.style.color = "#754c24";
        copyEmailBtn.style.boxShadow = "0 0 18px rgba(254, 223, 133, 0.7)";

        setTimeout(() => {
          if (copyBtnText) copyBtnText.textContent = "Copy";
          copyEmailBtn.style.background = "";
          copyEmailBtn.style.color = "";
          copyEmailBtn.style.boxShadow = "";
        }, 2200);
      }).catch(() => {
        // Fallback jika clipboard API diblokir browser
        const tempInput = document.createElement("input");
        tempInput.value = email;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        tempInput.remove();

        if (copyBtnText) copyBtnText.textContent = "Copied!";
        setTimeout(() => {
          if (copyBtnText) copyBtnText.textContent = "Copy";
        }, 2200);
      });
    });
  }

  // 2. Form Pengiriman Pesan Langsung ke Email kerlynlawranceee@gmail.com
  const contactForm = document.getElementById("contactDirectForm");
  const senderNameInput = document.getElementById("contactSenderName");
  const senderEmailInput = document.getElementById("contactSenderEmail");
  const messageInput = document.getElementById("contactMessageText");
  const noticeEl = document.getElementById("contactFormNotice");
  const noticeText = document.getElementById("contactNoticeText");
  const submitBtn = document.getElementById("contactSubmitBtn");
  const submitBtnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;
  const targetIframe = document.getElementById("formsubmit_target_iframe");

  function showFormNotice(type, message) {
    if (!noticeEl || !noticeText) return;
    noticeEl.style.display = "flex";
    if (type === "error") {
      noticeEl.style.background = "rgba(239, 68, 68, 0.15)";
      noticeEl.style.borderColor = "rgba(239, 68, 68, 0.4)";
      noticeEl.style.color = "#fca5a5";
    } else if (type === "loading") {
      noticeEl.style.background = "rgba(254, 223, 133, 0.15)";
      noticeEl.style.borderColor = "rgba(254, 223, 133, 0.4)";
      noticeEl.style.color = "#fedf85";
    } else {
      // success
      noticeEl.style.background = "rgba(74, 222, 128, 0.15)";
      noticeEl.style.borderColor = "rgba(74, 222, 128, 0.4)";
      noticeEl.style.color = "#86efac";
    }
    noticeText.innerHTML = message;
  }

  if (contactForm) {
    let isSubmitting = false;

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (isSubmitting) return;

      const name = senderNameInput ? senderNameInput.value.trim() : "";
      const email = senderEmailInput ? senderEmailInput.value.trim() : "";
      const message = messageInput ? messageInput.value.trim() : "";

      if (!name || !email || !message) {
        showFormNotice("error", "Mohon lengkapi nama, email, dan pesan Anda sebelum mengirimkan.");
        return;
      }

      // Validasi format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showFormNotice("error", "Format email tidak valid. Masukkan alamat email yang benar.");
        return;
      }

      // Perbarui subject form
      const subjectInput = document.getElementById("contactEmailSubject");
      if (subjectInput) {
        subjectInput.value = `[Portfolio Inquiry] ${name}`;
      }

      isSubmitting = true;
      if (submitBtn) submitBtn.disabled = true;
      if (submitBtnText) submitBtnText.textContent = "Sending...";
      showFormNotice("loading", "Sending a message to kerlynlawranceee@gmail.com...");

      let handled = false;

      function onComplete() {
        if (handled) return;
        handled = true;
        isSubmitting = false;

        if (submitBtn) submitBtn.disabled = false;
        if (submitBtnText) submitBtnText.textContent = "Send Message";

        // Tampilkan pesan konfirmasi sukses beserta petunjuk verifikasi Gmail
        const gmailDirectUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=kerlynlawranceee@gmail.com&su=${encodeURIComponent(`[Portfolio Inquiry] ${name}`)}&body=${encodeURIComponent(message)}`;

        showFormNotice("success", `
          <div style="line-height: 1.5;">
            <strong>Your message is being sent to kerlynlawranceee@gmail.com!</strong><br>
        `);

        // Animasi partikel kilau
        if (submitBtn) {
          const rect = submitBtn.getBoundingClientRect();
          for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement("div");
            sparkle.className = "dynamic-sparkle-dot";
            sparkle.style.cssText = `
              position: fixed;
              left: ${rect.left + rect.width / 2}px;
              top: ${rect.top + rect.height / 2}px;
              width: 8px;
              height: 8px;
              background-color: #fedf85;
              border-radius: 50%;
              box-shadow: 0 0 12px #fedf85;
              pointer-events: none;
              z-index: 99999;
              transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.65s ease;
            `;
            document.body.appendChild(sparkle);

            const angle = (i * Math.PI) / 4;
            const dist = 35 + Math.random() * 25;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist;

            requestAnimationFrame(() => {
              sparkle.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
              sparkle.style.opacity = "0";
            });

            setTimeout(() => sparkle.remove(), 700);
          }
        }

        // Reset input form
        contactForm.reset();
        topicPills.forEach((p) => p.classList.remove("is-active"));
        if (topicPills[0]) topicPills[0].classList.add("is-active");
        selectedTopic = "Graphic Design";
        if (topicHiddenInput) topicHiddenInput.value = "Graphic Design";

        setTimeout(() => {
          if (noticeEl) noticeEl.style.display = "none";
        }, 15000);
      }

      // Dengarkan respon iframe
      if (targetIframe) {
        targetIframe.onload = () => {
          onComplete();
        };
      }

      // Timeout fallback agar UI tidak pernah macet
      setTimeout(() => {
        if (!handled) onComplete();
      }, 3500);

      // Kirim formulir langsung via target hidden iframe (bebas hambatan CORS file://)
      contactForm.target = "formsubmit_target_iframe";
      HTMLFormElement.prototype.submit.call(contactForm);
    });
  }

  // 4. Avatar Interaktif Mini dengan Kata-Kata Berputar Otomatis
  const avatarBadge = document.getElementById("contactAvatarBadge");
  if (avatarBadge) {
    const bubbleSpan = avatarBadge.querySelector(".contact-avatar-bubble span");
    const friendlyPhrases = [
      "\"Looking forward to hearing from you!\"",
      "\"Let's create something wonderful together!\"",
      "\"Design is all about stories and connection!\"",
      "\"Feel free to drop a line anytime!\""
    ];
    let phraseIdx = 0;
    let autoRotateTimer = null;

    function nextPhrase(animateBounce = false) {
      phraseIdx = (phraseIdx + 1) % friendlyPhrases.length;
      if (bubbleSpan) {
        bubbleSpan.style.opacity = "0";
        bubbleSpan.style.transform = "translateY(-4px)";
        setTimeout(() => {
          bubbleSpan.textContent = friendlyPhrases[phraseIdx];
          bubbleSpan.style.opacity = "1";
          bubbleSpan.style.transform = "translateY(0)";
        }, 220);
      }

      if (animateBounce) {
        // Animasi pentalan avatar saat disentuh/diklik
        avatarBadge.style.transform = "scale(1.08) rotate(3deg)";
        setTimeout(() => {
          avatarBadge.style.transform = "";
        }, 350);
      }
    }

    function startAutoRotate() {
      if (autoRotateTimer) clearInterval(autoRotateTimer);
      autoRotateTimer = setInterval(() => {
        nextPhrase(false);
      }, 3500); // Berganti sendiri secara otomatis setiap 3.5 detik
    }

    // Mulai pergantian kata otomatis
    startAutoRotate();

    // Klik/sentuh manual: ganti seketika & reset interval agar ritme tetap teratur
    avatarBadge.addEventListener("click", () => {
      nextPhrase(true);
      startAutoRotate();
    });
  }

  // 5. Tombol Back to Top
  const backToTopBtn = document.getElementById("backToTopBtn");
  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }
}

/* --------------------------------------------------------------------------
   MINI GAME: HOPPING THROUGH MY JOURNEY (#journey)
   - Vertical Platformer: Bebek Ungu Melompat Antar Awan Mengumpulkan Bintang Emas
   - Modal 1:1 Square dengan Start Screen, Pause, dan Game Over
   - Kontrol Desktop (Panah / A & D), Mobile Touch Buttons, dan Web Audio Synth
   -------------------------------------------------------------------------- */
function initJourneyMiniGame() {
  const gameCard = document.getElementById("journeyGameCard");
  const modalBackdrop = document.getElementById("journeyGameModalBackdrop");
  const modalCloseBtn = document.getElementById("closeGameModalBtn");
  const canvas = document.getElementById("journeyGameCanvas");
  if (!gameCard || !modalBackdrop || !canvas) return;

  // Pastikan modal benar-benar tersembunyi secara default agar TIDAK menghalangi klik halaman
  modalBackdrop.style.display = "none";
  modalBackdrop.classList.remove("is-open");

  const ctx = canvas.getContext("2d");

  // DOM Overlays & HUD Elements
  const startOverlay = document.getElementById("gameStartOverlay");
  const pauseOverlay = document.getElementById("gamePauseOverlay");
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  const hudBar = document.getElementById("gameHudBar");
  const mobileTouchBar = document.getElementById("gameMobileTouchBar");

  const hudScoreVal = document.getElementById("hudScoreVal");
  const hudTimerVal = document.getElementById("hudTimerVal");
  const btnMute = document.getElementById("btnGameMute");
  const btnPause = document.getElementById("btnGamePause");

  const btnTouchLeft = document.getElementById("btnTouchLeft");
  const btnTouchRight = document.getElementById("btnTouchRight");

  const btnStartHopping = document.getElementById("btnStartHopping");
  const btnResumeGame = document.getElementById("btnResumeGame");
  const btnRestartGame = document.getElementById("btnRestartGame");
  const btnPlayAgain = document.getElementById("btnPlayAgain");
  const btnBackToJourney = document.getElementById("btnBackToJourney");

  const goScoreText = document.getElementById("goScoreText");
  const goStarsText = document.getElementById("goStarsText");
  const statFinalScore = document.getElementById("statFinalScore");
  const statFinalStars = document.getElementById("statFinalStars");

  // Web Audio API Synthesizer
  let audioCtx = null;
  let isSoundMuted = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function playTone(freqStart, freqEnd, type, duration, vol = 0.15) {
    if (isSoundMuted || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, now);
      if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
      }

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) { }
  }

  function playBounceSound() {
    playTone(340, 680, "sine", 0.14, 0.18);
  }

  function playStarSound() {
    playTone(880, 1320, "triangle", 0.16, 0.22);
    setTimeout(() => {
      playTone(1320, 1760, "sine", 0.14, 0.18);
    }, 60);
  }

  function playGameOverSound() {
    playTone(440, 220, "sine", 0.35, 0.2);
  }

  function playVictorySound() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      setTimeout(() => {
        playTone(f, f, "triangle", 0.18, 0.18);
      }, idx * 100);
    });
  }

  // Preload Purple Duck Sprite
  const duckImg = new Image();
  duckImg.src = "asset/image/branding.webp";

  // Game Engine State
  const GAME_STATES = {
    START: "start",
    PLAYING: "playing",
    PAUSED: "paused",
    GAMEOVER: "gameover"
  };

  let gameState = GAME_STATES.START;
  let score = 0;
  let starsCount = 0;
  let remainingTime = 60;
  let lastTime = 0;
  let animFrameId = null;
  let prevScrollY = 0;

  // Keyboard and Input state
  const keys = { left: false, right: false };

  // Entities
  let duck = null;
  let platforms = [];
  let stars = [];
  let particles = [];
  let scorePops = [];
  let bgClouds = [];

  const VIRTUAL_WIDTH = 560;
  const VIRTUAL_HEIGHT = 560;

  function resetGame() {
    score = 0;
    starsCount = 0;
    remainingTime = 60;
    particles = [];
    scorePops = [];

    duck = {
      x: VIRTUAL_WIDTH / 2 - 27,
      y: VIRTUAL_HEIGHT - 120,
      prevY: VIRTUAL_HEIGHT - 120,
      vx: 0,
      vy: -680,
      width: 54,
      height: 75,
      facing: 1,
      squash: 1.0
    };

    platforms = [];
    stars = [];

    // Starting platform
    platforms.push({
      x: VIRTUAL_WIDTH / 2 - 80,
      y: VIRTUAL_HEIGHT - 45,
      w: 160,
      h: 28,
      isMoving: false,
      speed: 0,
      dir: 1,
      dipOffset: 0
    });

    let currentY = VIRTUAL_HEIGHT - 125;
    while (currentY > -100) {
      spawnPlatformAndStar(currentY);
      currentY -= 75 + Math.random() * 20;
    }

    bgClouds = [];
    for (let i = 0; i < 6; i++) {
      bgClouds.push({
        x: Math.random() * VIRTUAL_WIDTH,
        y: Math.random() * VIRTUAL_HEIGHT,
        w: 90 + Math.random() * 80,
        speed: 10 + Math.random() * 15,
        alpha: 0.25 + Math.random() * 0.25
      });
    }

    updateHUD();
  }

  function spawnPlatformAndStar(y) {
    const w = 100 + Math.random() * 35;
    const x = Math.max(16, Math.min(VIRTUAL_WIDTH - w - 16, Math.random() * (VIRTUAL_WIDTH - w)));
    const isMoving = Math.random() < 0.28;
    const speed = 35 + Math.random() * 40;

    const plat = {
      x: x,
      y: y,
      w: w,
      h: 24,
      isMoving: isMoving,
      speed: speed,
      dir: Math.random() < 0.5 ? 1 : -1,
      dipOffset: 0
    };
    platforms.push(plat);

    if (Math.random() < 0.7) {
      stars.push({
        x: x + w / 2,
        y: y - 26,
        radius: 13,
        collected: false,
        bobPhase: Math.random() * Math.PI * 2,
        platRef: plat
      });
    }
  }

  function updateHUD() {
    if (hudScoreVal) hudScoreVal.textContent = score;
    if (hudTimerVal) hudTimerVal.textContent = Math.ceil(remainingTime);
  }

  function spawnStarBurst(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.5;
      const speed = 80 + Math.random() * 120;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        alpha: 1.0,
        color: Math.random() < 0.5 ? "#fedf85" : "#ffb300",
        life: 0.45
      });
    }

    scorePops.push({
      x: x,
      y: y - 10,
      text: "+10",
      alpha: 1.0,
      life: 0.6
    });
  }

  function gameLoop(timestamp) {
    if (gameState !== GAME_STATES.PLAYING) return;

    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    update(dt);
    render();

    animFrameId = requestAnimationFrame(gameLoop);
  }

  function update(dt) {
    remainingTime -= dt;
    if (remainingTime <= 0) {
      remainingTime = 0;
      triggerGameOver();
      return;
    }
    updateHUD();

    let inputDir = 0;
    if (keys.left) inputDir -= 1;
    if (keys.right) inputDir += 1;

    if (inputDir !== 0) {
      duck.facing = inputDir;
      duck.vx += inputDir * 2800 * dt;
    } else {
      duck.vx *= 0.84;
    }
    duck.vx = Math.max(-380, Math.min(380, duck.vx));
    duck.x += duck.vx * dt;

    if (duck.x + duck.width < 0) {
      duck.x = VIRTUAL_WIDTH;
    } else if (duck.x > VIRTUAL_WIDTH) {
      duck.x = -duck.width;
    }

    duck.prevY = duck.y;
    duck.vy += 1280 * dt;
    if (duck.vy > 850) duck.vy = 850;
    duck.y += duck.vy * dt;

    if (duck.squash < 1.0) {
      duck.squash += dt * 4.5;
      if (duck.squash > 1.0) duck.squash = 1.0;
    }

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.isMoving) {
        p.x += p.speed * p.dir * dt;
        if (p.x <= 10) {
          p.x = 10;
          p.dir = 1;
        } else if (p.x + p.w >= VIRTUAL_WIDTH - 10) {
          p.x = VIRTUAL_WIDTH - p.w - 10;
          p.dir = -1;
        }
      }
      if (p.dipOffset > 0) {
        p.dipOffset -= dt * 25;
        if (p.dipOffset < 0) p.dipOffset = 0;
      }
    }

    if (duck.vy > 0) {
      const duckFeetY = duck.y + duck.height;
      const prevFeetY = duck.prevY + duck.height;

      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (
          duckFeetY >= p.y + p.dipOffset &&
          prevFeetY <= p.y + p.dipOffset + 24 &&
          duck.x + duck.width * 0.75 >= p.x &&
          duck.x + duck.width * 0.25 <= p.x + p.w
        ) {
          duck.vy = -680;
          duck.y = p.y + p.dipOffset - duck.height;
          duck.squash = 0.74;
          p.dipOffset = 7;
          playBounceSound();
          break;
        }
      }
    }

    const targetScrollY = VIRTUAL_HEIGHT * 0.42;
    if (duck.y < targetScrollY) {
      const scrollDelta = targetScrollY - duck.y;
      duck.y += scrollDelta;
      duck.prevY += scrollDelta;

      for (let i = 0; i < platforms.length; i++) {
        platforms[i].y += scrollDelta;
      }
      for (let i = 0; i < stars.length; i++) {
        stars[i].y += scrollDelta;
      }
      for (let i = 0; i < particles.length; i++) {
        particles[i].y += scrollDelta;
      }
      for (let i = 0; i < scorePops.length; i++) {
        scorePops[i].y += scrollDelta;
      }

      platforms = platforms.filter(p => p.y < VIRTUAL_HEIGHT + 70);
      stars = stars.filter(s => s.y < VIRTUAL_HEIGHT + 70);

      let highestY = VIRTUAL_HEIGHT;
      for (let i = 0; i < platforms.length; i++) {
        if (platforms[i].y < highestY) highestY = platforms[i].y;
      }

      while (highestY > -80) {
        const nextY = highestY - (75 + Math.random() * 20);
        spawnPlatformAndStar(nextY);
        highestY = nextY;
      }
    }

    const duckCenterX = duck.x + duck.width / 2;
    const duckCenterY = duck.y + duck.height / 2;

    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      if (s.collected) continue;

      if (s.platRef && s.platRef.isMoving) {
        s.x = s.platRef.x + s.platRef.w / 2;
      }

      const dx = duckCenterX - s.x;
      const dy = duckCenterY - s.y;
      const dist = Math.hypot(dx, dy);

      if (dist < s.radius + duck.width * 0.4) {
        s.collected = true;
        score += 10;
        starsCount += 1;
        playStarSound();
        spawnStarBurst(s.x, s.y);
        stars.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      pt.alpha = Math.max(0, pt.life / 0.45);
      if (pt.life <= 0) particles.splice(i, 1);
    }

    for (let i = scorePops.length - 1; i >= 0; i--) {
      const sp = scorePops[i];
      sp.y -= 35 * dt;
      sp.life -= dt;
      sp.alpha = Math.max(0, sp.life / 0.6);
      if (sp.life <= 0) scorePops.splice(i, 1);
    }

    for (let i = 0; i < bgClouds.length; i++) {
      const bc = bgClouds[i];
      bc.x += bc.speed * dt;
      if (bc.x > VIRTUAL_WIDTH + 80) bc.x = -bc.w - 80;
    }

    if (duck.y > VIRTUAL_HEIGHT + 30) {
      triggerGameOver();
    }
  }

  function render() {
    ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    skyGrad.addColorStop(0, "#bfe3fc");
    skyGrad.addColorStop(0.5, "#d8ecfe");
    skyGrad.addColorStop(1, "#eff7ff");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    for (let i = 0; i < bgClouds.length; i++) {
      const bc = bgClouds[i];
      drawFluffyCloud(ctx, bc.x, bc.y, bc.w, bc.w * 0.42, bc.alpha);
    }

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      drawCloudPlatform(ctx, p.x, p.y + p.dipOffset, p.w, p.h, p.isMoving);
    }

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      if (!s.collected) {
        drawStar(ctx, s.x, s.y);
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      ctx.save();
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < scorePops.length; i++) {
      const sp = scorePops[i];
      ctx.save();
      ctx.globalAlpha = sp.alpha;
      ctx.font = "bold 16px urca, sans-serif";
      ctx.fillStyle = "#d97706";
      ctx.shadowColor = "#fedf85";
      ctx.shadowBlur = 4;
      ctx.textAlign = "center";
      ctx.fillText(sp.text, sp.x, sp.y);
      ctx.restore();
    }

    if (duck) {
      ctx.save();
      ctx.translate(duck.x + duck.width / 2, duck.y + duck.height);

      if (duck.facing < 0) {
        ctx.scale(-1, 1);
      }

      const sy = duck.squash;
      const sx = 2 - sy;
      ctx.scale(sx, sy);

      ctx.beginPath();
      ctx.ellipse(0, 0, duck.width * 0.35, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(117, 76, 36, 0.12)";
      ctx.fill();

      if (duckImg.complete && duckImg.naturalWidth > 0) {
        ctx.drawImage(duckImg, -duck.width / 2, -duck.height, duck.width, duck.height);
      } else {
        ctx.fillStyle = "#bea4ce";
        ctx.beginPath();
        ctx.ellipse(0, -duck.height / 2, duck.width / 2, duck.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function drawFluffyCloud(context, x, y, width, height, alpha = 0.5) {
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = "#ffffff";
    const r = height / 2;
    context.beginPath();
    context.arc(x + r, y + r, r, 0, Math.PI * 2);
    context.arc(x + width - r, y + r, r, 0, Math.PI * 2);
    context.arc(x + width * 0.38, y + r * 0.6, r * 1.15, 0, Math.PI * 2);
    context.arc(x + width * 0.65, y + r * 0.7, r * 0.95, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawCloudPlatform(context, x, y, width, height, isMoving) {
    context.save();
    context.beginPath();
    context.ellipse(x + width / 2, y + height + 3, width * 0.44, 5, 0, 0, Math.PI * 2);
    context.fillStyle = "rgba(138, 171, 206, 0.35)";
    context.fill();

    context.fillStyle = "#ffffff";

    const r = height * 0.55;
    context.beginPath();
    context.arc(x + r, y + r, r, 0, Math.PI * 2);
    context.arc(x + width - r, y + r, r, 0, Math.PI * 2);
    context.arc(x + width * 0.35, y + r * 0.5, r * 1.15, 0, Math.PI * 2);
    context.arc(x + width * 0.65, y + r * 0.6, r * 1.05, 0, Math.PI * 2);
    context.rect(x + r, y + r * 0.3, width - r * 2, r * 1.2);
    context.fill();

    const grad = context.createLinearGradient(0, y + height * 0.5, 0, y + height);
    grad.addColorStop(0, "rgba(215, 235, 255, 0)");
    grad.addColorStop(1, "rgba(180, 212, 245, 0.45)");
    context.fillStyle = grad;
    context.beginPath();
    context.rect(x + r, y + r, width - r * 2, r);
    context.fill();

    context.restore();
  }

  function drawStar(context, cx, cy) {
    context.save();
    context.translate(cx, cy);

    context.beginPath();
    context.arc(0, 0, 18, 0, Math.PI * 2);
    context.fillStyle = "rgba(254, 223, 133, 0.35)";
    context.fill();

    const spikes = 5;
    const outerRadius = 13;
    const innerRadius = 6;
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    context.beginPath();
    context.moveTo(0, -outerRadius);
    for (let i = 0; i < spikes; i++) {
      let x = Math.cos(rot) * outerRadius;
      let y = Math.sin(rot) * outerRadius;
      context.lineTo(x, y);
      rot += step;

      x = Math.cos(rot) * innerRadius;
      y = Math.sin(rot) * innerRadius;
      context.lineTo(x, y);
      rot += step;
    }
    context.lineTo(0, -outerRadius);
    context.closePath();

    context.fillStyle = "#fedf85";
    context.shadowColor = "#ffb300";
    context.shadowBlur = 8;
    context.fill();

    context.strokeStyle = "#ffffff";
    context.lineWidth = 1.2;
    context.stroke();

    context.restore();
  }

  function openModal() {
    initAudio();
    prevScrollY = window.scrollY;
    modalBackdrop.style.display = "flex";
    setTimeout(() => {
      modalBackdrop.classList.add("is-open");
      modalBackdrop.setAttribute("aria-hidden", "false");
    }, 10);
    document.body.style.overflow = "hidden";

    gameState = GAME_STATES.START;
    startOverlay.style.display = "flex";
    startOverlay.classList.add("is-visible");
    pauseOverlay.style.display = "none";
    pauseOverlay.classList.remove("is-visible");
    gameOverOverlay.style.display = "none";
    gameOverOverlay.classList.remove("is-visible");
    hudBar.style.display = "none";
    mobileTouchBar.style.display = "none";

    resetGame();
    render();
  }

  function closeModal() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    gameState = GAME_STATES.START;
    modalBackdrop.classList.remove("is-open");
    modalBackdrop.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      modalBackdrop.style.display = "none";
    }, 280);
    document.body.style.overflow = "";

    window.scrollTo({ top: prevScrollY, behavior: "instant" });
  }

  function startGame() {
    initAudio();
    resetGame();
    gameState = GAME_STATES.PLAYING;
    lastTime = 0;

    startOverlay.classList.remove("is-visible");
    setTimeout(() => {
      startOverlay.style.display = "none";
    }, 280);

    pauseOverlay.style.display = "none";
    pauseOverlay.classList.remove("is-visible");
    gameOverOverlay.style.display = "none";
    gameOverOverlay.classList.remove("is-visible");

    hudBar.style.display = "flex";
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      mobileTouchBar.style.display = "flex";
    }

    animFrameId = requestAnimationFrame(gameLoop);
  }

  function pauseGame() {
    if (gameState !== GAME_STATES.PLAYING) return;
    gameState = GAME_STATES.PAUSED;
    pauseOverlay.style.display = "flex";
    pauseOverlay.classList.add("is-visible");
  }

  function resumeGame() {
    if (gameState !== GAME_STATES.PAUSED) return;
    gameState = GAME_STATES.PLAYING;
    pauseOverlay.classList.remove("is-visible");
    setTimeout(() => {
      pauseOverlay.style.display = "none";
    }, 280);
    lastTime = 0;
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function triggerGameOver() {
    gameState = GAME_STATES.GAMEOVER;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    if (remainingTime <= 0) {
      playVictorySound();
    } else {
      playGameOverSound();
    }

    hudBar.style.display = "none";
    mobileTouchBar.style.display = "none";

    if (goScoreText) goScoreText.textContent = score;
    if (goStarsText) goStarsText.textContent = starsCount;
    if (statFinalScore) statFinalScore.textContent = score;
    if (statFinalStars) statFinalStars.textContent = starsCount;

    gameOverOverlay.style.display = "flex";
    gameOverOverlay.classList.add("is-visible");
  }

  gameCard.addEventListener("click", openModal);
  gameCard.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal();
    }
  });

  modalCloseBtn.addEventListener("click", closeModal);
  btnBackToJourney.addEventListener("click", closeModal);

  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) {
      closeModal();
    }
  });

  btnStartHopping.addEventListener("click", startGame);
  btnPlayAgain.addEventListener("click", startGame);
  btnResumeGame.addEventListener("click", resumeGame);
  btnRestartGame.addEventListener("click", startGame);

  btnPause.addEventListener("click", pauseGame);
  btnMute.addEventListener("click", () => {
    initAudio();
    isSoundMuted = !isSoundMuted;
    btnMute.textContent = isSoundMuted ? "🔇" : "🔊";
  });

  window.addEventListener("keydown", (e) => {
    if (modalBackdrop.classList.contains("is-open")) {
      if (e.key === "Escape") {
        closeModal();
        return;
      }
      if (e.key === "p" || e.key === "P") {
        if (gameState === GAME_STATES.PLAYING) pauseGame();
        else if (gameState === GAME_STATES.PAUSED) resumeGame();
      }
    }

    if (gameState === GAME_STATES.PLAYING) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keys.left = true;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keys.right = true;
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      keys.left = false;
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      keys.right = false;
    }
  });

  function bindTouchButton(btn, dir) {
    if (!btn) return;
    const startHandler = (e) => {
      e.preventDefault();
      if (dir === "left") keys.left = true;
      if (dir === "right") keys.right = true;
    };
    const endHandler = (e) => {
      e.preventDefault();
      if (dir === "left") keys.left = false;
      if (dir === "right") keys.right = false;
    };

    btn.addEventListener("touchstart", startHandler, { passive: false });
    btn.addEventListener("touchend", endHandler, { passive: false });
    btn.addEventListener("mousedown", startHandler);
    btn.addEventListener("mouseup", endHandler);
    btn.addEventListener("mouseleave", endHandler);
  }

  bindTouchButton(btnTouchLeft, "left");
  bindTouchButton(btnTouchRight, "right");
}


