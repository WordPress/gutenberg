/**
 * WordPress dependencies
 */
import {
	__experimentalBorderRadiusControl as BorderRadiusControl,
	__experimentalBorderStyleControl as BorderStyleControl,
	__experimentalColorGradientControl as ColorGradientControl,
} from '@wordpress/block-editor';
import {
	PanelBody,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSetting } from '../editor/utils';

const MIN_BORDER_WIDTH = 0;

// Defining empty array here instead of inline avoids unnecessary re-renders of
// color control.
const EMPTY_ARRAY = [];
const CSS_UNITS = [
	{ value: 'px', label: 'px', default: '' },
	{ value: 'em', label: 'em', default: '' },
	{ value: 'rem', label: 'rem', default: '' },
];

export function useHasBorderPanel( { supports, name } ) {
	const controls = [
		useHasBorderColorControl( { supports, name } ),
		useHasBorderRadiusControl( { supports, name } ),
		useHasBorderStyleControl( { supports, name } ),
		useHasBorderWidthControl( { supports, name } ),
	];

	return controls.every( Boolean );
}

function useHasBorderColorControl( { supports, name } ) {
	return (
		useSetting( 'border.customColor', name ) &&
		supports.includes( 'borderColor' )
	);
}

function useHasBorderRadiusControl( { supports, name } ) {
	return (
		useSetting( 'border.customRadius', name ) &&
		supports.includes( 'borderRadius' )
	);
}

function useHasBorderStyleControl( { supports, name } ) {
	return (
		useSetting( 'border.customStyle', name ) &&
		supports.includes( 'borderStyle' )
	);
}

function useHasBorderWidthControl( { supports, name } ) {
	return (
		useSetting( 'border.customWidth', name ) &&
		supports.includes( 'borderWidth' )
	);
}

function parseUnit( cssValue ) {
	const value = String( cssValue ).trim();
	const unitMatch = value.match( /[\d.\-\+]*\s*(.*)/ )[ 1 ];
	const unit = unitMatch !== undefined ? unitMatch.toLowerCase() : '';
	const currentUnit = CSS_UNITS.find( ( item ) => item.value === unit );

	return currentUnit?.value || 'px';
}

export default function BorderPanel( {
	context: { supports, name },
	getStyle,
	setStyle,
} ) {
	// Border width.
	const hasBorderWidth = useHasBorderWidthControl( { supports, name } );
	const borderWidthValue = getStyle( name, 'borderWidth' );

	// Step value is maintained in state so step is appropriate for current unit
	// even when current width value is undefined.
	const initialStep = parseUnit( borderWidthValue ) === 'px' ? 1 : 0.25;
	const [ step, setStep ] = useState( initialStep );

	// Border style.
	const hasBorderStyle = useHasBorderStyleControl( { supports, name } );
	const borderStyle = getStyle( name, 'borderStyle' );

	// Border color.
	const colors = useSetting( 'color.palette' ) || EMPTY_ARRAY;
	const disableCustomColors = ! useSetting( 'color.custom' );
	const disableCustomGradients = ! useSetting( 'color.customGradient' );
	const hasBorderColor = useHasBorderColorControl( { supports, name } );
	const borderColor = getStyle( name, 'borderColor' );

	// Border radius.
	const hasBorderRadius = useHasBorderRadiusControl( { supports, name } );
	const borderRadiusValues = getStyle( name, 'borderRadius' );

	return (
		<PanelBody title={ __( 'Border' ) } initialOpen={ true }>
			{ ( hasBorderWidth || hasBorderStyle ) && (
				<div className="edit-site-global-styles-sidebar__border-controls-row">
					{ hasBorderWidth && (
						<UnitControl
							value={ borderWidthValue }
							label={ __( 'Width' ) }
							min={ MIN_BORDER_WIDTH }
							onChange={ ( value ) => {
								setStyle(
									name,
									'borderWidth',
									value || undefined
								);
							} }
							onUnitChange={ ( newUnit ) => {
								setStep( newUnit === 'px' ? 1 : 0.25 );
							} }
							step={ step }
							units={ CSS_UNITS }
						/>
					) }
					{ hasBorderStyle && (
						<BorderStyleControl
							value={ borderStyle }
							onChange={ ( value ) =>
								setStyle( name, 'borderStyle', value )
							}
						/>
					) }
				</div>
			) }
			{ hasBorderColor && (
				<ColorGradientControl
					label={ __( 'Color' ) }
					value={ borderColor }
					colors={ colors }
					gradients={ undefined }
					disableCustomColors={ disableCustomColors }
					disableCustomGradients={ disableCustomGradients }
					onColorChange={ ( value ) =>
						setStyle( name, 'borderColor', value )
					}
				/>
			) }
			{ hasBorderRadius && (
				<BorderRadiusControl
					values={ borderRadiusValues }
					onChange={ ( value ) =>
						setStyle( name, 'borderRadius', value )
					}
				/>
			) }
		</PanelBody>
	);
}
