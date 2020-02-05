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
import { Toolbar, ToolbarButton } from '@wordpress/components';
import { withViewportMatch } from '@wordpress/viewport';
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
	isDescendantOfParentSelected,
	columnsContainerSettings,
	isMobile,
} ) {
	const { verticalAlignment } = attributes;
	const {
		columnsInRow = 1,
		columnsContainerWidth,
	} = columnsContainerSettings;

	const columnContainerBaseWidth = styles[ 'column-container-base' ].maxWidth;
	const containerMaxWidth = styles[ 'columns-container' ].maxWidth;

	const containerWidth = columnsContainerWidth || containerMaxWidth;

	const minWidth = Math.min( containerWidth, columnContainerBaseWidth );
	const columnBaseWidth = minWidth / columnsInRow;

	const applyBlockStyle = ( placeholder = false ) => {
		if ( isMobile ) {
			return;
		}

		const pullWidth = ( name ) =>
			( styles[ `column-${ name }-margin` ] || {} ).width || 0;

		let width = columnBaseWidth;

		if ( isParentSelected ) {
			width -= pullWidth(
				placeholder ? 'placeholder-selected' : 'parent-selected'
			);
		} else if ( isSelected && ! placeholder ) {
			width -= ! hasChildren
				? pullWidth( 'selected' )
				: pullWidth( 'descendant-selected' );
		} else if ( isDescendantOfParentSelected ) {
			if ( placeholder ) {
				width -= pullWidth( 'selected' );
			} else {
				width += pullWidth( 'descendant-selected' );
			}
		} else if ( placeholder ) {
			width -=
				columnsInRow === 1
					? pullWidth( 'parent-selected' )
					: pullWidth( 'placeholder-multicol' );
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
					{
						...styles.marginVerticalDense,
						...styles.marginHorizontalNone,
					},
				] }
			>
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
			<View style={ applyBlockStyle() }>
				<InnerBlocks
					renderAppender={
						isSelected && InnerBlocks.ButtonBlockAppender
					}
				/>
			</View>
		</>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockParents,
			getBlockCount,
			getBlockRootClientId,
			getSelectedBlockClientId,
			getBlockListSettings,
		} = select( 'core/block-editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const isSelected = selectedBlockClientId === clientId;

		const parentId = getBlockRootClientId( clientId );
		const hasChildren = getBlockCount( clientId );

		const columnsContainerSettings = getBlockListSettings( parentId );

		const isParentSelected =
			selectedBlockClientId && selectedBlockClientId === parentId;

		const selectedParents = selectedBlockClientId
			? getBlockParents( selectedBlockClientId )
			: [];
		const isDescendantOfParentSelected = selectedParents.includes(
			parentId
		);

		return {
			hasChildren,
			isParentSelected,
			isSelected,
			columnsContainerSettings,
			isDescendantOfParentSelected,
		};
	} ),
	withViewportMatch( { isMobile: '< mobile' } ),
	withPreferredColorScheme,
] )( ColumnEdit );
