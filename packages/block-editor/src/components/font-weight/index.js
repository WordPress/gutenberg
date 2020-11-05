/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';

const FONT_WEIGHT_OPTIONS = [
	{ value: '', label: __( 'Default' ) },
	{ value: 'normal', label: __( 'Normal' ) },
	{ value: 'bold', label: __( 'Bold' ) },
	{ value: 'lighter', label: __( 'Lighter' ) },
	{ value: 'bolder', label: __( 'Bolder' ) },
	...[ ...Array( 9 ).keys() ]
		.map( ( i ) => ( i + 1 ) * 100 )
		.map( ( weight ) => ( { value: weight, label: weight } ) ),
	{ value: 'initial', label: __( 'Initial' ) },
	{ value: 'inherit', label: __( 'Inherit' ) },
];

export default function FontWeightControl( {
	value = '',
	onChange,
	...props
} ) {
	return (
		<SelectControl
			label={ __( 'Font weight' ) }
			options={ FONT_WEIGHT_OPTIONS }
			value={ value }
			onChange={ onChange }
			{ ...props }
		/>
	);
}
