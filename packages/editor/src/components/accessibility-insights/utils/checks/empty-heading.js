/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * @typedef {import('../types').AccessibilityIssue} AccessibilityIssue
 * @typedef {import('../types').BlockLike} BlockLike
 */

/**
 * Strips HTML tags from a string.
 *
 * @param {string} html - HTML string to strip
 * @return {string} Plain text without HTML tags
 */
function stripHtmlTags( html ) {
	if ( ! html || typeof html !== 'string' ) {
		return '';
	}
	return html.replace( /<[^>]*>/g, '' );
}

/**
 * Extracts plain text from rich-text content.
 * Handles both string content and RichTextData objects.
 *
 * @param {string|Object|undefined} content - The content to extract text from
 * @return {string} Plain text content
 */
function getPlainText( content ) {
	if ( ! content ) {
		return '';
	}

	// If it's a string, strip HTML tags
	if ( typeof content === 'string' ) {
		return stripHtmlTags( content );
	}

	// If it's a RichTextData object, it has a `text` property or `toString()` method
	if ( typeof content === 'object' ) {
		// Try the text property first (RichTextData)
		if ( content.text !== undefined ) {
			return String( content.text );
		}
		// Try toString() which RichTextData implements
		if ( typeof content.toString === 'function' ) {
			const str = content.toString();
			// toString() might return "[object Object]" if not a RichTextData
			if ( str !== '[object Object]' ) {
				return stripHtmlTags( str );
			}
		}
		// Try toPlainText() if available
		if ( typeof content.toPlainText === 'function' ) {
			return content.toPlainText();
		}
	}

	return '';
}

/**
 * Checks if heading content is empty or contains only whitespace.
 *
 * @param {string|Object|undefined} content - The heading content to check
 * @return {boolean} True if the heading is considered empty
 */
function isHeadingEmpty( content ) {
	const plainText = getPlainText( content );
	return plainText.trim() === '';
}

/**
 * Checks a heading block for empty or whitespace-only content.
 *
 * @param {BlockLike} block - The heading block to check
 * @return {AccessibilityIssue|null} Issue if found, null otherwise
 */
function checkHeadingBlock( block ) {
	const { content, level } = block.attributes || {};
	const headingLevel = level || 2;

	if ( isHeadingEmpty( content ) ) {
		return {
			id: `empty-heading-${ block.clientId }`,
			type: 'error',
			category: 'empty-heading',
			message: sprintf(
				/* translators: %d: heading level number */
				__( 'H%d heading is empty' ),
				headingLevel
			),
			clientId: block.clientId,
			blockType: block.name,
			suggestion: __(
				'Add content to this heading or remove it. Empty headings confuse screen reader users navigating by headings.'
			),
		};
	}

	return null;
}

/**
 * Checks blocks for empty or whitespace-only headings.
 *
 * @param {BlockLike[]} blocks - Array of blocks to analyze
 * @return {AccessibilityIssue[]} Array of issues found
 */
export function checkEmptyHeadings( blocks ) {
	const issues = [];

	/**
	 * Recursively process a block and its inner blocks.
	 *
	 * @param {BlockLike} block - Block to process
	 */
	function processBlock( block ) {
		if ( block.name === 'core/heading' ) {
			const issue = checkHeadingBlock( block );
			if ( issue ) {
				issues.push( issue );
			}
		}

		// Recursively check inner blocks
		if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
			block.innerBlocks.forEach( processBlock );
		}
	}

	// Process all top-level blocks
	blocks.forEach( processBlock );

	return issues;
}
