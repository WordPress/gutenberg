/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Caption } from '../utils/caption';

export default function Gallery( props ) {
	const {
		attributes,
		isSelected,
		setAttributes,
		insertBlocksAfter,
		blockProps,
		__unstableLayoutClassNames: layoutClassNames,
		isContentLocked,
		multiGallerySelection,
	} = props;

	const { align, columns, imageCrop } = attributes;

	return (
		<figure
			{ ...blockProps }
			className={ clsx(
				blockProps.className,
				layoutClassNames,
				'blocks-gallery-grid',
				{
					[ `align${ align }` ]: align,
					[ `columns-${ columns }` ]: columns !== undefined,
					[ `columns-default` ]: columns === undefined,
					'is-cropped': imageCrop,
				}
			) }
		>
			{ blockProps.children }
			<Caption
				attributes={ attributes }
				setAttributes={ setAttributes }
				isSelected={ isSelected }
				insertBlocksAfter={ insertBlocksAfter }
				showToolbarButton={
					! multiGallerySelection && ! isContentLocked
				}
				className="blocks-gallery-caption"
				label={ __( 'Gallery caption text' ) }
				placeholder={ __( 'Add gallery caption' ) }
			/>
		</figure>
	);
}
