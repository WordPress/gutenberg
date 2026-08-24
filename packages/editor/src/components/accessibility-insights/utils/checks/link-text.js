/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * @typedef {import('../types').AccessibilityIssue} AccessibilityIssue
 * @typedef {import('../types').BlockLike} BlockLike
 */

/**
 * Non-descriptive link text patterns to check for.
 * These are common phrases that don't provide meaningful context.
 */
const NON_DESCRIPTIVE_PATTERNS = [
	'click here',
	'click',
	'here',
	'read more',
	'more',
	'learn more',
	'this',
	'link',
	'this link',
	'info',
	'information',
];

/**
 * Checks if link text matches a non-descriptive pattern.
 *
 * @param {string} text - The link text to check
 * @return {boolean} True if the text is non-descriptive
 */
function isNonDescriptive( text ) {
	if ( ! text ) {
		return false;
	}

	const normalizedText = text.toLowerCase().trim();

	// Check for exact matches
	return NON_DESCRIPTIVE_PATTERNS.some(
		( pattern ) => normalizedText === pattern
	);
}

/**
 * Extracts link text from HTML content using regex.
 *
 * @param {string} html - HTML content to parse
 * @return {Array<{text: string, href: string}>} Array of link objects
 */
function extractLinksFromHtml( html ) {
	if ( ! html || typeof html !== 'string' ) {
		return [];
	}

	const links = [];
	// Match anchor tags and extract href and inner text
	const anchorRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi;
	let match;

	while ( ( match = anchorRegex.exec( html ) ) !== null ) {
		const href = match[ 1 ];
		// Strip HTML tags from inner content to get plain text
		const text = match[ 2 ].replace( /<[^>]*>/g, '' ).trim();

		if ( text && href ) {
			links.push( { text, href } );
		}
	}

	return links;
}

/**
 * Checks a paragraph block for non-descriptive link text.
 *
 * @param {BlockLike} block - The paragraph block to check
 * @return {AccessibilityIssue[]} Array of issues found
 */
function checkParagraphBlock( block ) {
	const issues = [];
	const { content } = block.attributes || {};

	const links = extractLinksFromHtml( content );

	links.forEach( ( link ) => {
		if ( isNonDescriptive( link.text ) ) {
			issues.push( {
				id: `link-text-${ block.clientId }-${ link.text
					.toLowerCase()
					.replace( /\s+/g, '-' ) }`,
				type: 'warning',
				category: 'link-text',
				message: sprintf(
					/* translators: %s: the non-descriptive link text */
					__( 'Link text "%s" is not descriptive' ),
					link.text
				),
				clientId: block.clientId,
				blockType: block.name,
				suggestion: __(
					'Use descriptive link text that indicates where the link leads. Avoid generic phrases like "click here" or "read more".'
				),
			} );
		}
	} );

	return issues;
}

/**
 * Checks a button block for non-descriptive text.
 *
 * @param {BlockLike} block - The button block to check
 * @return {AccessibilityIssue[]} Array of issues found
 */
function checkButtonBlock( block ) {
	const issues = [];
	const { text, url } = block.attributes || {};

	// Only check if the button has a URL (is actually a link)
	if ( url && text && isNonDescriptive( text ) ) {
		issues.push( {
			id: `link-text-${ block.clientId }`,
			type: 'warning',
			category: 'link-text',
			message: sprintf(
				/* translators: %s: the non-descriptive button text */
				__( 'Button text "%s" is not descriptive' ),
				text
			),
			clientId: block.clientId,
			blockType: block.name,
			suggestion: __(
				'Use descriptive button text that indicates the action or destination.'
			),
		} );
	}

	return issues;
}

/**
 * Checks a list block for non-descriptive link text in list items.
 *
 * @param {BlockLike} block - The list block to check
 * @return {AccessibilityIssue[]} Array of issues found
 */
function checkListBlock( block ) {
	const issues = [];
	const { values } = block.attributes || {};

	// Check the list content for links
	const links = extractLinksFromHtml( values );

	links.forEach( ( link ) => {
		if ( isNonDescriptive( link.text ) ) {
			issues.push( {
				id: `link-text-${ block.clientId }-${ link.text
					.toLowerCase()
					.replace( /\s+/g, '-' ) }`,
				type: 'warning',
				category: 'link-text',
				message: sprintf(
					/* translators: %s: the non-descriptive link text */
					__( 'Link text "%s" in list is not descriptive' ),
					link.text
				),
				clientId: block.clientId,
				blockType: block.name,
				suggestion: __(
					'Use descriptive link text that indicates where the link leads.'
				),
			} );
		}
	} );

	// Also check innerBlocks for newer list format
	if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
		block.innerBlocks.forEach( ( listItem ) => {
			if ( listItem.name === 'core/list-item' ) {
				const itemLinks = extractLinksFromHtml(
					listItem.attributes?.content
				);
				itemLinks.forEach( ( link ) => {
					if ( isNonDescriptive( link.text ) ) {
						issues.push( {
							id: `link-text-${ listItem.clientId }-${ link.text
								.toLowerCase()
								.replace( /\s+/g, '-' ) }`,
							type: 'warning',
							category: 'link-text',
							message: sprintf(
								/* translators: %s: the non-descriptive link text */
								__( 'Link text "%s" is not descriptive' ),
								link.text
							),
							clientId: listItem.clientId,
							blockType: listItem.name,
							suggestion: __(
								'Use descriptive link text that indicates where the link leads.'
							),
						} );
					}
				} );
			}
		} );
	}

	return issues;
}

/**
 * Checks blocks for non-descriptive link text.
 *
 * @param {BlockLike[]} blocks - Array of blocks to analyze
 * @return {AccessibilityIssue[]} Array of issues found
 */
export function checkLinkText( blocks ) {
	const issues = [];

	/**
	 * Recursively process a block and its inner blocks.
	 *
	 * @param {BlockLike} block - Block to process
	 */
	function processBlock( block ) {
		// Check based on block type
		switch ( block.name ) {
			case 'core/paragraph':
				issues.push( ...checkParagraphBlock( block ) );
				break;
			case 'core/button':
				issues.push( ...checkButtonBlock( block ) );
				break;
			case 'core/list':
				issues.push( ...checkListBlock( block ) );
				break;
		}

		// Recursively check inner blocks (except for list which we handle specially)
		if (
			block.innerBlocks &&
			block.innerBlocks.length > 0 &&
			block.name !== 'core/list'
		) {
			block.innerBlocks.forEach( processBlock );
		}
	}

	// Process all top-level blocks
	blocks.forEach( processBlock );

	return issues;
}
