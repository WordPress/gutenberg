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
	useInnerBlocksProps,
	__experimentalGetElementClassName,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getColorSupportAttributes } from './utils';

export default function saveWithInnerBlocks( { attributes } ) {
	const {
		caption,
		showNumbers,
		showTracklist,
		showArtists,
		showTrackLength,
	} = attributes;

	const colorProps = getColorClassesAndStyles(
		getColorSupportAttributes( attributes )
	);
	const blockProps = useBlockProps.save( colorProps );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );
	return (
		<figure { ...innerBlocksProps }>
			<ol
				className={ clsx( 'wp-block-playlist__tracklist', {
					'wp-block-playlist__tracklist-is-hidden': ! showTracklist,
					'wp-block-playlist__tracklist-artist-is-hidden':
						! showArtists,
					'wp-block-playlist__tracklist-length-is-hidden':
						! showTrackLength,
					'wp-block-playlist__tracklist-show-numbers': showNumbers,
				} ) }
			>
				{ innerBlocksProps.children }
			</ol>
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content
					tagName="figcaption"
					className={ __experimentalGetElementClassName( 'caption' ) }
					value={ caption }
				/>
			) }
		</figure>
	);
}
