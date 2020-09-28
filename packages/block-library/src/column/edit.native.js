/**
 * External dependencies
 */
import { View, Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import {
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	FooterMessageControl,
	ALIGNMENT_BREAKPOINTS,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './editor.scss';
import ColumnsPreview from './column-preview';
import { getColumnWidths } from '../columns/utils';

const MARGIN = 16;

function ColumnEdit( {
	attributes,
	setAttributes,
	hasChildren,
	isSelected,
	getStylesFromColorScheme,
	isParentSelected,
	contentStyle,
	columns,
	columnCount,
	selectedColumnIndex,
	parentAlignment,
	clientId,
	isDeepParentSelected,
	parentsOfParents,
} ) {
	const { verticalAlignment } = attributes;
	const { width: screenWidth } = Dimensions.get( 'window' );

	const updateAlignment = ( alignment ) => {
		setAttributes( { verticalAlignment: alignment } );
	};

	useEffect( () => {
		if ( ! verticalAlignment && parentAlignment ) {
			updateAlignment( parentAlignment );
		}
	}, [] );

	const onWidthChange = ( width ) => {
		setAttributes( {
			width,
		} );
	};

	const columnWidths = Object.values(
		getColumnWidths( columns, columnCount )
	);

	if ( ! isSelected && ! hasChildren ) {
		const shouldHaveMargin = isParentSelected && parentsOfParents;
		return (
			<View
				style={ [
					! isParentSelected &&
						getStylesFromColorScheme(
							styles.columnPlaceholder,
							styles.columnPlaceholderDark
						),
					styles.columnPlaceholderNotSelected,
					contentStyle[ clientId ],
					screenWidth < ALIGNMENT_BREAKPOINTS.mobile &&
						! isDeepParentSelected && {
							marginLeft:
								! isParentSelected || shouldHaveMargin
									? -MARGIN
									: 0,
							maxWidth:
								screenWidth +
								( shouldHaveMargin ? -MARGIN : 0 ),
							width:
								screenWidth +
								( shouldHaveMargin ? -MARGIN : 0 ),
						},
				] }
			/>
		);
	}

	return (
		<>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Column settings' ) }>
					<RangeControl
						label={ __( 'Width' ) }
						min={ 1 }
						max={ 100 }
						value={ columnWidths[ selectedColumnIndex ] }
						onChange={ onWidthChange }
						toFixed={ 1 }
						rangePreview={
							<ColumnsPreview
								columnWidths={ columnWidths }
								selectedColumnIndex={ selectedColumnIndex }
							/>
						}
					/>
				</PanelBody>
				<PanelBody>
					<FooterMessageControl
						label={ __(
							'Note: Column layout may vary between themes and screen sizes'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<View
				style={ [
					isSelected && hasChildren && styles.innerBlocksBottomSpace,
					contentStyle[ clientId ],
					isSelected && {
						marginLeft: 0,
					},
				] }
			>
				<InnerBlocks
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
			getBlocks,
			getBlockOrder,
			getBlockAttributes,
			getBlockParents,
		} = select( 'core/block-editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const isSelected = selectedBlockClientId === clientId;

		const parentId = getBlockRootClientId( clientId );
		const hasChildren = !! getBlockCount( clientId );

		const isParentSelected =
			selectedBlockClientId && selectedBlockClientId === parentId;

		const parentsOfParents = !! getBlockParents( parentId ).length;

		const getDeepParentSelected = ( columnParentId, foo = false ) => {
			if ( getBlockParents( columnParentId ).length === 0 ) {
				return foo;
			}

			const newParentId = getBlockRootClientId( columnParentId );
			const a =
				foo ||
				( selectedBlockClientId &&
					selectedBlockClientId === newParentId );

			return getDeepParentSelected( newParentId, a );
		};

		const isDeepParentSelected = getDeepParentSelected( parentId );

		const blockOrder = getBlockOrder( parentId );

		const selectedColumnIndex = blockOrder.indexOf( clientId );
		const columnCount = getBlockCount( parentId );
		const columns = getBlocks( parentId );

		const parentAlignment = getBlockAttributes( parentId )
			?.verticalAlignment;

		return {
			hasChildren,
			isParentSelected,
			isSelected,
			selectedColumnIndex,
			columns,
			columnCount,
			parentAlignment,
			selectedBlockClientId,
			parentId,
			isDeepParentSelected,
			parentsOfParents,
		};
	} ),
	withPreferredColorScheme,
] )( ColumnEditWrapper );
