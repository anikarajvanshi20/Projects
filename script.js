document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // -------------------------------------------------------
  // 1. INTERACTIVE NETWORK BACKGROUND
  // -------------------------------------------------------

  const canvas = document.getElementById("network-canvas");

  if (canvas) {
    const ctx = canvas.getContext("2d");

    if (ctx) {
      const hero = canvas.closest(".hero");

      let width = 0;
      let height = 0;
      let particles = [];
      let animationFrame = null;

      const mouse = { x: -1000, y: -1000 };

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

      const coarsePointer = window.matchMedia(
        "(pointer: coarse)"
      );

      const connectionDistance = 125;
      const mouseDistance = 160;

      function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        width = rect.width;
        height = rect.height;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const particleCount = Math.min(
          95,
          Math.max(24, Math.floor((width * height) / 8500))
        );

        particles = Array.from(
          { length: particleCount },
          () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.32,
            vy: (Math.random() - 0.5) * 0.32,
            radius: Math.random() * 1.3 + 0.6
          })
        );

        drawNetwork();
      }

      function drawNetwork() {
        ctx.clearRect(0, 0, width, height);

        // Draw the particles and their connections.
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];

          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];

            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distance = Math.hypot(dx, dy);

            if (distance < connectionDistance) {
              const opacity =
                (1 - distance / connectionDistance) * 0.2;

              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle =
                `rgba(137, 82, 94, ${opacity})`;
              ctx.lineWidth = 0.7;
              ctx.stroke();
            }
          }

          // Connect nearby particles to the pointer on desktop.
          if (!coarsePointer.matches) {
            const distance = Math.hypot(
              a.x - mouse.x,
              a.y - mouse.y
            );

            if (distance < mouseDistance) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle =
                `rgba(137, 82, 94, ${
                  (1 - distance / mouseDistance) * 0.28
                })`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }

          ctx.beginPath();
          ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(137, 82, 94, 0.55)";
          ctx.fill();
        }
      }

      function animate() {
        if (document.hidden) {
          animationFrame = null;
          return;
        }

        if (!reducedMotion.matches) {
          particles.forEach((particle) => {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < 0 || particle.x > width) {
              particle.vx *= -1;
            }

            if (particle.y < 0 || particle.y > height) {
              particle.vy *= -1;
            }

            particle.x = Math.max(
              0,
              Math.min(width, particle.x)
            );

            particle.y = Math.max(
              0,
              Math.min(height, particle.y)
            );
          });
        }

        drawNetwork();

        if (!reducedMotion.matches) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          animationFrame = null;
        }
      }

      function startAnimation() {
        if (animationFrame !== null || document.hidden) {
          return;
        }

        animationFrame = requestAnimationFrame(animate);
      }

      function stopAnimation() {
        if (animationFrame !== null) {
          cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
      }

      if (hero) {
        hero.addEventListener("pointermove", (event) => {
          const rect = canvas.getBoundingClientRect();

          mouse.x = event.clientX - rect.left;
          mouse.y = event.clientY - rect.top;
        });

        hero.addEventListener("pointerleave", () => {
          mouse.x = -1000;
          mouse.y = -1000;
        });
      }

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          stopAnimation();
        } else {
          drawNetwork();
          startAnimation();
        }
      });

      window.addEventListener("resize", resizeCanvas);

      if (typeof reducedMotion.addEventListener === "function") {
        reducedMotion.addEventListener("change", () => {
          stopAnimation();
          drawNetwork();
          startAnimation();
        });
      }

      resizeCanvas();
      startAnimation();
    }
  }

  // -------------------------------------------------------
  // 2. PROJECT FILTERS
  // Uses .filter-chip and .project-card from your HTML.
  // -------------------------------------------------------

  const filterButtons = document.querySelectorAll(
    ".filter-chip[data-filter]"
  );

  const projectCards = document.querySelectorAll(
    ".project-card[data-category]"
  );

  const filterStatus = document.getElementById("filter-status");

  if (filterButtons.length && projectCards.length) {
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const selectedFilter = button.dataset.filter;

        // Update the selected filter.
        filterButtons.forEach((filterButton) => {
          const isActive = filterButton === button;

          filterButton.classList.toggle("is-active", isActive);
          filterButton.setAttribute(
            "aria-pressed",
            String(isActive)
          );
        });

        // Show only projects in the selected category.
        let visibleCount = 0;

        projectCards.forEach((card) => {
          const categories = (
            card.dataset.category || ""
          )
            .toLowerCase()
            .split(/\s+/);

          const matches =
            selectedFilter === "all" ||
            categories.includes(selectedFilter.toLowerCase());

          card.hidden = !matches;

          if (matches) {
            visibleCount++;
          }
        });

        // Announce the result accessibly.
        if (filterStatus) {
          filterStatus.textContent =
            `${visibleCount} ${
              visibleCount === 1 ? "project" : "projects"
            } shown`;
        }
      });
    });
  }

  // -------------------------------------------------------
  // 3. CURRENT YEAR IN FOOTER
  // Matches <span id="year">2026</span>.
  // -------------------------------------------------------

  const yearElement = document.getElementById("year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // -------------------------------------------------------
  // 4. SMOOTH IN-PAGE NAVIGATION
  // -------------------------------------------------------

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const target = document.querySelector(targetId);

      if (!target) {
        return;
      }

      event.preventDefault();

      const shouldReduceMotion = reducedMotionPreference();

      target.scrollIntoView({
        behavior: shouldReduceMotion ? "auto" : "smooth",
        block: "start"
      });

      // Keep the URL in sync without jumping to the target.
      history.replaceState(null, "", targetId);
    });
  });

  function reducedMotionPreference() {
    return window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }
});
