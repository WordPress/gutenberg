
/**
 * External dependencies
 */
import { View, Dimensions } from 'react-native';

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
	columnsCount,
	isSmallScreen,
	isLargeScreen,
	isMediumScreen,
} ) {
	const columnContainerBaseWidth = styles[ 'column-container-base' ].maxWidth;

	const screenWidth = Dimensions.get( 'window' ).width;
	const containerWidth = styles[ 'columns-container' ].maxWidth;
	const minWidth = Math.min( screenWidth, containerWidth );

	const getColumnsInRow = ( columnsNumber ) => {
		if ( isSmallScreen ) {
			return 1;
		}
		if ( isMediumScreen && ( ! isLargeScreen || minWidth <= containerWidth ) ) {
			return 2;
		}
		return columnsNumber;
	};

	const columnsInRow = getColumnsInRow( columnsCount );
	const columnBaseWidth = columnContainerBaseWidth / columnsInRow;
	console.log( columnBaseWidth, columnsInRow );

	if ( ! isSelected && ! hasInnerBlocks ) {
		return (
			<View style={ [
				getStylesFromColorScheme( styles.columnPlaceholder, styles.columnPlaceholderDark ),
				! isSmallScreen ? { width: columnBaseWidth - ( isParentSelected ? 24 : 32 ) } : {},
				{ ...styles.marginVerticalDense, ...styles.marginHorizontalNone },
			] } />
		);
	}

	return (
		<View style={ ! isSmallScreen ? { width: columnBaseWidth - ( isParentSelected ? 12 : 0 ) } : {} } >
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

		console.log( parentBlock );

		const isParentSelected = selectedBlockClientId && selectedBlockClientId === parentId;

		return {
			hasInnerBlocks: !! ( block && block.innerBlocks.length ),
			isParentSelected,
			isSelected,
			columnsCount,
		};
	} ),
	withViewportMatch( { isSmallScreen: '< small', isLargeScreen: '>= large', isMediumScreen: '>= small' } ),
	withPreferredColorScheme,
] )( ColumnEdit );
