/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

export default function InheritControl( { inherit, onChange } ) {
	return (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ __( 'Inherit parent term from archive' ) }
			checked={ inherit }
			onChange={ ( value ) =>
				onChange( {
					inherit: value,
					// When enabling inherit, hierarchical is not supported.
					...( value ? { hierarchical: false } : {} ),
				} )
			}
		/>
	);
}
