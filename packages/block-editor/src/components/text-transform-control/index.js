/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	formatCapitalize,
	formatLowercase,
	formatUppercase,
} from '@wordpress/icons';

const TEXT_TRANSFORMS = [
	{
		name: __( 'Uppercase' ),
		value: 'uppercase',
		icon: formatUppercase,
	},
	{
		name: __( 'Lowercase' ),
		value: 'lowercase',
		icon: formatLowercase,
	},
	{
		name: __( 'Capitalize' ),
		value: 'capitalize',
		icon: formatCapitalize,
	},
];

/**
 * Control to facilitate text transform selections.
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.value    Currently selected text transform.
 * @param {Function} props.onChange Handles change in text transform selection.
 *
 * @return {WPElement} Text transform control.
 */
export default function TextTransformControl( { value, onChange, ...props } ) {
	return (
		<ToggleGroupControl
			{ ...props }
			className="block-editor-text-transform-control"
			__experimentalIsIconGroup
			label={ __( 'Letter case' ) }
			value={ value }
			onChange={ onChange }
		>
			{ TEXT_TRANSFORMS.map( ( textTransform ) => {
				return (
					<ToggleGroupControlOptionIcon
						key={ textTransform.value }
						value={ textTransform.value }
						icon={ textTransform.icon }
						label={ textTransform.name }
					/>
				);
			} ) }
		</ToggleGroupControl>
	);
}
