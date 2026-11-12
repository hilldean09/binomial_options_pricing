// Dashboard: collects model parameters, posts them to /api/price,
// and renders the returned prices, greeks and figures.

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

    const latticeFigureOutputs = {
        price: document.getElementById("figure-price"),
        delta: document.getElementById("figure-delta"),
        leverage: document.getElementById("figure-leverage"),
    };
    const convergenceFigureOutput = document.getElementById("figure-convergence");
    const latticeDisclosure = document.getElementById("lattice-disclosure");

    // Plotly can't size a plot that isn't displayed, so figures for a
    // collapsed section wait here until it opens. Keyed by figure element.
    const deferredFigures = new Map();

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

    const dividendSwitch = document.getElementById("do_dividends");
    const dividendFields = document.getElementById("dividend-fields");
    const dividendYieldInput = document.getElementById("dividend_yield");
    const dateList = document.getElementById("ex-dividend-dates");
    const dateTemplate = document.getElementById("ex-dividend-date-template");
    const addDateButton = document.getElementById("add-ex-dividend-date");

    // Ex-dividend dates (months from now) listed when the page loads.
    const DEFAULT_EX_DIVIDEND_DATES = [6];

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

        const outOfRange = readDividends(params, invalid);

        return { params, invalid, outOfRange };
    }

    // Marks an input as valid or not, and returns whether it was valid.
    function check(input, ok) {
        input.setAttribute("aria-invalid", ok ? "false" : "true");
        return ok;
    }

    // Adds the dividend keys to params. Unparseable inputs go on invalid;
    // returns descriptions of any that parsed but are out of range.
    function readDividends(params, invalid) {
        const outOfRange = [];

        params.do_dividends = dividendSwitch.checked;
        if (!dividendSwitch.checked) {
            return outOfRange;
        }

        const isNumber = (input) => input.value.trim() !== "" && Number.isFinite(parseFloat(input.value));

        const dividendYield = parseFloat(dividendYieldInput.value);
        if (!isNumber(dividendYieldInput)) {
            check(dividendYieldInput, false);
            invalid.push("Dividend yield");
        } else if (check(dividendYieldInput, dividendYield >= 0 && dividendYield < 1)) {
            params.dividend_yield = dividendYield;
        } else {
            outOfRange.push("Dividend yield (from 0 up to, but not including, 1)");
        }

        // Dates past expiry can't be checked until expiry itself is a number.
        const expiry = params.time_to_expiry;
        const dates = [];
        dateInputs().forEach((input, index) => {
            const name = `Ex-dividend date ${index + 1}`;
            const date = parseFloat(input.value);

            if (!isNumber(input)) {
                check(input, false);
                invalid.push(name);
            } else if (check(input, date >= 0 && (expiry === undefined || date <= expiry))) {
                dates.push(date);
            } else {
                outOfRange.push(`${name} (0 to ${expiry ?? "expiry"} months)`);
            }
        });
        params.ex_dividend_date_list = dates;

        return outOfRange;
    }

    function dateInputs() {
        return Array.from(dateList.querySelectorAll("input"));
    }

    // Keeps each row's accessible names in step with its position.
    function numberDateRows() {
        dateList.querySelectorAll(".date-row").forEach((row, index) => {
            row.querySelector("input").setAttribute("aria-label", `Ex-dividend date ${index + 1}, in months`);
            row.querySelector("button").setAttribute("aria-label", `Remove ex-dividend date ${index + 1}`);
        });
    }

    function addDateRow(value) {
        const row = dateTemplate.content.firstElementChild.cloneNode(true);
        const input = row.querySelector("input");
        input.value = value ?? "";

        row.querySelector("button").addEventListener("click", () => removeDateRow(row));
        dateList.append(row);
        numberDateRows();
        return input;
    }

    // Focus moves to the row that takes this one's place, or the one
    // before it, or the add button once the list is empty.
    function removeDateRow(row) {
        const next = row.nextElementSibling || row.previousElementSibling;
        row.remove();
        numberDateRows();
        (next ? next.querySelector("input") : addDateButton).focus();
    }

    function syncDividendFields() {
        const on = dividendSwitch.checked;
        dividendFields.hidden = !on;
        dividendFields.disabled = !on;
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

        const figures = result.figures || {};
        const lattices = figures.lattices || {};
        for (const [key, element] of Object.entries(latticeFigureOutputs)) {
            if (!renderFigure(element, lattices[key])) {
                empty.push("figures.lattices." + key);
            }
        }

        if (!renderFigure(convergenceFigureOutput, figures.convergence)) {
            empty.push("figures.convergence");
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

    // A legend sits just above the plot, where a wrapped title's second line
    // would land, so give it its own line and pin the title to the top.
    function makeRoomForLegend(figure) {
        if (!figure.data.some((trace) => trace.showlegend)) {
            return;
        }
        figure.layout.margin.t += TITLE_LINE_HEIGHT;
        Object.assign(figure.layout.title, { yref: "container", y: 1, yanchor: "top", pad: { t: 12 } });
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

    // Draws the figure, or clears the panel and returns false if there isn't one.
    function renderFigure(element, figure) {
        deferredFigures.delete(element);
        if (!figure) {
            Plotly.purge(element);
            return false;
        }
        if (element.closest("details:not([open])")) {
            deferredFigures.set(element, figure);
            return true;
        }
        if (element.clientWidth < NARROW_FIGURE_WIDTH) {
            wrapTitle(figure.layout);
            makeRoomForLegend(figure);
        }
        Plotly.react(element, figure.data, figure.layout, FIGURE_CONFIG);
        return true;
    }

    async function submit(event) {
        event.preventDefault();

        const { params, invalid, outOfRange } = readParameters();
        if (invalid.length > 0) {
            setStatus("Please enter a number for: " + invalid.join(", "), true);
            return;
        }
        if (outOfRange.length > 0) {
            setStatus("Out of range: " + outOfRange.join(", "), true);
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

    dividendSwitch.addEventListener("change", syncDividendFields);
    addDateButton.addEventListener("click", () => addDateRow().focus());
    DEFAULT_EX_DIVIDEND_DATES.forEach(addDateRow);
    syncDividendFields();

    drawerToggle.addEventListener("click", () => setDrawerOpen(!isDrawerOpen()));

    latticeDisclosure.addEventListener("toggle", () => {
        if (!latticeDisclosure.open) {
            return;
        }
        for (const element of latticeDisclosure.querySelectorAll(".figure")) {
            if (deferredFigures.has(element)) {
                renderFigure(element, deferredFigures.get(element));
            } else if (element.classList.contains("js-plotly-plot")) {
                // The window may have been resized while these were hidden.
                Plotly.Plots.resize(element);
            }
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isDrawerOpen()) {
            hideDrawer();
        }
    });

    // The closed state has to paint first for the slide to be seen.
    setTimeout(() => setDrawerOpen(true), DRAWER_OPEN_DELAY);
})();
