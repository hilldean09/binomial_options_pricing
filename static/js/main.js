// Dashboard: collects model parameters, posts them to /api/price,
// and renders the returned option price and lattice figures.

(function () {
    "use strict";

    const API_URL = "/api/price";

    const form = document.getElementById("pricing-form");
    const submitButton = document.getElementById("submit-button");
    const status = document.getElementById("form-status");
    const priceOutput = document.getElementById("option-price");

    const figureOutputs = {
        price: document.getElementById("figure-price"),
        delta: document.getElementById("figure-delta"),
        leverage: document.getElementById("figure-leverage"),
    };

    const FIGURE_CONFIG = { responsive: true, displayModeBar: false };

    // Below this width (px) figure titles no longer fit on one line.
    const NARROW_FIGURE_WIDTH = 520;
    const TITLE_LINE_HEIGHT = 20;

    // Field name -> parser. Names match the keys the engine reads.
    const FIELDS = {
        spot: parseFloat,
        strike: parseFloat,
        volatility: parseFloat,
        risk_free_rate: parseFloat,
        time_to_expiry: parseFloat,
        num_layers: (value) => parseInt(value, 10),
    };

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

        return { params, invalid };
    }

    // "—" is reserved for "not yet priced", so empty values returned by
    // the server are shown explicitly rather than looking like no update.
    const MISSING_TEXT = "(not in response)";

    function formatPrice(value) {
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

        priceOutput.textContent = formatPrice(price);
        if (price === null || price === undefined) {
            empty.push("binomial_option_price");
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
            const time = new Date().toLocaleTimeString();
            if (empty.length > 0) {
                setStatus(`Updated ${time}, but the response had no value for: ${empty.join(", ")}`, true);
            } else {
                setStatus("Updated " + time, false);
            }
        } catch (error) {
            setStatus(error.message, true);
        } finally {
            submitButton.disabled = false;
        }
    }

    form.addEventListener("submit", submit);
})();
