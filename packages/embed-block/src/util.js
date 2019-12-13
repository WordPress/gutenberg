/**
 * Internal dependencies
 */
import { ASPECT_RATIOS } from './constants';

/**
 * External dependencies
 */
import { kebabCase, toLower, includes } from 'lodash';
import classnames from 'classnames/dedupe';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { renderToString } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

export const isFromWordPress = ( html ) => {
	return includes( html, 'class="wp-embedded-content"' );
};

export const getPhotoHtml = ( photo ) => {
	// 100% width for the preview so it fits nicely into the document, some "thumbnails" are
	// actually the full size photo. If thumbnails not found, use full image.
	const imageUrl = photo.thumbnail_url ? photo.thumbnail_url : photo.url;
	const photoPreview = (
		<p>
			<img src={ imageUrl } alt={ photo.title } width="100%" />
		</p>
	);
	return renderToString( photoPreview );
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
	existingClassNames = '',
	allowResponsive = true
) {
	if ( ! allowResponsive ) {
		// Remove all of the aspect ratio related class names.
		const aspectRatioClassNames = {
			'wp-has-aspect-ratio': false,
		};
		for (
			let ratioIndex = 0;
			ratioIndex < ASPECT_RATIOS.length;
			ratioIndex++
		) {
			const aspectRatioToRemove = ASPECT_RATIOS[ ratioIndex ];
			aspectRatioClassNames[ aspectRatioToRemove.className ] = false;
		}
		return classnames( existingClassNames, aspectRatioClassNames );
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
				return classnames( existingClassNames, {
					[ potentialRatio.className ]: allowResponsive,
					'wp-has-aspect-ratio': allowResponsive,
				} );
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
			toLower( '' !== providerName ? providerName : title )
		);

		if ( isFromWordPress( html ) ) {
			type = 'wp-embed';
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
