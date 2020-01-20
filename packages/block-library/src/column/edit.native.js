
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
	withColors,
} from '@wordpress/block-editor';
import { withViewportMatch } from '@wordpress/viewport';
/**
 * Internal dependencies
 */
import styles from './editor.scss';

function ColumnEdit( {
	hasInnerBlocks,
	isSelected,
	getStylesFromColorScheme,
	isParentSelected,
	isDescendantOfParentSelected,
	columnsCount,
	columnsContainerWidth,
	isSmallScreen,
	isLargeScreen,
	isMediumScreen,
} ) {
	const columnContainerBaseWidth = styles[ 'column-container-base' ].maxWidth;

	const containerWidth = columnsContainerWidth || styles[ 'columns-container' ].maxWidth;

	const containerMaxWidth = styles[ 'columns-container' ].maxWidth;
	const minWidth = Math.min( containerWidth, columnContainerBaseWidth );

	const getColumnsInRow = ( columnsNumber ) => {
		if ( isSmallScreen || minWidth < 480 ) {
			return 1;
		}
		if ( isMediumScreen && ( ! isLargeScreen || minWidth <= containerMaxWidth ) ) {
			return 2;
		}
		return columnsNumber;
	};

	const columnsInRow = getColumnsInRow( columnsCount );
	const columnBaseWidth = minWidth / columnsInRow;

	if ( ! isSelected && ! hasInnerBlocks ) {
		return (
			<View style={ [
				! isParentSelected && getStylesFromColorScheme( styles.columnPlaceholder, styles.columnPlaceholderDark ),
				! isSmallScreen ? { width: columnBaseWidth - ( isParentSelected ? 24 : isDescendantOfParentSelected ? 28 : columnsInRow === 1 ? 12 : 32 ) } : {},
				{ ...styles.marginVerticalDense, ...styles.marginHorizontalNone },
			] } >
				{ isParentSelected && <InnerBlocks.ButtonBlockAppender /> }
			</View>
		);
	}

	return (
		<View style={ ! isSmallScreen ? { maxWidth: columnBaseWidth, width: columnBaseWidth - ( isParentSelected ? 12 : isSelected ? ! hasInnerBlocks ? 28 : 4 : isDescendantOfParentSelected ? -4 : 0 ) } : {} } >
			<InnerBlocks
				renderAppender={ isSelected && InnerBlocks.ButtonBlockAppender }
			/>
		</View>
	);
}

export default compose( [
	withColors( 'backgroundColor' ),
	withSelect( ( select, { clientId } ) => {
		const {
			getBlock,
			getBlockParents,
			getSelectedBlockClientId,
		} = select( 'core/block-editor' );

		const block = getBlock( clientId );

		const selectedBlockClientId = getSelectedBlockClientId();
		const isSelected = selectedBlockClientId === clientId;

		const parents = getBlockParents( clientId, true );
		const parentId = parents[ 0 ] || '';

		const parentBlock = getBlock( parentId );
		const columnsCount = parentBlock && parentBlock.innerBlocks.length;
		const columnsContainerWidth = parentBlock && parentBlock.attributes.width;

		const isParentSelected = selectedBlockClientId && selectedBlockClientId === parentId;

		const selectedParents = selectedBlockClientId ? getBlockParents( selectedBlockClientId ) : [];
		const isDescendantOfParentSelected = selectedParents.includes( parentId );

		return {
			hasInnerBlocks: !! ( block && block.innerBlocks.length ),
			isParentSelected,
			isSelected,
			columnsCount,
			columnsContainerWidth,
			isDescendantOfParentSelected,
		};
	} ),
	withViewportMatch( { isSmallScreen: '< small', isLargeScreen: '>= large', isMediumScreen: '>= small' } ),
	withPreferredColorScheme,
] )( ColumnEdit );
