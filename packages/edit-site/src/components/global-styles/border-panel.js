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
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getSupportedGlobalStylesPanels, useSetting, useStyle } from './hooks';

const MIN_BORDER_WIDTH = 0;

// Defining empty array here instead of inline avoids unnecessary re-renders of
// color control.
const EMPTY_ARRAY = [];

export function useHasBorderPanel( name ) {
	const controls = [
		useHasBorderColorControl( name ),
		useHasBorderRadiusControl( name ),
		useHasBorderStyleControl( name ),
		useHasBorderWidthControl( name ),
	];

	return controls.some( Boolean );
}

function useHasBorderColorControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'border.color', name )[ 0 ] &&
		supports.includes( 'borderColor' )
	);
}

function useHasBorderRadiusControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'border.customRadius', name )[ 0 ] &&
		supports.includes( 'borderRadius' )
	);
}

function useHasBorderStyleControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'border.style', name )[ 0 ] &&
		supports.includes( 'borderStyle' )
	);
}

function useHasBorderWidthControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'border.width', name )[ 0 ] &&
		supports.includes( 'borderWidth' )
	);
}

export default function BorderPanel( { name } ) {
	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' )[ 0 ] || [
			'px',
			'em',
			'rem',
		],
	} );

	// Border width.
	const hasBorderWidth = useHasBorderWidthControl( name );
	const [ borderWidthValue, setBorderWidth ] = useStyle(
		'border.width',
		name
	);

	// Border style.
	const hasBorderStyle = useHasBorderStyleControl( name );
	const [ borderStyle, setBorderStyle ] = useStyle( 'border.style', name );

	// Border color.
	const [ colors = EMPTY_ARRAY ] = useSetting( 'color.palette' );
	const disableCustomColors = ! useSetting( 'color.custom' )[ 0 ];
	const disableCustomGradients = ! useSetting( 'color.customGradient' )[ 0 ];
	const hasBorderColor = useHasBorderColorControl( name );
	const [ borderColor, setBorderColor ] = useStyle( 'border.color', name );

	// Border radius.
	const hasBorderRadius = useHasBorderRadiusControl( name );
	const [ borderRadiusValues, setBorderRadius ] = useStyle(
		'border.radius',
		name
	);

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
								setBorderWidth( value || undefined );
							} }
							units={ units }
						/>
					) }
					{ hasBorderStyle && (
						<BorderStyleControl
							value={ borderStyle }
							onChange={ setBorderStyle }
						/>
					) }
				</div>
			) }
			{ hasBorderColor && (
				<ColorGradientControl
					label={ __( 'Color' ) }
					colorValue={ borderColor }
					colors={ colors }
					gradients={ undefined }
					disableCustomColors={ disableCustomColors }
					disableCustomGradients={ disableCustomGradients }
					onColorChange={ setBorderColor }
				/>
			) }
			{ hasBorderRadius && (
				<BorderRadiusControl
					values={ borderRadiusValues }
					onChange={ setBorderRadius }
				/>
			) }
		</PanelBody>
	);
}
