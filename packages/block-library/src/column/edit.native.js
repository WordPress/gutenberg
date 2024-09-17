/**
 * External dependencies
 */
import { View, Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { useEffect, useState, useCallback } from '@wordpress/element';
import {
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
	InspectorControls,
	store as blockEditorStore,
	useSettings,
} from '@wordpress/block-editor';
import {
	PanelBody,
	FooterMessageControl,
	UnitControl,
	getValueAndUnit,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './editor.scss';
import ColumnsPreview from './column-preview';
import {
	getWidths,
	getWidthWithUnit,
	isPercentageUnit,
} from '../columns/utils';

function ColumnEdit( {
	attributes,
	setAttributes,
	hasChildren,
	isSelected,
	getStylesFromColorScheme,
	contentStyle,
	columns,
	selectedColumnIndex,
	parentAlignment,
	clientId,
	blockWidth,
} ) {
	if ( ! contentStyle ) {
		contentStyle = { [ clientId ]: {} };
	}

	const { verticalAlignment, width } = attributes;
	const { valueUnit = '%' } = getValueAndUnit( width ) || {};

	const screenWidth = Math.floor( Dimensions.get( 'window' ).width );

	const [ widthUnit, setWidthUnit ] = useState( valueUnit || '%' );

	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [ '%', 'px', 'em', 'rem', 'vw' ],
	} );

	const updateAlignment = ( alignment ) => {
		setAttributes( { verticalAlignment: alignment } );
	};

	useEffect( () => {
		setWidthUnit( valueUnit );
	}, [ valueUnit ] );

	useEffect( () => {
		if ( ! verticalAlignment && parentAlignment ) {
			updateAlignment( parentAlignment );
		}
	}, [] );

	const onChangeWidth = ( nextWidth ) => {
		const widthWithUnit = getWidthWithUnit( nextWidth, widthUnit );

		setAttributes( {
			width: widthWithUnit,
		} );
	};

	const onChangeUnit = ( nextUnit ) => {
		setWidthUnit( nextUnit );
		const widthWithoutUnit = parseFloat(
			width || getWidths( columns )[ selectedColumnIndex ]
		);

		setAttributes( {
			width: getWidthWithUnit( widthWithoutUnit, nextUnit ),
		} );
	};

	const onChange = ( nextWidth ) => {
		if ( isPercentageUnit( widthUnit ) || ! widthUnit ) {
			return;
		}
		onChangeWidth( nextWidth );
	};

	const renderAppender = useCallback( () => {
		if ( isSelected ) {
			const { width: columnWidth } = contentStyle[ clientId ] || {};
			const isFullWidth = columnWidth === screenWidth;

			return (
				<View
					style={ [
						styles.columnAppender,
						isFullWidth && styles.fullwidthColumnAppender,
						isFullWidth &&
							hasChildren &&
							styles.fullwidthHasInnerColumnAppender,
						! isFullWidth &&
							hasChildren &&
							styles.hasInnerColumnAppender,
					] }
				>
					<InnerBlocks.ButtonBlockAppender />
				</View>
			);
		}
		return null;
	}, [ contentStyle, clientId, screenWidth, isSelected, hasChildren ] );

	if ( ! isSelected && ! hasChildren ) {
		return (
			<View
				style={ [
					getStylesFromColorScheme(
						styles.columnPlaceholder,
						styles.columnPlaceholderDark
					),
					contentStyle[ clientId ],
				] }
			/>
		);
	}

	const parentWidth =
		contentStyle &&
		contentStyle[ clientId ] &&
		contentStyle[ clientId ].width;

	return (
		<>
			{ isSelected && (
				<>
					<BlockControls>
						<BlockVerticalAlignmentToolbar
							onChange={ updateAlignment }
							value={ verticalAlignment }
						/>
					</BlockControls>
					<InspectorControls>
						<PanelBody title={ __( 'Settings' ) }>
							<UnitControl
								label={ __( 'Width' ) }
								min={ 1 }
								max={
									isPercentageUnit( widthUnit )
										? 100
										: undefined
								}
								onChange={ onChange }
								onComplete={ onChangeWidth }
								onUnitChange={ onChangeUnit }
								value={
									getWidths( columns )[ selectedColumnIndex ]
								}
								unit={ widthUnit }
								units={ units }
								preview={
									<ColumnsPreview
										columnWidths={ getWidths(
											columns,
											false
										) }
										selectedColumnIndex={
											selectedColumnIndex
										}
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
				</>
			) }
			<View
				style={ [
					isSelected && hasChildren && styles.innerBlocksBottomSpace,
					contentStyle[ clientId ],
				] }
			>
				<InnerBlocks
					renderAppender={ renderAppender }
					parentWidth={ parentWidth }
					blockWidth={ blockWidth }
				/>
			</View>
		</>
	);
}

function ColumnEditWrapper( props ) {
	const { verticalAlignment } = props.attributes;

	const getVerticalAlignmentRemap = ( alignment ) => {
		if ( ! alignment ) {
			return styles.flexBase;
		}
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
		} = select( blockEditorStore );

		const selectedBlockClientId = getSelectedBlockClientId();
		const isSelected = selectedBlockClientId === clientId;

		const parentId = getBlockRootClientId( clientId );
		const hasChildren = !! getBlockCount( clientId );

		const blockOrder = getBlockOrder( parentId );

		const selectedColumnIndex = blockOrder.indexOf( clientId );
		const columns = getBlocks( parentId );

		const parentAlignment =
			getBlockAttributes( parentId )?.verticalAlignment;

		return {
			hasChildren,
			isSelected,
			selectedColumnIndex,
			columns,
			parentAlignment,
		};
	} ),
	withPreferredColorScheme,
] )( ColumnEditWrapper );
