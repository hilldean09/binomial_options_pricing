// Loads the explanatory texts in texts/ (served through the static/texts
// link) into the page: the subtitle, and info popovers beside the greeks.

(function () {
    "use strict";

    const TEXTS_URL = document.currentScript.dataset.textsUrl;

    const subtitle = document.getElementById("subtitle");
    const greekValues = document.querySelectorAll('dd[id^="greek-"]');

    // Gap (px) between an info button and its popover, and between the
    // popover and the edge of the window.
    const POPOVER_GAP = 6;
    const POPOVER_MARGIN = 16;

    // $$display$$ or $inline$ maths. "\$" is a literal dollar sign, so it
    // neither opens nor closes inline maths.
    const MATH = /\$\$([\s\S]+?)\$\$|(?<!\\)\$((?:\\[\s\S]|[^\\$])+?)\$/g;

    let openInfo = null;

    async function fetchText(name) {
        const response = await fetch(TEXTS_URL + name);
        if (!response.ok) {
            throw new Error(`Couldn't load ${name}: ${response.status} ${response.statusText}`);
        }
        return response.text();
    }

    // Maths is set aside before the Markdown pass so its underscores and
    // backslashes aren't read as Markdown, then put back as KaTeX.
    function renderMarkdown(source) {
        const maths = [];
        const text = source.replace(MATH, (match, display, inline) => {
            maths.push(katex.renderToString(display ?? inline, {
                displayMode: display !== undefined,
                throwOnError: false,
            }));
            return `@@MATH${maths.length - 1}@@`;
        });

        return marked.parse(text).replace(/@@MATH(\d+)@@/g, (match, index) => maths[index]);
    }

    // Splits a Markdown file into { heading, body } sections keyed by the
    // lower-cased text of each "# " heading.
    function splitSections(source) {
        const sections = new Map();
        let current = null;

        for (const line of source.split("\n")) {
            const heading = line.match(/^#\s+(.*\S)\s*$/);
            if (heading) {
                current = { heading: heading[1], body: [] };
                sections.set(current.heading.toLowerCase(), current);
            } else if (current) {
                current.body.push(line);
            }
        }

        for (const section of sections.values()) {
            section.body = section.body.join("\n").trim();
        }
        return sections;
    }

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

    async function loadSubtitle() {
        subtitle.textContent = (await fetchText("under_title.txt")).trim();
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

    loadSubtitle().catch((error) => console.error(error));
    loadGreekInfo().catch((error) => console.error(error));
})();
