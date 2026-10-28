#!/usr/bin/env node
/**
 * Adds a note for AI agents and other tools that read the Storybook page
 * without running JavaScript, which otherwise see only the page title.
 *
 * The note sits inside the manager's root element, so the manager replaces it
 * when it renders. It is hidden with CSS, since tools that convert HTML to text
 * do not apply stylesheets and some skip `noscript` content.
 */
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert';

const indexPath = process.argv[ 2 ];

assert( indexPath, 'Storybook index.html path is required' );

const rawBaseUrl =
	'https://raw.githubusercontent.com/WordPress/gutenberg/trunk';

// Not an inline style, since Mozilla Readability, which some tools use to
// extract page text, skips elements with an inline `display: none`.
const style = '<style>#agent-docs-note { display: none; }</style>';

const note = `<div id="agent-docs-note">
	<h1>Gutenberg Storybook</h1>
	<p>This site needs JavaScript. To read its documentation without a browser, use these sources:</p>
	<ul>
		<li>The <a href="https://github.com/WordPress/gutenberg/blob/trunk/packages/design-system-mcp/README.md">WordPress Design System MCP server</a> provides AI agents with recommended components, their props and usage, and design tokens.</li>
		<li><a href="./index.json">index.json</a> lists every page. The <code>path</code> parameter of a page URL, such as <code>?path=/docs/components-checkboxcontrol--migration-guide</code>, ends with the ID of its entry. The entry's <code>importPath</code> is the source file, relative to the <code>storybook</code> directory of the Gutenberg repository. For example, that page's source is <a href="${ rawBaseUrl }/packages/components/src/checkbox-control/stories/migration-guide.mdx">${ rawBaseUrl }/packages/components/src/checkbox-control/stories/migration-guide.mdx</a>.</li>
		<li><a href="./manifests/components.json">manifests/components.json</a> contains the generated documentation of the recommended components.</li>
	</ul>
</div>`;

const rootElement = '<div id="root"></div>';

const html = await readFile( indexPath, 'utf8' );

assert( html.includes( '</head>' ), 'Expected a closing head tag' );
assert( html.includes( rootElement ), `Expected ${ rootElement }` );

await writeFile(
	indexPath,
	html
		.replace( '</head>', `${ style }</head>` )
		.replace( rootElement, `<div id="root">${ note }</div>` )
);
