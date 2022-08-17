/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { formatStrikethrough, formatUnderline } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

const TEXT_DECORATIONS = [
	{
		name: __( 'Underline' ),
		value: 'underline',
		icon: formatUnderline,
	},
	{
		name: __( 'Strikethrough' ),
		value: 'line-through',
		icon: formatStrikethrough,
	},
];

/**
 * Control to facilitate text decoration selections.
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.value    Currently selected text decoration.
 * @param {Function} props.onChange Handles change in text decoration selection.
 *
 * @return {WPElement} Text decoration control.
 */
export default function TextDecorationControl( { value, onChange, ...props } ) {
	return (
		<ToggleGroupControl
			{ ...props }
			className="block-editor-text-decoration-control"
			__experimentalIsIconGroup
			label={ __( 'Decoration' ) }
			value={ value }
			onChange={ onChange }
		>
			{ TEXT_DECORATIONS.map( ( textDecoration ) => {
				return (
					<ToggleGroupControlOptionIcon
						key={ textDecoration.value }
						value={ textDecoration.value }
						icon={ textDecoration.icon }
						label={ textDecoration.name }
					/>
				);
			} ) }
		</ToggleGroupControl>
	);
}
