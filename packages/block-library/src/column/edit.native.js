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
	isMobile,
	columnsSettings,
} ) {
	const { verticalAlignment } = attributes;
	const { columnsInRow, width: columnsContainerWidth } = columnsSettings;

	const containerMaxWidth = styles[ 'columns-container' ].maxWidth;

	const containerWidth = columnsContainerWidth || containerMaxWidth;

	const minWidth = Math.min( containerWidth, containerMaxWidth );
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
				{ isParentSelected && (
					<InnerBlocks.ButtonBlockAppender showSeparator />
				) }
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

		return {
			hasChildren,
			isParentSelected,
			isSelected,
			isDescendantOfParentSelected,
			isAncestorSelected,
		};
	} ),
	withViewportMatch( { isMobile: '< mobile' } ),
	withPreferredColorScheme,
] )( ColumnEditWrapper );
