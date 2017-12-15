/**
 * Replaces two line breaks with a paragraph tag and one line break with a <br>.
 *
 * Similar to `wpautop()` in formatting.php.
 *
 * @param   {string} text The text input.
 * @returns {string}      The formatted text.
 */
export function autop( text ) {
	const blocklist = (
		'table|thead|tfoot|caption|col|colgroup|tbody|tr|td|th|div|dl|dd|dt|ul|ol|li|pre' +
		'|form|map|area|blockquote|address|math|style|p|h[1-6]|hr|fieldset|legend|section' +
		'|article|aside|hgroup|header|footer|nav|figure|figcaption|details|menu|summary'
	);

	let preserveLinebreaks = false;
	let preserveBr = false;

	// Normalize line breaks.
	text = text.replace( /\r\n|\r/g, '\n' );

	// Remove line breaks from <object>.
	if ( text.indexOf( '<object' ) !== -1 ) {
		text = text.replace( /<object[\s\S]+?<\/object>/g, function( a ) {
			return a.replace( /\n+/g, '' );
		} );
	}

	// Remove line breaks from tags.
	text = text.replace( /<[^<>]+>/g, function( a ) {
		return a.replace( /[\n\t ]+/g, ' ' );
	} );

	// Preserve line breaks in <pre> and <script> tags.
	if ( text.indexOf( '<pre' ) !== -1 || text.indexOf( '<script' ) !== -1 ) {
		preserveLinebreaks = true;
		text = text.replace( /<(pre|script)[^>]*>[\s\S]*?<\/\1>/g, function( a ) {
			return a.replace( /\n/g, '<wp-line-break>' );
		} );
	}

	if ( text.indexOf( '<figcaption' ) !== -1 ) {
		text = text.replace( /\s*(<figcaption[^>]*>)/g, '$1' );
		text = text.replace( /<\/figcaption>\s*/g, '</figcaption>' );
	}

	// Keep <br> tags inside captions.
	if ( text.indexOf( '[caption' ) !== -1 ) {
		preserveBr = true;

		text = text.replace( /\[caption[\s\S]+?\[\/caption\]/g, function( a ) {
			a = a.replace( /<br([^>]*)>/g, '<wp-temp-br$1>' );

			a = a.replace( /<[^<>]+>/g, function( b ) {
				return b.replace( /[\n\t ]+/, ' ' );
			} );

			return a.replace( /\s*\n\s*/g, '<wp-temp-br />' );
		} );
	}

	text = text + '\n\n';
	text = text.replace( /<br \/>\s*<br \/>/gi, '\n\n' );

	// Pad block tags with two line breaks.
	text = text.replace( new RegExp( '(<(?:' + blocklist + ')(?: [^>]*)?>)', 'gi' ), '\n\n$1' );
	text = text.replace( new RegExp( '(</(?:' + blocklist + ')>)', 'gi' ), '$1\n\n' );
	text = text.replace( /<hr( [^>]*)?>/gi, '<hr$1>\n\n' );

	// Remove white space chars around <option>.
	text = text.replace( /\s*<option/gi, '<option' );
	text = text.replace( /<\/option>\s*/gi, '</option>' );

	// Normalize multiple line breaks and white space chars.
	text = text.replace( /\n\s*\n+/g, '\n\n' );

	// Convert two line breaks to a paragraph.
	text = text.replace( /([\s\S]+?)\n\n/g, '<p>$1</p>\n' );

	// Remove empty paragraphs.
	text = text.replace( /<p>\s*?<\/p>/gi, '' );

	// Remove <p> tags that are around block tags.
	text = text.replace( new RegExp( '<p>\\s*(</?(?:' + blocklist + ')(?: [^>]*)?>)\\s*</p>', 'gi' ), '$1' );
	text = text.replace( /<p>(<li.+?)<\/p>/gi, '$1' );

	// Fix <p> in blockquotes.
	text = text.replace( /<p>\s*<blockquote([^>]*)>/gi, '<blockquote$1><p>' );
	text = text.replace( /<\/blockquote>\s*<\/p>/gi, '</p></blockquote>' );

	// Remove <p> tags that are wrapped around block tags.
	text = text.replace( new RegExp( '<p>\\s*(</?(?:' + blocklist + ')(?: [^>]*)?>)', 'gi' ), '$1' );
	text = text.replace( new RegExp( '(</?(?:' + blocklist + ')(?: [^>]*)?>)\\s*</p>', 'gi' ), '$1' );

	text = text.replace( /(<br[^>]*>)\s*\n/gi, '$1' );

	// Add <br> tags.
	text = text.replace( /\s*\n/g, '<br />\n' );

	// Remove <br> tags that are around block tags.
	text = text.replace( new RegExp( '(</?(?:' + blocklist + ')[^>]*>)\\s*<br />', 'gi' ), '$1' );
	text = text.replace( /<br \/>(\s*<\/?(?:p|li|div|dl|dd|dt|th|pre|td|ul|ol)>)/gi, '$1' );

	// Remove <p> and <br> around captions.
	text = text.replace( /(?:<p>|<br ?\/?>)*\s*\[caption([^\[]+)\[\/caption\]\s*(?:<\/p>|<br ?\/?>)*/gi, '[caption$1[/caption]' );

	// Make sure there is <p> when there is </p> inside block tags that can contain other blocks.
	text = text.replace( /(<(?:div|th|td|form|fieldset|dd)[^>]*>)(.*?)<\/p>/g, function( a, b, c ) {
		if ( c.match( /<p( [^>]*)?>/ ) ) {
			return a;
		}

		return b + '<p>' + c + '</p>';
	} );

	// Restore the line breaks in <pre> and <script> tags.
	if ( preserveLinebreaks ) {
		text = text.replace( /<wp-line-break>/g, '\n' );
	}

	// Restore the <br> tags in captions.
	if ( preserveBr ) {
		text = text.replace( /<wp-temp-br([^>]*)>/g, '<br$1>' );
	}

	return text;
}

/**
 * Replaces <p> tags with two line breaks. "Opposite" of wpautop().
 *
 * Replaces <p> tags with two line breaks except where the <p> has attributes.
 * Unifies whitespace.
 * Indents <li>, <dt> and <dd> for better readability.
 *
 * @param  {string} html The content from the editor.
 * @return {string}      The content with stripped paragraph tags.
 */
export function removep( html ) {
	const blocklist = 'blockquote|ul|ol|li|dl|dt|dd|table|thead|tbody|tfoot|tr|th|td|h[1-6]|fieldset|figure';
	const blocklist1 = blocklist + '|div|p';
	const blocklist2 = blocklist + '|pre';
	const preserve = [];
	let preserveLinebreaks = false;
	let preserveBr = false;

	if ( ! html ) {
		return '';
	}

	// Protect script and style tags.
	if ( html.indexOf( '<script' ) !== -1 || html.indexOf( '<style' ) !== -1 ) {
		html = html.replace( /<(script|style)[^>]*>[\s\S]*?<\/\1>/g, function( match ) {
			preserve.push( match );
			return '<wp-preserve>';
		} );
	}

	// Protect pre tags.
	if ( html.indexOf( '<pre' ) !== -1 ) {
		preserveLinebreaks = true;
		html = html.replace( /<pre[^>]*>[\s\S]+?<\/pre>/g, function( a ) {
			a = a.replace( /<br ?\/?>(\r\n|\n)?/g, '<wp-line-break>' );
			a = a.replace( /<\/?p( [^>]*)?>(\r\n|\n)?/g, '<wp-line-break>' );
			return a.replace( /\r?\n/g, '<wp-line-break>' );
		} );
	}

	// Remove line breaks but keep <br> tags inside image captions.
	if ( html.indexOf( '[caption' ) !== -1 ) {
		preserveBr = true;
		html = html.replace( /\[caption[\s\S]+?\[\/caption\]/g, function( a ) {
			return a.replace( /<br([^>]*)>/g, '<wp-temp-br$1>' ).replace( /[\r\n\t]+/, '' );
		} );
	}

	// Normalize white space characters before and after block tags.
	html = html.replace( new RegExp( '\\s*</(' + blocklist1 + ')>\\s*', 'g' ), '</$1>\n' );
	html = html.replace( new RegExp( '\\s*<((?:' + blocklist1 + ')(?: [^>]*)?)>', 'g' ), '\n<$1>' );

	// Mark </p> if it has any attributes.
	html = html.replace( /(<p [^>]+>.*?)<\/p>/g, '$1</p#>' );

	// Preserve the first <p> inside a <div>.
	html = html.replace( /<div( [^>]*)?>\s*<p>/gi, '<div$1>\n\n' );

	// Remove paragraph tags.
	html = html.replace( /\s*<p>/gi, '' );
	html = html.replace( /\s*<\/p>\s*/gi, '\n\n' );

	// Normalize white space chars and remove multiple line breaks.
	html = html.replace( /\n[\s\u00a0]+\n/g, '\n\n' );

	// Replace <br> tags with line breaks.
	html = html.replace( /(\s*)<br ?\/?>\s*/gi, function( match, space ) {
		if ( space && space.indexOf( '\n' ) !== -1 ) {
			return '\n\n';
		}

		return '\n';
	} );

	// Fix line breaks around <div>.
	html = html.replace( /\s*<div/g, '\n<div' );
	html = html.replace( /<\/div>\s*/g, '</div>\n' );

	// Fix line breaks around caption shortcodes.
	html = html.replace( /\s*\[caption([^\[]+)\[\/caption\]\s*/gi, '\n\n[caption$1[/caption]\n\n' );
	html = html.replace( /caption\]\n\n+\[caption/g, 'caption]\n\n[caption' );

	// Pad block elements tags with a line break.
	html = html.replace( new RegExp( '\\s*<((?:' + blocklist2 + ')(?: [^>]*)?)\\s*>', 'g' ), '\n<$1>' );
	html = html.replace( new RegExp( '\\s*</(' + blocklist2 + ')>\\s*', 'g' ), '</$1>\n' );

	// Indent <li>, <dt> and <dd> tags.
	html = html.replace( /<((li|dt|dd)[^>]*)>/g, ' \t<$1>' );

	// Fix line breaks around <select> and <option>.
	if ( html.indexOf( '<option' ) !== -1 ) {
		html = html.replace( /\s*<option/g, '\n<option' );
		html = html.replace( /\s*<\/select>/g, '\n</select>' );
	}

	// Pad <hr> with two line breaks.
	if ( html.indexOf( '<hr' ) !== -1 ) {
		html = html.replace( /\s*<hr( [^>]*)?>\s*/g, '\n\n<hr$1>\n\n' );
	}

	// Remove line breaks in <object> tags.
	if ( html.indexOf( '<object' ) !== -1 ) {
		html = html.replace( /<object[\s\S]+?<\/object>/g, function( a ) {
			return a.replace( /[\r\n]+/g, '' );
		} );
	}

	// Unmark special paragraph closing tags.
	html = html.replace( /<\/p#>/g, '</p>\n' );

	// Pad remaining <p> tags whit a line break.
	html = html.replace( /\s*(<p [^>]+>[\s\S]*?<\/p>)/g, '\n$1' );

	// Trim.
	html = html.replace( /^\s+/, '' );
	html = html.replace( /[\s\u00a0]+$/, '' );

	if ( preserveLinebreaks ) {
		html = html.replace( /<wp-line-break>/g, '\n' );
	}

	if ( preserveBr ) {
		html = html.replace( /<wp-temp-br([^>]*)>/g, '<br$1>' );
	}

	// Restore preserved tags.
	if ( preserve.length ) {
		html = html.replace( /<wp-preserve>/g, function() {
			return preserve.shift();
		} );
	}

	return html;
}
