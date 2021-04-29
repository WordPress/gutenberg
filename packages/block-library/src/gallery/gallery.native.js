/**
 * External dependencies
 */
import { View } from 'react-native';
import { isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import { defaultColumnsNumber } from './shared';
import styles from './v1/gallery-styles.scss';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	BlockCaption,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useState, useEffect } from '@wordpress/element';
import { mediaUploadSync } from '@wordpress/react-native-bridge';
import { useSelect } from '@wordpress/data';
import { WIDE_ALIGNMENTS } from '@wordpress/components';

const TILE_SPACING = 8;

// we must limit displayed columns since readable content max-width is 580px
const MAX_DISPLAYED_COLUMNS = 4;
const MAX_DISPLAYED_COLUMNS_NARROW = 2;

export const Gallery = ( props ) => {
	const [ isCaptionSelected, setIsCaptionSelected ] = useState( false );
	useEffect( mediaUploadSync, [] );

	const isRTL = useSelect( ( select ) => {
		return !! select( 'core/block-editor' ).getSettings().isRTL;
	}, [] );

	const { mediaPlaceholder, attributes, isNarrow } = props;

	const {
		imageCount,
		align,
		columns = defaultColumnsNumber( imageCount ),
		imageCrop,
	} = attributes;

	const displayedColumns = Math.min(
		columns,
		isNarrow ? MAX_DISPLAYED_COLUMNS_NARROW : MAX_DISPLAYED_COLUMNS
	);

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'blocks-gallery-grid',
		},
		{
			contentResizeMode: 'stretch',
			allowedBlocks: [ 'core/image' ],
			orientation: 'horizontal',
			renderAppender: false,
			numColumns: displayedColumns,
			marginHorizontal: TILE_SPACING,
			marginVertical: TILE_SPACING,
		}
	);

	const isFullWidth = align === WIDE_ALIGNMENTS.alignments.full;

	return (
		<View style={ [ isFullWidth && styles.fullWidth ] }>
			<View { ...innerBlocksProps } />
			{ mediaPlaceholder }
		</View>
	);
};

export default Gallery;
