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
		width: columnsContainerWidth,
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

		const pullWidths = ( names ) =>
			names.map(
				( name ) =>
					( styles[ `column-${ name }-margin` ] || {} ).width || 0
			);

		let width = columnBaseWidth;
		const names = [
			'selected',
			'parent-selected',
			'descendant-selected',
			'placeholder-selected',
		];
		const widths = pullWidths( names );
		const [ , parentSelected, , placeholderSelected ] = widths;

		if ( isParentSelected ) {
			width -= placeholder ? placeholderSelected : parentSelected;
			return { width };
		}

		const [ selected, , descendantSelected ] = widths;

		if ( placeholder ) {
			if ( isDescendantOfParentSelected ) {
				width -= selected;
			} else {
				width -=
					columnsInRow === 1 ? parentSelected : placeholderSelected;
				if ( ! hasChildren ) width -= 4;
			}
		} else if ( isSelected ) {
			width -= ! hasChildren ? selected : descendantSelected;
		} else if ( isDescendantOfParentSelected ) {
			width += descendantSelected;
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
] )( ColumnEditWrapper );
