/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function InheritControl( { value, onChange, label } ) {
	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			isBlock
			onChange={ ( newValue ) => {
				onChange( {
					inherit: newValue === 'default',
					// When enabling inherit, hierarchical is not supported.
					...( newValue === 'default' ? { showNested: false } : {} ),
				} );
			} }
			help={
				value
					? __(
							'Display terms based on the current taxonomy archive. For hierarchical taxonomies, shows direct children of the current term. For non-hierarchical taxonomies, shows all terms.'
					  )
					: __( 'Display terms based on specific criteria.' )
			}
			value={ value ? 'default' : 'custom' }
		>
			<ToggleGroupControlOption
				value="default"
				label={ __( 'Default' ) }
			/>
			<ToggleGroupControlOption value="custom" label={ __( 'Custom' ) } />
		</ToggleGroupControl>
	);
}
