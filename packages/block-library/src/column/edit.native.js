
/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import {
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
} from '@wordpress/block-editor';
import {
	Toolbar,
	ToolbarButton,
} from '@wordpress/components';
import { withViewportMatch } from '@wordpress/viewport';
/**
 * Internal dependencies
 */
import styles from './editor.scss';

function ColumnEdit( {
	attributes,
	setAttributes,
	hasInnerBlocks,
	isSelected,
	getStylesFromColorScheme,
	isParentSelected,
	isDescendantOfParentSelected,
	columnsCount,
	columnsContainerWidth,
	isMobile,
} ) {
	const { verticalAlignment } = attributes;

	const columnContainerBaseWidth = styles[ 'column-container-base' ].maxWidth;
	const containerMaxWidth = styles[ 'columns-container' ].maxWidth;

	const containerWidth = columnsContainerWidth || containerMaxWidth;

	const minWidth = Math.min( containerWidth, columnContainerBaseWidth );

	const getColumnsInRow = ( columnsNumber ) => {
		if ( minWidth < 480 ) {
			return 1;
		}
		if ( minWidth >= 480 && minWidth < 768 ) {
			return 2;
		}
		return columnsNumber;
	};

	const columnsInRow = getColumnsInRow( columnsCount );
	const columnBaseWidth = minWidth / columnsInRow;

	const applyColumnPlaceholderStyle = () => {
		if ( isMobile ) {
			return;
		}

		let width = columnBaseWidth;

		if ( isParentSelected ) {
			width -= 24;
		} else if ( isDescendantOfParentSelected ) {
			width -= 28;
		} else {
			width -= ( columnsInRow === 1 ? 12 : 32 );
		}

		return { width };
		// return { width: columnBaseWidth - ( isParentSelected ? 24 : isDescendantOfParentSelected ? 28 : columnsInRow === 1 ? 12 : 32 ) }
	};

	const applyColumnBlockStyle = () => {
		if ( isMobile ) {
			return;
		}

		let width = columnBaseWidth;

		if ( isParentSelected ) {
			width -= 12;
		} else if ( isSelected ) {
			width -= ( ! hasInnerBlocks ? 28 : 4 );
		} else if ( isDescendantOfParentSelected ) {
			width += 4;
		}

		return { width };
		// return { width: columnBaseWidth - ( isParentSelected ? 12 : isSelected ? ! hasInnerBlocks ? 28 : 4 : isDescendantOfParentSelected ? -4 : 0 ) }
	};

	const updateAlignment = ( alignment ) => {
		setAttributes( { verticalAlignment: alignment } );
	};

	if ( ! isSelected && ! hasInnerBlocks ) {
		return (
			<View style={ [
				! isParentSelected && getStylesFromColorScheme( styles.columnPlaceholder, styles.columnPlaceholderDark ),
				applyColumnPlaceholderStyle(),
				{ ...styles.marginVerticalDense, ...styles.marginHorizontalNone },
			] } >
				{ isParentSelected && <InnerBlocks.ButtonBlockAppender /> }
			</View>
		);
	}

	return (
		<>
			<BlockControls>
				<Toolbar>
					<ToolbarButton
						title={ __( 'ColumnButton' ) }
						icon="columns"
						onClick={ () => {} }
					/>
				</Toolbar>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
					isCollapsed={ false }
				/>
			</BlockControls>
			<View style={ applyColumnBlockStyle() } >
				<InnerBlocks
					renderAppender={ isSelected && InnerBlocks.ButtonBlockAppender }
				/>
			</View>
		</>
	);
}

export default compose( [
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
	withViewportMatch( { isMobile: '< mobile' } ),
	withPreferredColorScheme,
] )( ColumnEdit );
