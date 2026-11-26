import clsx from 'clsx';
import memoize from 'memize';
import { renderToString } from '@wordpress/element';
import {
	createBlock,
	getBlockType,
	getBlockVariations,
	type Block,
} from '@wordpress/blocks';
import { getAuthority } from '@wordpress/url';
import { kebabCase } from '@wordpress/kebab-case';
import metadata from './block.json';
import { ASPECT_RATIOS, WP_EMBED_TYPE } from './constants';
import type {
	EmbedAttributes,
	EmbedPreviewData,
	EmbedVariation,
	UpgradeableEmbedProps,
} from './types';

const { name: DEFAULT_EMBED_BLOCK } = metadata;

/**
 * Returns the embed block's information by matching the provided service provider
 *
 * @param provider The embed block's provider
 * @return The embed block's information
 */
export const getEmbedInfoByProvider = (
	provider?: string
): EmbedVariation | undefined => {
	if ( ! provider ) {
		return;
	}

	// Embed variations declare `patterns` and icon descriptors, which
	// `BlockVariation` doesn't.
	return (
		getBlockVariations( DEFAULT_EMBED_BLOCK ) as
			EmbedVariation[] | undefined
	 )?.find(
		( { name, attributes } ) =>
			name === provider || attributes?.providerNameSlug === provider
	);
};

/**
 * Returns true if any of the regular expressions match the URL.
 *
 * @param url      The URL to test.
 * @param patterns The list of regular expressions to test against.
 * @return True if any of the regular expressions match the URL.
 */
export const matchesPatterns = (
	url: string,
	patterns: RegExp[] = []
): boolean => patterns.some( ( pattern ) => url.match( pattern ) );

/**
 * Finds the block variation that should be used for the URL,
 * based on the provided URL and the variation's patterns.
 *
 * @param url The URL to test.
 * @return The block variation that should be used for this URL
 */
export const findMoreSuitableBlock = (
	url?: string
): EmbedVariation | undefined => {
	if ( ! url ) {
		return;
	}

	// Embed variations declare `patterns` and icon descriptors, which
	// `BlockVariation` doesn't.
	return (
		getBlockVariations( DEFAULT_EMBED_BLOCK ) as
			EmbedVariation[] | undefined
	 )?.find( ( { patterns } ) => matchesPatterns( url, patterns ) );
};

/**
 * Rewrites `x.com` URLs to `twitter.com` as a workaround while the
 * WordPress oEmbed registry lacks an X provider. See: https://core.trac.wordpress.org/ticket/59142.
 *
 * @param url The URL to rewrite.
 * @return The (possibly) rewritten URL.
 */
export function rewriteXToTwitter< T extends string | undefined >( url: T ): T {
	if ( ! url || getAuthority( url ) !== 'x.com' ) {
		return url;
	}
	const rewritten = new URL( url );
	rewritten.host = 'twitter.com';
	// The rewritten URL is a string whenever the input was one.
	return rewritten.toString() as T;
}

export const isFromWordPress = ( html?: string ): boolean | '' | undefined =>
	html && html.includes( 'class="wp-embedded-content"' );

