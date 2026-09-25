import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { Caption } from '../utils/caption';
import { isGalleryFlexLayout } from './shared';

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

	const { align, columns, imageCrop, layout } = attributes;
	const isFlexLayout = isGalleryFlexLayout( layout );

	return (
		<figure
			{ ...blockProps }
			className={ clsx(
				blockProps.className,
				layoutClassNames,
				'blocks-gallery-grid',
				{
					[ `align${ align }` ]: align,
					[ `columns-${ columns }` ]:
						isFlexLayout && columns !== undefined,
					[ `columns-default` ]:
						isFlexLayout && columns === undefined,
					'is-cropped': isFlexLayout && imageCrop,
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
