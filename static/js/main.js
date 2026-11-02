// Dashboard: collects model parameters, posts them to /api/price,
// and renders the returned prices, greeks and lattice figures.

(function () {
    "use strict";

    const API_URL = "/api/price";

    const drawer = document.getElementById("parameters-drawer");
    const drawerPanel = document.getElementById("parameters-panel");
    const drawerToggle = document.getElementById("drawer-toggle");

    // Pause (ms) before the drawer slides out on page load.
    const DRAWER_OPEN_DELAY = 200;

    const form = document.getElementById("pricing-form");
    const submitButton = document.getElementById("submit-button");
    const status = document.getElementById("form-status");
    const priceOutput = document.getElementById("option-price");
    const closedPriceOutput = document.getElementById("closed-option-price");
    const pruneNotice = document.getElementById("prune-notice");
    const pruneNoticeText = document.getElementById("prune-notice-text");
    const blackScholesPriceOutput = document.getElementById("black-scholes-price");

    const greekOutputs = {
        delta: document.getElementById("greek-delta"),
        gamma: document.getElementById("greek-gamma"),
        theta: document.getElementById("greek-theta"),
        vega: document.getElementById("greek-vega"),
        rho: document.getElementById("greek-rho"),
    };

    const figureOutputs = {
        price: document.getElementById("figure-price"),
        delta: document.getElementById("figure-delta"),
        leverage: document.getElementById("figure-leverage"),
    };

    const FIGURE_CONFIG = { responsive: true, displayModeBar: false };

    // Below this width (px) figure titles no longer fit on one line.
    const NARROW_FIGURE_WIDTH = 520;
    const TITLE_LINE_HEIGHT = 20;

    // Most lattice layers the figures draw. Mirrors BOP_DEFAULT_MAX_DRAW_DEPTH
    // in app.py, so keep the two in step.
    const MAX_DRAW_DEPTH = 50;

    // Field name -> parser. Names match the keys the engine reads.
    const FIELDS = {
        spot: parseFloat,
        strike: parseFloat,
        volatility: parseFloat,
        risk_free_rate: parseFloat,
        time_to_expiry: parseFloat,
        num_steps: (value) => parseInt(value, 10),
    };

    // Dropdowns, whose values are sent as they are.
    const SELECT_FIELDS = ["option_type", "option_exercise"];

    function isDrawerOpen() {
        return drawer.classList.contains("is-open");
    }

    function setDrawerOpen(open) {
        drawer.classList.toggle("is-open", open);
        drawerToggle.setAttribute("aria-expanded", String(open));
        // Keeps the hidden form out of the tab order and from screen readers.
        drawerPanel.inert = !open;
    }

    function hideDrawer() {
        // Focus must leave the panel before it becomes inert.
        drawerToggle.focus();
        setDrawerOpen(false);
    }

    function setStatus(message, isError) {
        status.textContent = message;
        status.classList.toggle("is-error", Boolean(isError));
    }

    function readParameters() {
        const params = {};
        const invalid = [];

        for (const [name, parse] of Object.entries(FIELDS)) {
            const input = form.elements[name];
            const value = parse(input.value);
            const ok = input.value.trim() !== "" && Number.isFinite(value);

            input.setAttribute("aria-invalid", ok ? "false" : "true");
            if (ok) {
                params[name] = value;
            } else {
                invalid.push(input.labels[0].textContent);
            }
        }

        for (const name of SELECT_FIELDS) {
            params[name] = form.elements[name].value;
        }

        return { params, invalid };
    }

    // "—" is reserved for "not yet priced", so empty values returned by
    // the server are shown explicitly rather than looking like no update.
    const MISSING_TEXT = "(not in response)";

    function formatValue(value) {
        if (value === undefined) {
            return MISSING_TEXT;
        }
        if (typeof value === "number" && Number.isFinite(value)) {
            return value.toFixed(4);
        }
        return String(value);
    }

    // Returns the names of any outputs that came back null or missing.
    function render(result) {
        const empty = [];
        const price = result.binomial_option_price;

        priceOutput.textContent = formatValue(price);
        if (price === null || price === undefined) {
            empty.push("binomial_option_price");
        }

        const closedPrice = result.binomial_closed_option_price;
        closedPriceOutput.textContent = formatValue(closedPrice);
        if (closedPrice === null || closedPrice === undefined) {
            empty.push("binomial_closed_option_price");
        }

        const blackScholes = result.black_scholes || {};
        blackScholesPriceOutput.textContent = formatValue(blackScholes.price);
        if (blackScholes.price === null || blackScholes.price === undefined) {
            empty.push("black_scholes.price");
        }

        // Greeks show their own value in place, so an empty one isn't flagged.
        const greeks = blackScholes.greeks || {};
        for (const [key, element] of Object.entries(greekOutputs)) {
            element.textContent = formatValue(greeks[key]);
        }

        const figures = (result.figures && result.figures.lattices) || {};
        for (const [key, element] of Object.entries(figureOutputs)) {
            if (figures[key]) {
                renderFigure(element, figures[key]);
            } else {
                Plotly.purge(element);
                empty.push("figures.lattices." + key);
            }
        }

        return empty;
    }

    function updatePruneNotice(numSteps) {
        // A lattice has one more layer than it has steps.
        const layers = numSteps + 1;
        const pruned = layers > MAX_DRAW_DEPTH;

        pruneNotice.hidden = !pruned;
        if (pruned) {
            pruneNoticeText.textContent =
                `Only the first ${MAX_DRAW_DEPTH} of ${layers} layers (${numSteps} steps) are drawn.`;
        }
    }

    // Plotly doesn't wrap titles, so split long ones at the middle word.
    function wrapTitle(layout) {
        const text = layout.title.text;
        const middle = text.indexOf(" ", Math.floor(text.length / 2));

        if (middle !== -1) {
            layout.title.text = `${text.slice(0, middle)}<br>${text.slice(middle + 1)}`;
            layout.margin.t += TITLE_LINE_HEIGHT;
        }
    }

    function renderFigure(element, figure) {
        if (element.clientWidth < NARROW_FIGURE_WIDTH) {
            wrapTitle(figure.layout);
        }
        Plotly.react(element, figure.data, figure.layout, FIGURE_CONFIG);
    }

    async function submit(event) {
        event.preventDefault();

        const { params, invalid } = readParameters();
        if (invalid.length > 0) {
            setStatus("Please enter a number for: " + invalid.join(", "), true);
            return;
        }

        submitButton.disabled = true;
        setStatus("Pricing…", false);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params),
            });

            // Read as text first so a non-JSON error page can still be reported.
            const body = await response.text();
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status} ${response.statusText}`);
            }

            let result;
            try {
                result = JSON.parse(body);
            } catch (parseError) {
                throw new Error("Response was not valid JSON");
            }

            const empty = render(result);
            updatePruneNotice(params.num_steps);
            const time = new Date().toLocaleTimeString();
            if (empty.length > 0) {
                setStatus(`Updated ${time}, but the response had no value for: ${empty.join(", ")}`, true);
            } else {
                setStatus("Updated " + time, false);
                if (isDrawerOpen()) {
                    hideDrawer();
                }
            }
        } catch (error) {
            setStatus(error.message, true);
        } finally {
            submitButton.disabled = false;
        }
    }

    form.addEventListener("submit", submit);

    drawerToggle.addEventListener("click", () => setDrawerOpen(!isDrawerOpen()));

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isDrawerOpen()) {
            hideDrawer();
        }
    });

    // The closed state has to paint first for the slide to be seen.
    setTimeout(() => setDrawerOpen(true), DRAWER_OPEN_DELAY);
})();
