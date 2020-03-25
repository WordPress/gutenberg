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
	isDescendantOfParentSelected,
	isDescendantSelected,
	isAncestorSelected,
	customBlockProps,
} ) {
	const { verticalAlignment } = attributes;
	const { columnsInRow, width: columnsContainerWidth } = customBlockProps;

	const containerMaxWidth = styles[ 'columns-container' ].maxWidth;

	const containerWidth = columnsContainerWidth || containerMaxWidth;

	const minWidth = Math.min( containerWidth, containerMaxWidth );
	const columnBaseWidth = minWidth / Math.max( 1, columnsInRow );

	const applyBlockStyle = ( placeholder = false ) => {
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
			'dashed-border',
		];
		const widths = pullWidths( names );
		const [
			emptyColumnSelected,
			parentSelected,
			columnSelected,
			placeholderParentSelected,
			dashedBorderWidth,
		] = widths;

		switch ( true ) {
			case isSelected:
				width = columnBaseWidth;
				width -= ! hasChildren
					? emptyColumnSelected
					: columnSelected + dashedBorderWidth;
				break;

			case isParentSelected:
				width -= placeholder
					? placeholderParentSelected
					: parentSelected;
				break;

			case isDescendantSelected:
				width = columnBaseWidth;
				break;

			case isDescendantOfParentSelected:
				width = columnBaseWidth;
				if ( ! hasChildren ) width -= emptyColumnSelected;
				break;

			case isAncestorSelected:
				width = columnBaseWidth;
				if ( ! hasChildren ) width -= parentSelected;
				break;

			case placeholder:
				width -=
					columnsInRow === 1
						? parentSelected
						: placeholderParentSelected;
				width -=
					columnSelected +
					( columnsInRow === 1 ? parentSelected : dashedBorderWidth );
				break;

			default:
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
		} = select( 'core/block-editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const isSelected = selectedBlockClientId === clientId;

		const parentId = getBlockRootClientId( clientId );
		const hasChildren = !! getBlockCount( clientId );

		const isParentSelected =
			selectedBlockClientId && selectedBlockClientId === parentId;

		const selectedParents = selectedBlockClientId
			? getBlockParents( selectedBlockClientId )
			: [];
		const isDescendantOfParentSelected = selectedParents.includes(
			parentId
		);

		const parents = getBlockParents( clientId, true );

		const isAncestorSelected =
			selectedBlockClientId && parents.includes( selectedBlockClientId );
		const isDescendantSelected = selectedParents.includes( clientId );

		return {
			hasChildren,
			isParentSelected,
			isSelected,
			isDescendantOfParentSelected,
			isAncestorSelected,
			isDescendantSelected,
		};
	} ),
	withPreferredColorScheme,
] )( ColumnEditWrapper );