export const getPhotoHtml = ( photo: EmbedPreviewData ): string => {
	// If full image url not found use thumbnail.
	const imageUrl = photo.url || photo.thumbnail_url;

	// 100% width for the preview so it fits nicely into the document, some "thumbnails" are
	// actually the full size photo.
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
 * @param props                   The block's props.
 * @param [attributesFromPreview] Attributes generated from the block's most up to date preview.
 * @return A more suitable embed block if one exists.
 */
export const createUpgradedEmbedBlock = (
	props: UpgradeableEmbedProps,
	attributesFromPreview: EmbedAttributes = {}
): Block | undefined => {
	const { preview, attributes = {} } = props;
	const { url, providerNameSlug, type, ...restAttributes } = attributes;

	if ( ! url || ! getBlockType( DEFAULT_EMBED_BLOCK ) ) {
		return;
	}

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
		// Variations matched by URL patterns are embed providers, which
		// always declare their attributes.
		( matchedBlock.attributes!.providerNameSlug !== providerNameSlug ||
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
 * Determine if the block already has an aspect ratio class applied.
 *
 * @param existingClassNames Existing block classes.
 * @return True or false if the classnames contain an aspect ratio class.
 */
export const hasAspectRatioClass = ( existingClassNames?: string ): boolean => {
	if ( ! existingClassNames ) {
		return false;
	}
	return ASPECT_RATIOS.some( ( { className } ) =>
		existingClassNames.includes( className )
	);
};

/**
 * Removes all previously set aspect ratio related classes and return the rest
 * existing class names.
 *
 * @param existingClassNames Any existing class names.
 * @return The class names without any aspect ratio related class.
 */
export const removeAspectRatioClasses = < T extends string | undefined >(
	existingClassNames: T
): T => {
	if ( ! existingClassNames ) {
		// Avoids extraneous work and also, by returning the same value as
		// received, ensures the post is not dirtied by a change of the block
		// attribute from `undefined` to an empty string.
		return existingClassNames;
	}
	const aspectRatioClassNames = ASPECT_RATIOS.reduce(
		( accumulator, { className } ) => {
			accumulator.push( className );
			return accumulator;
		},
		[ 'wp-has-aspect-ratio' ]
	);
	let outputClassNames: string = existingClassNames;
	for ( const className of aspectRatioClassNames ) {
		outputClassNames = outputClassNames.replace( className, '' );
	}
	// Trimming keeps a defined class name a string.
	return outputClassNames.trim() as T;
};

/**
 * Checks if HTML already contains responsive aspect ratio styling.
 * Some embed providers (like Flickr) include their own responsive wrapper
 * with padding-bottom or padding-top percentages for aspect ratio.
 *
 * @param html The embed HTML to check.
 * @return True if the HTML already has responsive styling.
 */
export function hasInlineResponsivePadding( html?: string ): boolean {
	// Check for padding-bottom or padding-top with percentage values in style attributes
	// This pattern matches: padding-bottom: 56.25%; or padding-top: 50%; etc.
	const paddingPattern = /padding-(top|bottom)\s*:\s*[\d.]+%/i;
	// `RegExp#test` converts `undefined` to the string "undefined".
	return paddingPattern.test( html as string );
}

/**
 * Returns class names with any relevant responsive aspect ratio names.
 *
 * @param html               The preview HTML that possibly contains an iframe with width and height set.
 * @param existingClassNames Any existing class names.
 * @param allowResponsive    If the responsive class names should be added, or removed.
 * @return Deduped class names.
 */
export function getClassNames(
	html?: string,
	existingClassNames?: string,
	allowResponsive: boolean = true
): string | undefined {
	if ( ! allowResponsive ) {
		return removeAspectRatioClasses( existingClassNames );
	}

	// If the embed HTML already contains responsive wrapper styling (like Flickr),
	// don't add our own aspect ratio classes to avoid double padding.
	if ( hasInlineResponsivePadding( html ) ) {
		return removeAspectRatioClasses( existingClassNames );
	}

	const previewDocument = document.implementation.createHTMLDocument( '' );
	// Assigning `undefined` sets the text "undefined", as the browser converts it.
	previewDocument.body.innerHTML = html as string;
	const iframe = previewDocument.body.querySelector( 'iframe' );

	// If we have a fixed aspect iframe, and it's a responsive embed block.
	if ( iframe && iframe.height && iframe.width ) {
		const aspectRatio = Number(
			( Number( iframe.width ) / Number( iframe.height ) ).toFixed( 2 )
		);
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
				return clsx(
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
 * @param url       The URL that could not be embedded.
 * @param onReplace Function to call with the created fallback block.
 */
export function fallback(
	url: string | undefined,
	onReplace: ( block: Block ) => void
): void {
	const link = <a href={ url }>{ url }</a>;
	onReplace(
		createBlock( 'core/paragraph', { content: renderToString( link ) } )
	);
}

/***
 * Gets block attributes based on the preview and responsive state.
 *
 * @param preview The preview data.
 * @param title The block's title, e.g. Twitter.
 * @param currentClassNames The block's current class names.
 * @param isResponsive Boolean indicating if the block supports responsive content.
 * @param allowResponsive Apply responsive classes to fixed size content.
 * @return Attributes and values.
 */
export const getAttributesFromPreview = memoize(
	(
		preview: EmbedPreviewData | undefined,
		title: string,
		currentClassNames: string | undefined,
		isResponsive: boolean | undefined,
		allowResponsive: boolean | undefined = true
	): EmbedAttributes => {
		if ( ! preview ) {
			return {};
		}

		const attributes: EmbedAttributes = {};
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

		if ( html ) {
			attributes.type = type;
			attributes.providerNameSlug = providerNameSlug;
		}

		// Aspect ratio classes are removed when the embed URL is updated.
		// If the embed already has an aspect ratio class, that means the URL has not changed.
		// Which also means no need to regenerate it with getClassNames.
		if ( hasAspectRatioClass( currentClassNames ) ) {
			return attributes;
		}

		attributes.className = getClassNames(
			html,
			currentClassNames,
			isResponsive && allowResponsive
		);

		return attributes;
	}
);

/**
 * Returns the attributes derived from the preview, merged with the current attributes.
 *
 * @param currentAttributes The current attributes of the block.
 * @param preview           The preview data.
 * @param title             The block's title, e.g. Twitter.
 * @param isResponsive      Boolean indicating if the block supports responsive content.
 * @return Merged attributes.
 */
export const getMergedAttributesWithPreview = (
	currentAttributes: EmbedAttributes,
	preview: EmbedPreviewData | undefined,
	title: string,
	isResponsive: boolean | undefined
): EmbedAttributes => {
	const { allowResponsive, className } = currentAttributes;

	return {
		...currentAttributes,
		...getAttributesFromPreview(
			preview,
			title,
			className,
			isResponsive,
			allowResponsive
		),
	};
};
