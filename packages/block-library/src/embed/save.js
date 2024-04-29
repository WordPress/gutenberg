/**
 * External dependencies
 */
import classnames from 'classnames/dedupe';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { ASPECT_RATIOS } from './constants';

export default function save( { attributes } ) {
	const { url, caption, type, providerNameSlug, aspectRatio } = attributes;

	if ( ! url ) {
		return null;
	}

	const ratioData = ASPECT_RATIOS.find(
		( element ) => element.ratio === aspectRatio
	);
	const aspectRatioClassname = ratioData ? ratioData.className : false;

	const className = classnames( 'wp-block-embed', {
		[ `is-type-${ type }` ]: type,
		[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
		[ `wp-block-embed-${ providerNameSlug }` ]: providerNameSlug,
		[ `${ aspectRatioClassname }` ]: aspectRatioClassname,
		'wp-has-aspect-ratio': aspectRatioClassname,
	} );

	return (
		<figure { ...useBlockProps.save( { className } ) }>
			<div className="wp-block-embed__wrapper">
				{ `\n${ url }\n` /* URL needs to be on its own line. */ }
			</div>
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content
					className={ __experimentalGetElementClassName( 'caption' ) }
					tagName="figcaption"
					value={ caption }
				/>
			) }
		</figure>
	);
}
