/**
 * WordPress dependencies
 */
import {
	__experimentalBorderStyleControl as BorderStyleControl,
	__experimentalColorGradientControl as ColorGradientControl,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSetting } from '../editor/utils';

const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;
const MIN_BORDER_WIDTH = 0;
const MAX_BORDER_WIDTH = 50;

// Defining empty array here instead of inline avoids unnecessary re-renders of
// color control.
const EMPTY_ARRAY = [];

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

export default function BorderPanel( {
	context: { supports, name },
	getStyle,
	setStyle,
} ) {
	// Border style.
	const hasBorderStyle = useHasBorderStyleControl( { supports, name } );
	const borderStyle = getStyle( name, 'borderStyle' );

	// Border width.
	const hasBorderWidth = useHasBorderWidthControl( { supports, name } );
	const borderWidthValue = parseInt(
		getStyle( name, 'borderWidth' ) || 0,
		10
	);

	// Border radius.
	const hasBorderRadius = useHasBorderRadiusControl( { supports, name } );
	const borderRadiusValue = parseInt(
		getStyle( name, 'borderRadius' ) || 0,
		10
	);

	// Border color.
	const colors = useSetting( 'color.palette' ) || EMPTY_ARRAY;
	const disableCustomColors = ! useSetting( 'color.custom' );
	const disableCustomGradients = ! useSetting( 'color.customGradient' );
	const hasBorderColor = useHasBorderColorControl( { supports, name } );
	const borderColor = getStyle( name, 'borderColor' );

	return (
		<PanelBody title={ __( 'Border' ) } initialOpen={ true }>
			{ hasBorderStyle && (
				<BorderStyleControl
					value={ borderStyle }
					onChange={ ( value ) =>
						setStyle( name, 'borderStyle', value )
					}
				/>
			) }
			{ hasBorderWidth && (
				<RangeControl
					value={ borderWidthValue }
					label={ __( 'Width' ) }
					min={ MIN_BORDER_WIDTH }
					max={ MAX_BORDER_WIDTH }
					initialPosition={ borderWidthValue }
					allowReset
					onChange={ ( value ) => {
						const widthStyle = value ? `${ value }px` : undefined;
						setStyle( name, 'borderWidth', widthStyle );
					} }
				/>
			) }
			{ hasBorderRadius && (
				<RangeControl
					value={ borderRadiusValue }
					label={ __( 'Radius' ) }
					min={ MIN_BORDER_RADIUS_VALUE }
					max={ MAX_BORDER_RADIUS_VALUE }
					initialPosition={ borderRadiusValue }
					allowReset
					onChange={ ( value ) => {
						const radiusStyle = value ? `${ value }px` : undefined;
						setStyle( name, 'borderRadius', radiusStyle );
					} }
				/>
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
		</PanelBody>
	);
}
