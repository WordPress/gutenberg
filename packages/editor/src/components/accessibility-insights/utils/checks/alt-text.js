/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * @typedef {import('../types').AccessibilityIssue} AccessibilityIssue
 * @typedef {import('../types').BlockLike} BlockLike
 */

/**
 * Checks if a string is empty or contains only whitespace.
 *
 * @param {string|undefined} value - The value to check
 * @return {boolean} True if empty or whitespace-only
 */
function isEmptyOrWhitespace( value ) {
	return ! value || value.trim() === '';
}

/**
 * Creates an accessibility issue for missing alt text.
 *
 * @param {BlockLike} block     - The block with the issue
 * @param {string}    [context] - Additional context for the message
 * @return {AccessibilityIssue} The accessibility issue
 */
function createAltTextIssue( block, context = '' ) {
	const message = context
		? sprintf(
				/* translators: %s: context like "media" or "background" */
				__( 'Image is missing alt text (%s)' ),
				context
		  )
		: __( 'Image is missing alt text' );

	return {
		id: `alt-text-${ block.clientId }${ context ? `-${ context }` : '' }`,
		type: 'error',
		category: 'alt-text',
		message,
		clientId: block.clientId,
		blockType: block.name,
		suggestion: __(
			'Add descriptive alt text to help screen reader users understand the image content.'
		),
	};
}

/**
 * Checks a core/image block for alt text.
 *
 * @param {BlockLike} block - The image block to check
 * @return {AccessibilityIssue[]} Array of issues found
 */
function checkImageBlock( block ) {
	const issues = [];
	const { alt } = block.attributes || {};

	if ( isEmptyOrWhitespace( alt ) ) {
		issues.push( createAltTextIssue( block ) );
	}

	return issues;
}

/**
 * Checks a core/media-text block for alt text.
 *
 * @param {BlockLike} block - The media-text block to check
 * @return {AccessibilityIssue[]} Array of issues found
 */
function checkMediaTextBlock( block ) {
	const issues = [];
	const { mediaAlt, mediaType } = block.attributes || {};

	// Only check if media type is image
	if ( mediaType === 'image' && isEmptyOrWhitespace( mediaAlt ) ) {
		issues.push( createAltTextIssue( block, 'media' ) );
	}

	return issues;
}

/**
 * Checks a core/gallery block for alt text on all images.
 *
 * @param {BlockLike} block - The gallery block to check
 * @return {AccessibilityIssue[]} Array of issues found
 */
function checkGalleryBlock( block ) {
	const issues = [];
	const { images } = block.attributes || {};

	if ( Array.isArray( images ) ) {
		images.forEach( ( image, index ) => {
			if ( isEmptyOrWhitespace( image.alt ) ) {
				issues.push( {
					id: `alt-text-${ block.clientId }-image-${ index }`,
					type: 'error',
					category: 'alt-text',
					message: sprintf(
						/* translators: %d: image number in gallery */
						__( 'Gallery image %d is missing alt text' ),
						index + 1
					),
					clientId: block.clientId,
					blockType: block.name,
					suggestion: __(
						'Add descriptive alt text to each gallery image.'
					),
				} );
			}
		} );
	}

	// Also check innerBlocks for newer gallery format
	if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
		block.innerBlocks.forEach( ( innerBlock, index ) => {
			if (
				innerBlock.name === 'core/image' &&
				isEmptyOrWhitespace( innerBlock.attributes?.alt )
			) {
				issues.push( {
					id: `alt-text-${ innerBlock.clientId }`,
					type: 'error',
					category: 'alt-text',
					message: sprintf(
						/* translators: %d: image number in gallery */
						__( 'Gallery image %d is missing alt text' ),
						index + 1
					),
					clientId: innerBlock.clientId,
					blockType: innerBlock.name,
					suggestion: __(
						'Add descriptive alt text to each gallery image.'
					),
				} );
			}
		} );
	}

	return issues;
}

/**
 * Checks a core/cover block for background image alt text.
 *
 * @param {BlockLike} block - The cover block to check
 * @return {AccessibilityIssue[]} Array of issues found
 */
function checkCoverBlock( block ) {
	const issues = [];
	const { url, alt, backgroundType } = block.attributes || {};

	// Only check if there's an image background
	if ( url && backgroundType !== 'video' && isEmptyOrWhitespace( alt ) ) {
		issues.push( createAltTextIssue( block, 'background' ) );
	}

	return issues;
}

/**
 * Recursively checks blocks for missing alt text on images.
 *
 * @param {BlockLike[]} blocks - Array of blocks to analyze
 * @return {AccessibilityIssue[]} Array of issues found
 */
export function checkAltText( blocks ) {
	const issues = [];

	/**
	 * Recursively process a block and its inner blocks.
	 *
	 * @param {BlockLike} block - Block to process
	 */
	function processBlock( block ) {
		// Check based on block type
		switch ( block.name ) {
			case 'core/image':
				issues.push( ...checkImageBlock( block ) );
				break;
			case 'core/media-text':
				issues.push( ...checkMediaTextBlock( block ) );
				break;
			case 'core/gallery':
				issues.push( ...checkGalleryBlock( block ) );
				break;
			case 'core/cover':
				issues.push( ...checkCoverBlock( block ) );
				break;
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
