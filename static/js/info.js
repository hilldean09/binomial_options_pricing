// Pricer page: info buttons beside the greeks that open popovers with
// their explanations from texts/black_scholes_greeks.md.

(function () {
    "use strict";

    const { fetchText, renderMarkdown, splitSections } = BOP.texts;

    const greekValues = document.querySelectorAll('dd[id^="greek-"]');

    // Gap (px) between an info button and its popover, and between the
    // popover and the edge of the window.
    const POPOVER_GAP = 6;
    const POPOVER_MARGIN = 16;

    let openInfo = null;

    function placeOpenInfo() {
        if (!openInfo) {
            return;
        }
        const { button, popover } = openInfo;
        const anchor = button.getBoundingClientRect();
        const viewWidth = document.documentElement.clientWidth;
        const viewHeight = document.documentElement.clientHeight;

        const left = Math.max(POPOVER_MARGIN,
            Math.min(anchor.left, viewWidth - popover.offsetWidth - POPOVER_MARGIN));

        // Below the button, unless it only fits above.
        const below = anchor.bottom + POPOVER_GAP;
        const above = anchor.top - POPOVER_GAP - popover.offsetHeight;
        const fitsBelow = below + popover.offsetHeight <= viewHeight - POPOVER_MARGIN;
        const top = fitsBelow || above < POPOVER_MARGIN ? below : above;

        popover.style.left = `${left}px`;
        popover.style.top = `${top}px`;
    }

    function addInfo(label, section) {
        const id = "info-" + section.heading.toLowerCase().replace(/\W+/g, "-");

        const popover = document.createElement("div");
        popover.id = id;
        popover.className = "tile info-popover";
        popover.popover = "auto";
        popover.setAttribute("aria-labelledby", id + "-heading");
        popover.innerHTML = `<div class="info-popover-body"><h3 id="${id}-heading"></h3>${renderMarkdown(section.body)}</div>`;
        popover.querySelector("h3").textContent = section.heading;
        document.body.append(popover);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "info-button";
        button.textContent = "i";
        button.setAttribute("aria-label", "About " + section.heading.toLowerCase());
        button.popoverTargetElement = popover;
        label.append(button);

        popover.addEventListener("toggle", (event) => {
            const open = event.newState === "open";
            button.classList.toggle("is-active", open);
            if (open) {
                openInfo = { button, popover };
                placeOpenInfo();
            } else if (openInfo && openInfo.popover === popover) {
                openInfo = null;
            }
        });
    }

    // Greeks without a section in the file get no info button.
    async function loadGreekInfo() {
        const sections = splitSections(await fetchText("black_scholes_greeks.md"));

        for (const value of greekValues) {
            const label = value.previousElementSibling;
            const section = sections.get(label.textContent.trim().toLowerCase());
            if (section) {
                addInfo(label, section);
            }
        }
    }

    window.addEventListener("resize", placeOpenInfo);
    window.addEventListener("scroll", placeOpenInfo, { passive: true });

    loadGreekInfo().catch((error) => console.error(error));
})();
