/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';

export default function InheritControl( { value, onChange, ...props } ) {
	return (
		<ToggleControl
			__nextHasNoMarginBottom
			checked={ value }
			onChange={ ( inherit ) =>
				onChange( {
					inherit,
					// When enabling inherit, hierarchical is not supported.
					...( inherit ? { hierarchical: false } : {} ),
				} )
			}
			{ ...props }
		/>
	);
}
