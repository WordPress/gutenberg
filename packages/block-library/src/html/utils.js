/**
 * Parses content string into separate HTML, CSS, and JS sections.
 *
 * Extracts CSS from <style data-wp-block-html="css"> tags and
 * JavaScript from <script data-wp-block-html="js"> tags.
 * Everything else is treated as HTML.
 *
 * @param {string} content - The combined content string
 * @return {Object} Object with html, css, and js properties
 */
export function parseContent( content = '' ) {
	if ( ! content || ! content.trim() ) {
		return { html: '', css: '', js: '' };
	}

	// Create a temporary document to parse HTML safely
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = content;

	// Extract CSS from marked style tag
	const styleTag = doc.body.querySelector(
		'style[data-wp-block-html="css"]'
	);
	const css = styleTag ? styleTag.textContent.trim() : '';
	if ( styleTag ) {
		styleTag.remove();
	}

	// Extract JS from marked script tag
	const scriptTag = doc.body.querySelector(
		'script[data-wp-block-html="js"]'
	);
	const js = scriptTag ? scriptTag.textContent.trim() : '';
	if ( scriptTag ) {
		scriptTag.remove();
	}

	// Everything else is HTML
	const html = doc.body.innerHTML.trim();

	return { html, css, js };
}

/**
 * Serializes HTML, CSS, and JS into a single content string.
 *
 * Creates marked <style> and <script> tags for CSS and JS sections,
 * then appends the HTML content.
 *
 * @param {Object} sections      Object with html, css, and js properties
 * @param {string} sections.html HTML content
 * @param {string} sections.css  CSS content
 * @param {string} sections.js   JavaScript content
 * @return {string} Combined content string
 */
export function serializeContent( { html = '', css = '', js = '' } ) {
	const parts = [];

	// Add CSS if present
	if ( css.trim() ) {
		parts.push( `<style data-wp-block-html="css">\n${ css }\n</style>` );
	}

	// Add JS if present
	if ( js.trim() ) {
		parts.push( `<script data-wp-block-html="js">\n${ js }\n</script>` );
	}

	// Add HTML
	if ( html.trim() ) {
		parts.push( html );
	}

	return parts.join( '\n\n' );
}
