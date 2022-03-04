/**
 * Internal dependencies
 */
import { ASPECT_RATIOS, WP_EMBED_TYPE } from './constants';

/**
 * External dependencies
 */
import { kebabCase } from 'lodash';
import classnames from 'classnames/dedupe';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { renderToString } from '@wordpress/element';
import {
	createBlock,
	getBlockType,
	getBlockVariations,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import metadata from './block.json';

const { name: DEFAULT_EMBED_BLOCK } = metadata;

/** @typedef {import('@wordpress/blocks').WPBlockVariation} WPBlockVariation */

/**
 * Returns the embed block's information by matching the provided service provider
 *
 * @param {string} provider The embed block's provider
 * @return {WPBlockVariation} The embed block's information
 */
export const getEmbedInfoByProvider = ( provider ) =>
	getBlockVariations( DEFAULT_EMBED_BLOCK )?.find(
		( { name } ) => name === provider
	);

/**
 * Returns true if any of the regular expressions match the URL.
 *
 * @param {string} url      The URL to test.
 * @param {Array}  patterns The list of regular expressions to test agains.
 * @return {boolean} True if any of the regular expressions match the URL.
 */
export const matchesPatterns = ( url, patterns = [] ) =>
	patterns.some( ( pattern ) => url.match( pattern ) );

/**
 * Finds the block variation that should be used for the URL,
 * based on the provided URL and the variation's patterns.
 *
 * @param {string} url The URL to test.
 * @return {WPBlockVariation} The block variation that should be used for this URL
 */
export const findMoreSuitableBlock = ( url ) =>
	getBlockVariations( DEFAULT_EMBED_BLOCK )?.find( ( { patterns } ) =>
		matchesPatterns( url, patterns )
	);

export const isFromWordPress = ( html ) =>
	html && html.includes( 'class="wp-embedded-content"' );

export const getPhotoHtml = ( photo ) => {
	// 100% width for the preview so it fits nicely into the document, some "thumbnails" are
	// actually the full size photo. If thumbnails not found, use full image.
	const imageUrl = photo.thumbnail_url || photo.url;
	const photoPreview = (
		<p>
			<img src={ imageUrl } alt={ photo.title } width="100%" />
		</p>
	);
	return renderToString( photoPreview );
};

/**
 * Creates a more suitable embed block based on the passed in props
 * and attributes generated from an embed block's preview.
 *
 * We require `attributesFromPreview` to be generated from the latest attributes
 * and preview, and because of the way the react lifecycle operates, we can't
 * guarantee that the attributes contained in the block's props are the latest
 * versions, so we require that these are generated separately.
 * See `getAttributesFromPreview` in the generated embed edit component.
 *
 * @param {Object} props                   The block's props.
 * @param {Object} [attributesFromPreview] Attributes generated from the block's most up to date preview.
 * @return {Object|undefined} A more suitable embed block if one exists.
 */
export const createUpgradedEmbedBlock = (
	props,
	attributesFromPreview = {}
) => {
	const { preview, attributes = {} } = props;
	const { url, providerNameSlug, type, ...restAttributes } = attributes;

	if ( ! url || ! getBlockType( DEFAULT_EMBED_BLOCK ) ) return;

	const matchedBlock = findMoreSuitableBlock( url );

	// WordPress blocks can work on multiple sites, and so don't have patterns,
	// so if we're in a WordPress block, assume the user has chosen it for a WordPress URL.
	const isCurrentBlockWP =
		providerNameSlug === 'wordpress' || type === WP_EMBED_TYPE;
	// If current block is not WordPress and a more suitable block found
	// that is different from the current one, create the new matched block.
	const shouldCreateNewBlock =
		! isCurrentBlockWP &&
		matchedBlock &&
		( matchedBlock.attributes.providerNameSlug !== providerNameSlug ||
			! providerNameSlug );
	if ( shouldCreateNewBlock ) {
		return createBlock( DEFAULT_EMBED_BLOCK, {
			url,
			...restAttributes,
			...matchedBlock.attributes,
		} );
	}

	const wpVariation = getBlockVariations( DEFAULT_EMBED_BLOCK )?.find(
		( { name } ) => name === 'wordpress'
	);

	// We can't match the URL for WordPress embeds, we have to check the HTML instead.
	if (
		! wpVariation ||
		! preview ||
		! isFromWordPress( preview.html ) ||
		isCurrentBlockWP
	) {
		return;
	}

	// This is not the WordPress embed block so transform it into one.
	return createBlock( DEFAULT_EMBED_BLOCK, {
		url,
		...wpVariation.attributes,
		// By now we have the preview, but when the new block first renders, it
		// won't have had all the attributes set, and so won't get the correct
		// type and it won't render correctly. So, we pass through the current attributes
		// here so that the initial render works when we switch to the WordPress
		// block. This only affects the WordPress block because it can't be
		// rendered in the usual Sandbox (it has a sandbox of its own) and it
		// relies on the preview to set the correct render type.
		...attributesFromPreview,
	} );
};

/**
 * Removes all previously set aspect ratio related classes and return the rest
 * existing class names.
 *
 * @param {string} existingClassNames Any existing class names.
 * @return {string} The class names without any aspect ratio related class.
 */
export const removeAspectRatioClasses = ( existingClassNames ) => {
	if ( ! existingClassNames ) {
		// Avoids extraneous work and also, by returning the same value as
		// received, ensures the post is not dirtied by a change of the block
		// attribute from `undefined` to an emtpy string.
		return existingClassNames;
	}
	const aspectRatioClassNames = ASPECT_RATIOS.reduce(
		( accumulator, { className } ) => {
			accumulator[ className ] = false;
			return accumulator;
		},
		{ 'wp-has-aspect-ratio': false }
	);
	return classnames( existingClassNames, aspectRatioClassNames );
};

/**
 * Returns class names with any relevant responsive aspect ratio names.
 *
 * @param {string}  html               The preview HTML that possibly contains an iframe with width and height set.
 * @param {string}  existingClassNames Any existing class names.
 * @param {boolean} allowResponsive    If the responsive class names should be added, or removed.
 * @return {string} Deduped class names.
 */
export function getClassNames(
	html,
	existingClassNames,
	allowResponsive = true
) {
	if ( ! allowResponsive ) {
		return removeAspectRatioClasses( existingClassNames );
	}

	const previewDocument = document.implementation.createHTMLDocument( '' );
	previewDocument.body.innerHTML = html;
	const iframe = previewDocument.body.querySelector( 'iframe' );

	// If we have a fixed aspect iframe, and it's a responsive embed block.
	if ( iframe && iframe.height && iframe.width ) {
		const aspectRatio = ( iframe.width / iframe.height ).toFixed( 2 );
		// Given the actual aspect ratio, find the widest ratio to support it.
		for (
			let ratioIndex = 0;
			ratioIndex < ASPECT_RATIOS.length;
			ratioIndex++
		) {
			const potentialRatio = ASPECT_RATIOS[ ratioIndex ];
			if ( aspectRatio >= potentialRatio.ratio ) {
				// Evaluate the difference between actual aspect ratio and closest match.
				// If the difference is too big, do not scale the embed according to aspect ratio.
				const ratioDiff = aspectRatio - potentialRatio.ratio;
				if ( ratioDiff > 0.1 ) {
					// No close aspect ratio match found.
					return removeAspectRatioClasses( existingClassNames );
				}
				// Close aspect ratio match found.
				return classnames(
					removeAspectRatioClasses( existingClassNames ),
					potentialRatio.className,
					'wp-has-aspect-ratio'
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
 * @param {Function} onReplace Function to call with the created fallback block.
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
 * @param {string} title The block's title, e.g. Twitter.
 * @param {Object} currentClassNames The block's current class names.
 * @param {boolean} isResponsive Boolean indicating if the block supports responsive content.
 * @param {boolean} allowResponsive Apply responsive classes to fixed size content.
 * @return {Object} Attributes and values.
 */
export const getAttributesFromPreview = memoize(
	(
		preview,
		title,
		currentClassNames,
		isResponsive,
		allowResponsive = true
	) => {
		if ( ! preview ) {
			return {};
		}

		const attributes = {};
		// Some plugins only return HTML with no type info, so default this to 'rich'.
		let { type = 'rich' } = preview;
		// If we got a provider name from the API, use it for the slug, otherwise we use the title,
		// because not all embed code gives us a provider name.
		const { html, provider_name: providerName } = preview;
		const providerNameSlug = kebabCase(
			( providerName || title ).toLowerCase()
		);

		if ( isFromWordPress( html ) ) {
			type = WP_EMBED_TYPE;
		}

		if ( html || 'photo' === type ) {
			attributes.type = type;
			attributes.providerNameSlug = providerNameSlug;
		}

		attributes.className = getClassNames(
			html,
			currentClassNames,
			isResponsive && allowResponsive
		);

		return attributes;
	}
);
