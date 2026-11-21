// Learn page: renders the Markdown sections listed in texts/learn.json,
// builds the contents list from their headings, and puts interactive
// figures where a section has a <!-- figure: name --> comment.

(function () {
    "use strict";

    const { fetchText, renderMarkdown } = BOP.texts;

    const MANIFEST = "learn.json";

    const sectionsElement = document.getElementById("learn-sections");
    const loadStatus = document.getElementById("learn-status");
    const contentsList = document.getElementById("learn-contents-list");

    // A heading counts as the current one once its top passes this far (px)
    // down the window.
    const CURRENT_HEADING_OFFSET = 120;

    // Figures a section can place, by the name in its comment.
    const FIGURES = {
        "payoff-function": createPayoffFunctionFigure,
    };

    const FIGURE_COMMENT = /^\s*figure:\s*([\w-]+)\s*$/;

    const usedIds = new Set();
    let figureCount = 0;

    function uniqueId(text) {
        const base = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
        let id = base;
        for (let n = 2; usedIds.has(id) || document.getElementById(id); n++) {
            id = `${base}-${n}`;
        }
        usedIds.add(id);
        return id;
    }

    // A heading's text as it reads on screen. Rendered maths also holds
    // its TeX source and a MathML copy, which textContent would include.
    function visibleText(heading) {
        const copy = heading.cloneNode(true);
        for (const math of copy.querySelectorAll(".katex")) {
            math.replaceWith(math.querySelector(".katex-html")?.textContent ?? "");
        }
        return copy.textContent;
    }

    // Copies the heading's rendered content, so any maths in it shows. The
    // copy is wrapped so it can be laid out as one piece beside the link's
    // decoration (leader dots and a number).
    function contentsItem(heading) {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = "#" + heading.id;
        const title = document.createElement("span");
        title.className = "contents-title";
        title.append(...Array.from(heading.childNodes, (node) => node.cloneNode(true)));
        link.append(title);
        item.append(link);
        return item;
    }

    // Each file's "#" becomes the section's <h2>, and its "##" headings
    // are listed beneath it in the contents.
    function addSection(source) {
        const section = document.createElement("section");
        section.className = "tile learn-section prose";
        section.innerHTML = renderMarkdown(source, { headingOffset: 1 });

        let item = null;
        let sublist = null;
        for (const heading of section.querySelectorAll("h2, h3")) {
            heading.id = uniqueId(visibleText(heading));
            if (heading.tagName === "H2") {
                item = contentsItem(heading);
                sublist = null;
                contentsList.append(item);
                section.setAttribute("aria-labelledby", heading.id);
            } else if (item) {
                if (!sublist) {
                    sublist = document.createElement("ol");
                    item.append(sublist);
                }
                sublist.append(contentsItem(heading));
            }
        }

        sectionsElement.append(section);
        placeFigures(section);
    }

    function addFailedSection(name, error) {
        console.error(error);
        const section = document.createElement("section");
        section.className = "tile learn-section";
        const message = document.createElement("p");
        message.className = "status is-error";
        message.textContent = `Couldn't load ${name}: ${error.message}`;
        section.append(message);
        sectionsElement.append(section);
    }

    function placeFigures(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
        const comments = [];
        while (walker.nextNode()) {
            comments.push(walker.currentNode);
        }

        for (const comment of comments) {
            const match = comment.data.match(FIGURE_COMMENT);
            if (!match) {
                continue;
            }
            const create = FIGURES[match[1]];
            if (create) {
                create(comment);
            } else {
                const message = document.createElement("p");
                message.className = "status is-error";
                message.textContent = `Unknown figure: ${match[1]}`;
                comment.replaceWith(message);
            }
        }
    }

    // ----- Payoff function figure -----

    const PAYOFF_URL = "/api/payoff-function";

    // Used when nothing has been priced on the Pricer page yet.
    const PAYOFF_DEFAULTS = { option_type: "call", strike: 100, option_price: 10 };

    // Pause (ms) after typing stops before the figure is redrawn.
    const PAYOFF_UPDATE_DELAY = 300;

    // Replaces the placeholder with a card holding the controls and figure.
    function createPayoffFunctionFigure(placeholder) {
        const template = document.getElementById("payoff-function-template");
        const card = template.content.firstElementChild.cloneNode(true);
        const prefix = `payoff-function-${++figureCount}`;

        const fields = {};
        for (const field of card.querySelectorAll("[data-field]")) {
            field.id = `${prefix}-${field.dataset.field}`;
            fields[field.dataset.field] = field;
        }
        for (const label of card.querySelectorAll("[data-for]")) {
            label.htmlFor = `${prefix}-${label.dataset.for}`;
        }

        const source = card.querySelector(".figure-source");
        const status = card.querySelector(".status");
        const figure = card.querySelector(".figure");

        const last = BOP.lastPricing.load();
        const start = last ? {
            option_type: last.option_type,
            strike: last.strike,
            option_price: Math.round(last.option_price * 100) / 100,
        } : PAYOFF_DEFAULTS;

        fields.option_type.value = start.option_type;
        fields.strike.value = start.strike;
        fields.option_price.value = start.option_price;

        if (last) {
            const when = new Date(last.pricedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
            source.textContent = `Started from your last pricing (${when}), with its CRR price as the premium.`;
            source.hidden = false;
        }

        function setStatus(message, isError) {
            status.textContent = message;
            status.classList.toggle("is-error", Boolean(isError));
        }

        // Returns the request, or null after flagging what's wrong.
        function readInputs() {
            const strike = parseFloat(fields.strike.value);
            const price = parseFloat(fields.option_price.value);
            const strikeOk = Number.isFinite(strike) && strike > 0;
            const priceOk = Number.isFinite(price) && price >= 0;

            fields.strike.setAttribute("aria-invalid", strikeOk ? "false" : "true");
            fields.option_price.setAttribute("aria-invalid", priceOk ? "false" : "true");

            const problems = [];
            if (!strikeOk) {
                problems.push("strike price must be a number above 0");
            }
            if (!priceOk) {
                problems.push("premium must be a number, 0 or above");
            }
            if (problems.length > 0) {
                setStatus("The " + problems.join(", and the "), true);
                return null;
            }
            return { option_type: fields.option_type.value, strike, option_price: price };
        }

        // Only the newest request's response is drawn.
        let latest = 0;

        async function update() {
            const inputs = readInputs();
            if (!inputs) {
                return;
            }
            const request = ++latest;
            setStatus("Updating…", false);

            try {
                const response = await fetch(PAYOFF_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(inputs),
                });
                const body = await response.text();
                if (request !== latest) {
                    return;
                }
                if (!response.ok) {
                    throw new Error(`Server responded with ${response.status} ${response.statusText}`);
                }

                let result;
                try {
                    result = JSON.parse(body);
                } catch (parseError) {
                    throw new Error("Response was not valid JSON");
                }

                const drawn = BOP.figures.draw(figure, result.figures?.payoff_and_profit_function);
                setStatus(drawn ? "" : "The response had no payoff figure", !drawn);
            } catch (error) {
                if (request === latest) {
                    setStatus(error.message, true);
                }
            }
        }

        let timer = null;
        function scheduleUpdate() {
            clearTimeout(timer);
            timer = setTimeout(update, PAYOFF_UPDATE_DELAY);
        }

        fields.option_type.addEventListener("change", update);
        fields.strike.addEventListener("input", scheduleUpdate);
        fields.option_price.addEventListener("input", scheduleUpdate);

        placeholder.replaceWith(card);
        update();
    }

    // ----- Contents highlighting -----

    function updateCurrentLink() {
        const headings = sectionsElement.querySelectorAll("h2[id], h3[id]");
        let current = null;
        for (const heading of headings) {
            if (heading.getBoundingClientRect().top > CURRENT_HEADING_OFFSET) {
                break;
            }
            current = heading;
        }
        // Before the first heading is reached, the first one is current.
        current = current || headings[0];

        for (const link of contentsList.querySelectorAll("a")) {
            if (current && link.hash === "#" + current.id) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        }
    }

    let frameRequested = false;
    function onScroll() {
        if (!frameRequested) {
            frameRequested = true;
            requestAnimationFrame(() => {
                frameRequested = false;
                updateCurrentLink();
            });
        }
    }

    // ----- Loading -----

    async function loadSections() {
        const manifest = JSON.parse(await fetchText(MANIFEST));
        const names = manifest.sections || [];
        const sources = await Promise.allSettled(names.map(fetchText));

        loadStatus.remove();
        sources.forEach((source, index) => {
            if (source.status === "fulfilled") {
                addSection(source.value);
            } else {
                addFailedSection(names[index], source.reason);
            }
        });

        // The target of a link like /learn#call-options only exists now.
        if (location.hash) {
            document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
        }

        updateCurrentLink();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
    }

    loadSections().catch((error) => {
        console.error(error);
        loadStatus.textContent = `Couldn't load the sections: ${error.message}`;
        loadStatus.classList.add("is-error");
    });
})();
