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
					parent: inherit ? 'inherit' : false,
					// When enabling inherit, showNested is not supported.
					...( inherit ? { showNested: false } : {} ),
				} )
			}
			{ ...props }
		/>
	);
}
