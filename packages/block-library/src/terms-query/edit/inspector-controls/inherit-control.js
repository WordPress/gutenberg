/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';

export default function InheritControl( { inherit, onChange, ...props } ) {
	return (
		<ToggleControl
			__nextHasNoMarginBottom
			checked={ inherit }
			onChange={ ( value ) =>
				onChange( {
					inherit: value,
					// When enabling inherit, hierarchical is not supported.
					...( value ? { hierarchical: false } : {} ),
				} )
			}
			{ ...props }
		/>
	);
}
