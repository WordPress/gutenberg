/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	reset,
	formatCapitalize,
	formatLowercase,
	formatUppercase,
} from '@wordpress/icons';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';

const CITATION_TEXT_TRANSFORMS = [
	{
		label: __( 'None' ),
		value: 'none',
		icon: reset,
	},
	{
		label: __( 'Uppercase' ),
		value: 'uppercase',
		icon: formatUppercase,
	},
	{
		label: __( 'Lowercase' ),
		value: 'lowercase',
		icon: formatLowercase,
	},
	{
		label: __( 'Capitalize' ),
		value: 'capitalize',
		icon: formatCapitalize,
	},
];

/**
 * Control to facilitate letter case (text transform) selections for the
 * Pullquote block's citation text, independent of the typography settings
 * applied to the main quote text.
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.value    Currently selected citation text transform.
 * @param {Function} props.onChange Handles change in citation text transform selection.
 *
 * @return {Element} Citation text transform control.
 */
export default function CitationTextTransformControl( { value, onChange } ) {
	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			isDeselectable
			label={ __( 'Letter case' ) }
			value={ value }
			onChange={ ( newValue ) => {
				onChange( newValue === value ? undefined : newValue );
			} }
		>
			{ CITATION_TEXT_TRANSFORMS.map( ( option ) => (
				<ToggleGroupControlOptionIcon
					key={ option.value }
					value={ option.value }
					icon={ option.icon }
					label={ option.label }
				/>
			) ) }
		</ToggleGroupControl>
	);
}
