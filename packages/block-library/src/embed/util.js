/**
 * Internal dependencies
 */
import { common, others } from './core-embeds';
import { DEFAULT_EMBED_BLOCK, WORDPRESS_EMBED_BLOCK, ASPECT_RATIOS } from './constants';

/**
 * External dependencies
 */
import { includes, kebabCase, toLower } from 'lodash';
import classnames from 'classnames/dedupe';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { renderToString } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

/**
 * Returns true if any of the regular expressions match the URL.
 *
 * @param {string}   url      The URL to test.
 * @param {Array}    patterns The list of regular expressions to test agains.
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
 * @param {string}  url The URL to test.
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
	return includes( html, 'class="wp-embedded-content"' );
};

export const getPhotoHtml = ( photo ) => {
	// 100% width for the preview so it fits nicely into the document, some "thumbnails" are
	// actually the full size photo. If thumbnails not found, use full image.
	const imageUrl = ( photo.thumbnail_url ) ? photo.thumbnail_url : photo.url;
	const photoPreview = <p><img src={ imageUrl } alt={ photo.title } width="100%" /></p>;
	return renderToString( photoPreview );
};

/***
 * Creates a more suitable embed block based on the passed in props
 * and attributes generated from an embed block's preview.
 *
 * We require `attributesFromPreview` to be generated from the latest attributes
 * and preview, and because of the way the react lifecycle operates, we can't
 * guarantee that the attributes contained in the block's props are the latest
 * versions, so we require that these are generated separately.
 * See `getAttributesFromPreview` in the generated embed edit component.
 *
 * @param {Object}            props                 The block's props.
 * @param {Object}            attributesFromPreview Attributes generated from the block's most up to date preview.
 * @return {Object|undefined} A more suitable embed block if one exists.
 */
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

/**
 * Returns class names with any relevant responsive aspect ratio names.
 *
 * @param {string}  html               The preview HTML that possibly contains an iframe with width and height set.
 * @param {string}  existingClassNames Any existing class names.
 * @param {boolean} allowResponsive    If the responsive class names should be added, or removed.
 * @return {string} Deduped class names.
 */
export function getClassNames( html, existingClassNames = '', allowResponsive = true ) {
	if ( ! allowResponsive ) {
		// Remove all of the aspect ratio related class names.
		const aspectRatioClassNames = {
			'wp-has-aspect-ratio': false,
		};
		for ( let ratioIndex = 0; ratioIndex < ASPECT_RATIOS.length; ratioIndex++ ) {
			const aspectRatioToRemove = ASPECT_RATIOS[ ratioIndex ];
			aspectRatioClassNames[ aspectRatioToRemove.className ] = false;
		}
		return classnames(
			existingClassNames,
			aspectRatioClassNames
		);
	}

	const previewDocument = document.implementation.createHTMLDocument( '' );
	previewDocument.body.innerHTML = html;
	const iframe = previewDocument.body.querySelector( 'iframe' );

	// If we have a fixed aspect iframe, and it's a responsive embed block.
	if ( iframe && iframe.height && iframe.width ) {
		const aspectRatio = ( iframe.width / iframe.height ).toFixed( 2 );
		// Given the actual aspect ratio, find the widest ratio to support it.
		for ( let ratioIndex = 0; ratioIndex < ASPECT_RATIOS.length; ratioIndex++ ) {
			const potentialRatio = ASPECT_RATIOS[ ratioIndex ];
			if ( aspectRatio >= potentialRatio.ratio ) {
				return classnames(
					existingClassNames,
					{
						[ potentialRatio.className ]: allowResponsive,
						'wp-has-aspect-ratio': allowResponsive,
					}
				);
			}
		}
	}

	return existingClassNames;
}

/**
 * Fallback behaviour for unembeddable URLs.
 * Creates a paragraph block containing a link to the URL, and calls `onReplace`.
 *
 * @param {string}   url       The URL that could not be embedded.
 * @param {function} onReplace Function to call with the created fallback block.
 */
export function fallback( url, onReplace ) {
	const link = <a href={ url }>{ url }</a>;
	onReplace(
		createBlock( 'core/paragraph', { content: renderToString( link ) } )
	);
}

/***
 * Gets block attributes based on the preview and responsive state.
 *
 * @param {Object} preview The preview data.
 * @param {Object} currentClassNames The block's current class names.
 * @param {boolean} isResponsive Boolean indicating if the block supports responsive content.
 * @param {boolean} allowResponsive Apply responsive classes to fixed size content.
 * @return {Object} Attributes and values.
 */
export const getAttributesFromPreview = memoize( ( preview, title, currentClassNames, isResponsive, allowResponsive = true ) => {
	if ( ! preview ) {
		return {};
	}

	const attributes = {};
	// Some plugins only return HTML with no type info, so default this to 'rich'.
	let { type = 'rich' } = preview;
	// If we got a provider name from the API, use it for the slug, otherwise we use the title,
	// because not all embed code gives us a provider name.
	const { html, provider_name: providerName } = preview;
	const providerNameSlug = kebabCase( toLower( '' !== providerName ? providerName : title ) );

	if ( isFromWordPress( html ) ) {
		type = 'wp-embed';
	}

	if ( html || 'photo' === type ) {
		attributes.type = type;
		attributes.providerNameSlug = providerNameSlug;
	}

	attributes.className = getClassNames( html, currentClassNames, isResponsive && allowResponsive );

	return attributes;
} );
