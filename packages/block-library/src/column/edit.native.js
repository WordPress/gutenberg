/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import {
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
} from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import styles from './editor.scss';

function ColumnEdit( {
	attributes,
	setAttributes,
	hasChildren,
	isSelected,
	getStylesFromColorScheme,
	isParentSelected,
	columnsSettings,
} ) {
	const { verticalAlignment } = attributes;
	const { columnsInRow, width: columnsContainerWidth } = columnsSettings;

	const containerMaxWidth = styles[ 'columns-container' ].maxWidth;

	const containerWidth = columnsContainerWidth || containerMaxWidth;

	const minWidth = Math.min( containerWidth, containerMaxWidth );
	const columnBaseWidth = minWidth / Math.max( 1, columnsInRow );

	const applyBlockStyle = () => {
		let width = columnBaseWidth;
		//TODO: 6 is spacing between Column, find a way to pass it better and verify if 6 is proper value
		if ( columnsInRow > 1 ) {
			// For first and last block we don't need margin on both sides, that's why we subtract 2
			const margins =
				( columnsInRow * 2 - 2 ) * styles.columnMargin.marginLeft;
			width = ( minWidth - margins ) / Math.max( 1, columnsInRow );
		}

		return { width };
	};

	const updateAlignment = ( alignment ) => {
		setAttributes( { verticalAlignment: alignment } );
	};

	if ( ! isSelected && ! hasChildren ) {
		return (
			<View
				style={ [
					! isParentSelected &&
						getStylesFromColorScheme(
							styles.columnPlaceholder,
							styles.columnPlaceholderDark
						),
					applyBlockStyle( true ),
					styles.columnMargin,
					styles.marginHorizontalNone,
				] }
			></View>
		);
	}

	return (
		<>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
					isCollapsed={ false }
				/>
			</BlockControls>
			<View style={ applyBlockStyle() }>
				<InnerBlocks
					flatListProps={ {
						scrollEnabled: false,
						style: { overflow: 'visible' },
					} }
					renderAppender={
						isSelected && InnerBlocks.ButtonBlockAppender
					}
				/>
			</View>
		</>
	);
}

function ColumnEditWrapper( props ) {
	const { verticalAlignment } = props.attributes;

	const getVerticalAlignmentRemap = ( alignment ) => {
		if ( ! alignment ) return styles.flexBase;
		return {
			...styles.flexBase,
			...styles[ `is-vertically-aligned-${ alignment }` ],
		};
	};

	return (
		<View style={ getVerticalAlignmentRemap( verticalAlignment ) }>
			<ColumnEdit { ...props } />
		</View>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockCount,
			getBlockRootClientId,
			getSelectedBlockClientId,
		} = select( 'core/block-editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const isSelected = selectedBlockClientId === clientId;

		const parentId = getBlockRootClientId( clientId );
		const hasChildren = !! getBlockCount( clientId );

		const isParentSelected =
			selectedBlockClientId && selectedBlockClientId === parentId;

		return {
			hasChildren,
			isParentSelected,
			isSelected,
		};
	} ),
	withPreferredColorScheme,
] )( ColumnEditWrapper );
