/**
 * Internal dependencies
 */
import { common, others } from './core-embeds';
import { DEFAULT_EMBED_BLOCK, WORDPRESS_EMBED_BLOCK } from './constants';

/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { renderToString } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

/**
 * Returns true if any of the regular expressions match the URL.
 *
 * @param {string} url The URL to test.
 * @param {Array} patterns The list of regular expressions to test agains.
 * @return {boolean} True if any of the regular expressions match the URL.
 */
export const matchesPatterns = ( url, patterns = [] ) => {
	return patterns.some( ( pattern ) => {
		return url.match( pattern );
	} );
};

/**
 * Finds the block name that should be used for the URL, based on the
 * structure of the URL.
 *
 * @param {string} url The URL to test.
 * @return {string} The name of the block that should be used for this URL, e.g. core-embed/twitter
 */
export const findBlock = ( url ) => {
	for ( const block of [ ...common, ...others ] ) {
		if ( matchesPatterns( url, block.patterns ) ) {
			return block.name;
		}
	}
	return DEFAULT_EMBED_BLOCK;
};

export const isFromWordPress = ( html ) => {
	return includes( html, 'class="wp-embedded-content" data-secret' );
};

export const getPhotoHtml = ( photo ) => {
	// 100% width for the preview so it fits nicely into the document, some "thumbnails" are
	// acually the full size photo.
	const photoPreview = <p><img src={ photo.thumbnail_url } alt={ photo.title } width="100%" /></p>;
	return renderToString( photoPreview );
};

export const createUpgradedEmbedBlock = ( props, attributesFromPreview ) => {
	const { preview, name } = props;
	const { url } = props.attributes;

	if ( ! url ) {
		return;
	}

	const matchingBlock = findBlock( url );

	// WordPress blocks can work on multiple sites, and so don't have patterns,
	// so if we're in a WordPress block, assume the user has chosen it for a WordPress URL.
	if ( WORDPRESS_EMBED_BLOCK !== name && DEFAULT_EMBED_BLOCK !== matchingBlock ) {
		// At this point, we have discovered a more suitable block for this url, so transform it.
		if ( name !== matchingBlock ) {
			return createBlock( matchingBlock, { url } );
		}
	}

	if ( preview ) {
		const { html } = preview;

		// We can't match the URL for WordPress embeds, we have to check the HTML instead.
		if ( isFromWordPress( html ) ) {
			// If this is not the WordPress embed block, transform it into one.
			if ( WORDPRESS_EMBED_BLOCK !== name ) {
				return createBlock(
					WORDPRESS_EMBED_BLOCK,
					{
						url,
						// By now we have the preview, but when the new block first renders, it
						// won't have had all the attributes set, and so won't get the correct
						// type and it won't render correctly. So, we pass through the current attributes
						// here so that the initial render works when we switch to the WordPress
						// block. This only affects the WordPress block because it can't be
						// rendered in the usual Sandbox (it has a sandbox of its own) and it
						// relies on the preview to set the correct render type.
						...attributesFromPreview,
					}
				);
			}
		}
	}
};
