/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';

export default function NestedTermsControl( {
	hierarchical,
	onChange,
	...props
} ) {
	return (
		<ToggleControl
			__nextHasNoMarginBottom
			checked={ hierarchical }
			onChange={ onChange }
			{ ...props }
		/>
	);
}
