/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { url, caption, type, providerNameSlug, thumbnail } = attributes;

	if ( ! url ) {
		return null;
	}

	const className = clsx( 'wp-block-embed', {
		[ `is-type-${ type }` ]: type,
		[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
		[ `wp-block-embed-${ providerNameSlug }` ]: providerNameSlug,
	} );

	const blockProps = useBlockProps.save( { className } );

	if ( thumbnail ) {
		blockProps[ 'data-thumbnail' ] = thumbnail;
	}

	const showThumbnail = thumbnail && 'video' === type;

	return (
		<figure { ...blockProps }>
			<div className="wp-block-embed__wrapper">
				{ `\n${ url }\n` /* URL needs to be on its own line. */ }
				{ showThumbnail && (
					<button
						type="button"
						className="wp-block-embed__thumbnail-overlay"
					>
						<img
							src={ thumbnail }
							alt=""
							className="wp-block-embed__thumbnail-image"
						/>
						<div className="wp-block-embed__play-indicator" />
					</button>
				) }
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
