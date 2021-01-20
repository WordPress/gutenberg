/**
 * WordPress dependencies
 */
import { PanelBody, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useEditorFeature } from '../editor/utils';

const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;

export function useHasBorderPanel( { supports, name } ) {
	// This function will allow for easy addition of future border properties
	// e.g. Border width.
	// return (
	// 	useHasBorderRadiusControl( { supports, name } ) ||
	// 	useHasBorderWidthControl( { supports, name } )
	// )
	return useHasBorderRadiusControl( { supports, name } );
}

function useHasBorderRadiusControl( { supports, name } ) {
	return (
		useEditorFeature( 'border.customRadius', name ) &&
		supports.includes( 'borderRadius' )
	);
}

export default function BorderPanel( {
	context: { supports, name },
	getStyle,
	setStyle,
} ) {
	const hasBorderRadius = useHasBorderRadiusControl( { supports, name } );
	const borderRadiusValue = parseInt(
		getStyle( name, 'borderRadius' ) || 0,
		10
	);

	return (
		<PanelBody title={ __( 'Border' ) } initialOpen={ true }>
			{ hasBorderRadius && (
				<RangeControl
					value={ borderRadiusValue }
					label={ __( 'Border radius' ) }
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
		</PanelBody>
	);
}
