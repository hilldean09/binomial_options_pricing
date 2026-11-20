// Shared text loading for every page: fetches the files in texts/ (served
// through the static/texts link), renders Markdown with KaTeX maths, and
// fills in the subtitle under the title.

window.BOP = window.BOP || {};

(function () {
    "use strict";

    const TEXTS_URL = document.currentScript.dataset.textsUrl;

    const subtitle = document.getElementById("subtitle");

    // $$display$$ or $inline$ maths. "\$" is a literal dollar sign, so it
    // neither opens nor closes inline maths.
    const MATH = /\$\$([\s\S]+?)\$\$|(?<!\\)\$((?:\\[\s\S]|[^\\$])+?)\$/g;

    async function fetchText(name) {
        const response = await fetch(TEXTS_URL + name);
        if (!response.ok) {
            throw new Error(`Couldn't load ${name}: ${response.status} ${response.statusText}`);
        }
        return response.text();
    }

    // Maths is set aside before the Markdown pass so its underscores and
    // backslashes aren't read as Markdown, then put back as KaTeX.
    // headingOffset pushes headings down a level each, so a file's "#" can
    // sit below the page's own <h1>. inline renders a one-liner without
    // wrapping it in a <p>, for text placed into an existing element.
    function renderMarkdown(source, { headingOffset = 0, inline = false } = {}) {
        const maths = [];
        const text = source.replace(MATH, (match, display, inline) => {
            maths.push(katex.renderToString(display ?? inline, {
                displayMode: display !== undefined,
                throwOnError: false,
            }));
            return `@@MATH${maths.length - 1}@@`;
        });
        const restoreMaths = (html) => html.replace(/@@MATH(\d+)@@/g, (match, index) => maths[index]);

        if (inline) {
            return restoreMaths(marked.parseInline(text.trim()));
        }

        const tokens = marked.lexer(text);
        if (headingOffset) {
            marked.walkTokens(tokens, (token) => {
                if (token.type === "heading") {
                    token.depth = Math.min(6, token.depth + headingOffset);
                }
            });
        }

        return restoreMaths(marked.parser(tokens));
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

    async function loadSubtitle() {
        subtitle.textContent = (await fetchText("under_title.txt")).trim();
    }

    BOP.texts = { fetchText, renderMarkdown, splitSections };

    loadSubtitle().catch((error) => console.error(error));
})();
