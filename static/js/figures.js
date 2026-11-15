// Shared Plotly drawing for the figures the API returns.

window.BOP = window.BOP || {};

(function () {
    "use strict";

    const FIGURE_CONFIG = { responsive: true, displayModeBar: false };

    // Plotly's default title position across the figure.
    const DEFAULT_TITLE_X = 0.05;

    // Width (px) kept clear after a title, and between it and the legend.
    const TITLE_PADDING = 20;
    const LEGEND_GAP = 12;

    // Pixel layout of a title we place ourselves: space above it, an
    // estimate of each line's height (corrected once drawn), and the space
    // below it, plus a row for the legend when it needs its own.
    const TITLE_TOP = 12;
    const TITLE_LINE_HEIGHT = 20;
    const TITLE_GAP = 18;
    const LEGEND_ROW = 20;

    // Approximate width (px) a legend entry takes beyond its name: the line
    // sample and the space after it.
    const LEGEND_ENTRY_EXTRA = 46;
    const LEGEND_FONT_SIZE = 12;

    const measureContext = document.createElement("canvas").getContext("2d");

    // Latest draw per element, so a correction for a replaced figure is
    // skipped.
    const latestDraw = new WeakMap();

    function textWidth(text, size, family) {
        measureContext.font = `${size}px ${family}`;
        return measureContext.measureText(text).width;
    }

    function titleWidth(layout, text) {
        const family = layout.title.font?.family ?? layout.font?.family ?? "sans-serif";
        return textWidth(text, layout.title.font?.size ?? 16, family);
    }

    // Plotly anchors a title by its x: left of a third across, right past
    // two thirds, centred between.
    function titleLeft(layout, width, textWidthPx) {
        const x = (layout.title.x ?? DEFAULT_TITLE_X) * width;
        if (x < width / 3) {
            return x;
        }
        return x > (2 * width) / 3 ? x - textWidthPx : x - textWidthPx / 2;
    }

    // Breaks the words into lines no wider than maxWidth, as far as
    // single words allow.
    function fillLines(layout, words, maxWidth) {
        const lines = [];
        let line = "";
        for (const word of words) {
            const candidate = line ? `${line} ${word}` : word;
            if (!line || titleWidth(layout, candidate) <= maxWidth) {
                line = candidate;
            } else {
                lines.push(line);
                line = word;
            }
        }
        lines.push(line);
        return lines;
    }

    // Plotly doesn't wrap titles, so break them into as few lines as fit,
    // evened out so the last line isn't left short. Returns the line count.
    function wrapTitle(layout, width) {
        const text = layout.title.text;
        const words = text.split(" ");
        const maxWidth = width - titleLeft(layout, width, 0) - TITLE_PADDING;
        const count = fillLines(layout, words, maxWidth).length;
        if (count === 1) {
            return 1;
        }

        let lineWidth = titleWidth(layout, text) / count;
        let lines = fillLines(layout, words, lineWidth);
        while (lines.length > count) {
            lineWidth += 10;
            lines = fillLines(layout, words, lineWidth);
        }

        layout.title.text = lines.join("<br>");
        return lines.length;
    }

    function legendWidth(figure) {
        const family = figure.layout.legend?.font?.family ?? figure.layout.font?.family ?? "sans-serif";
        const size = figure.layout.legend?.font?.size ?? LEGEND_FONT_SIZE;
        return figure.data
            .filter((trace) => trace.showlegend)
            .reduce((sum, trace) => sum + textWidth(trace.name ?? "", size, family) + LEGEND_ENTRY_EXTRA, 0);
    }

    // The legend sits just above the plot, on the title's band; true if a
    // one-line title would run into it.
    function titleMeetsLegend(figure, width) {
        const layout = figure.layout;
        const textWidthPx = titleWidth(layout, layout.title.text);
        const right = titleLeft(layout, width, textWidthPx) + textWidthPx;
        const legendLeft = width - (layout.margin?.r ?? 0) - legendWidth(figure);
        return right + LEGEND_GAP > legendLeft;
    }

    // Wraps a title that doesn't fit, and gives the legend its own row when
    // the title would meet it. Returns how the title was placed, or null if
    // it was left to Plotly.
    function fitTitle(figure, width) {
        const layout = figure.layout;
        if (!layout.title?.text) {
            return null;
        }
        const hasLegend = figure.data.some((trace) => trace.showlegend);
        const lines = wrapTitle(layout, width);
        const legendRow = hasLegend && (lines > 1 || titleMeetsLegend(figure, width));

        if (lines === 1 && !legendRow) {
            return null;
        }

        const titleHeight = lines * TITLE_LINE_HEIGHT;
        layout.margin.t = TITLE_TOP + titleHeight + TITLE_GAP + (legendRow ? LEGEND_ROW : 0);
        Object.assign(layout.title, { yref: "container", yanchor: "top", y: 1, pad: { t: TITLE_TOP } });
        return { legendRow };
    }

    // Plotly's anchoring of a multi-line title drifts with its line count,
    // so move it to where it should be, and size the top margin to it.
    function correctTitle(element, placement) {
        const title = element.querySelector(".gtitle");
        if (!title) {
            return;
        }
        const box = title.getBoundingClientRect();
        const top = box.top - element.getBoundingClientRect().top;
        const height = element._fullLayout.height;

        Plotly.relayout(element, {
            "title.y": element.layout.title.y - (TITLE_TOP - top) / height,
            "margin.t": Math.round(TITLE_TOP + box.height + TITLE_GAP + (placement.legendRow ? LEGEND_ROW : 0)),
        });
    }

    // Draws the figure into the element, or clears it and returns false if
    // there isn't one. The element must be displayed, so Plotly can size it.
    function draw(element, figure) {
        if (!figure) {
            latestDraw.delete(element);
            Plotly.purge(element);
            return false;
        }
        const placement = fitTitle(figure, element.clientWidth);
        const drawId = (latestDraw.get(element) ?? 0) + 1;
        latestDraw.set(element, drawId);

        const drawn = Plotly.react(element, figure.data, figure.layout, FIGURE_CONFIG);
        if (placement) {
            drawn.then(() => {
                if (latestDraw.get(element) === drawId) {
                    correctTitle(element, placement);
                }
            });
        }
        return true;
    }

    BOP.figures = { draw };
})();
