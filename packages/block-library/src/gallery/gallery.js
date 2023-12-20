/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { View } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import { Caption } from '../utils/caption';

export default function Gallery( props ) {
	const {
		attributes,
		isSelected,
		setAttributes,
		mediaPlaceholder,
		insertBlocksAfter,
		blockProps,
		__unstableLayoutClassNames: layoutClassNames,
		isContentLocked,
	} = props;

	const { align, columns, imageCrop } = attributes;

	return (
		<figure
			{ ...blockProps }
			className={ classnames(
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
			{ isSelected && ! blockProps.children && (
				<View className="blocks-gallery-media-placeholder-wrapper">
					{ mediaPlaceholder }
				</View>
			) }
			<Caption
				attributes={ attributes }
				setAttributes={ setAttributes }
				isSelected={ isSelected }
				insertBlocksAfter={ insertBlocksAfter }
				showToolbarButton={ ! isContentLocked }
				className="blocks-gallery-caption"
				label={ __( 'Gallery caption text' ) }
				placeholder={ __( 'Add gallery caption' ) }
			/>
		</figure>
	);
}
