/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	useSettings,
	__experimentalSpacingSizesControl as SpacingSizesControl,
	isValueSpacingPreset,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import {
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { View } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import { MIN_SPACER_SIZE } from './constants';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const { useSpacingSizes } = unlock( blockEditorPrivateApis );

function DimensionInput( { label, onChange, isResizing, value = '' } ) {
	const inputId = useInstanceId( UnitControl, 'block-spacer-height-input' );
	const spacingSizes = useSpacingSizes();
	const [ spacingUnits ] = useSettings( 'spacing.units' );
	// In most contexts the spacer size cannot meaningfully be set to a
	// percentage, since this is relative to the parent container. This
	// unit is disabled from the UI.
	const availableUnits = spacingUnits
		? spacingUnits.filter( ( unit ) => unit !== '%' )
		: [ 'px', 'em', 'rem', 'vw', 'vh' ];

	const units = useCustomUnits( {
		availableUnits,
		defaultValues: { px: 100, em: 10, rem: 10, vw: 10, vh: 25 },
	} );

	// Force the unit to update to `px` when the Spacer is being resized.
	const [ parsedQuantity, parsedUnit ] =
		parseQuantityAndUnitFromRawValue( value );
	const computedValue = isValueSpacingPreset( value )
		? value
		: [ parsedQuantity, isResizing ? 'px' : parsedUnit ].join( '' );

	return (
		<>
			{ spacingSizes?.length < 2 ? (
				<UnitControl
					id={ inputId }
					isResetValueOnUnitChange
					min={ MIN_SPACER_SIZE }
					onChange={ onChange }
					value={ computedValue }
					units={ units }
					label={ label }
					__next40pxDefaultSize
				/>
			) : (
				<View className="tools-panel-item-spacing">
					<SpacingSizesControl
						values={ { all: computedValue } }
						onChange={ ( { all } ) => {
							onChange( all );
						} }
						label={ label }
						sides={ [ 'all' ] }
						units={ units }
						allowReset={ false }
						splitOnAxis={ false }
						showSideInLabel={ false }
					/>
				</View>
			) }
		</>
	);
}

export default function SpacerControls( {
	setAttributes,
	orientation,
	height,
	width,
	isResizing,
} ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings' ) }
				resetAll={ () => {
					setAttributes( {
						width: undefined,
						height: '100px',
					} );
				} }
				dropdownMenuProps={ dropdownMenuProps }
			>
				{ orientation === 'horizontal' && (
					<ToolsPanelItem
						label={ __( 'Width' ) }
						isShownByDefault
						hasValue={ () => width !== undefined }
						onDeselect={ () =>
							setAttributes( { width: undefined } )
						}
					>
						<DimensionInput
							label={ __( 'Width' ) }
							value={ width }
							onChange={ ( nextWidth ) =>
								setAttributes( { width: nextWidth } )
							}
							isResizing={ isResizing }
						/>
					</ToolsPanelItem>
				) }
				{ orientation !== 'horizontal' && (
					<ToolsPanelItem
						label={ __( 'Height' ) }
						isShownByDefault
						hasValue={ () => height !== '100px' }
						onDeselect={ () =>
							setAttributes( { height: '100px' } )
						}
					>
						<DimensionInput
							label={ __( 'Height' ) }
							value={ height }
							onChange={ ( nextHeight ) =>
								setAttributes( { height: nextHeight } )
							}
							isResizing={ isResizing }
						/>
					</ToolsPanelItem>
				) }
			</ToolsPanel>
		</InspectorControls>
	);
}
