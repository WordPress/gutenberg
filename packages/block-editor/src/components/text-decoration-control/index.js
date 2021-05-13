/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
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
 * @param  {Object}   props                 Component props.
 * @param  {string}   props.value           Currently selected text decoration.
 * @param  {Function} props.onChange        Handles change in text decoration selection.
 *
 * @return {WPElement} Text decoration control.
 */
export default function TextDecorationControl( { value, onChange } ) {
	return (
		<fieldset className="block-editor-text-decoration-control">
			<legend>{ __( 'Decoration' ) }</legend>
			<div className="block-editor-text-decoration-control__buttons">
				{ TEXT_DECORATIONS.map( ( textDecoration ) => {
					return (
						<Button
							key={ textDecoration.value }
							icon={ textDecoration.icon }
							isSmall
							isPressed={ textDecoration.value === value }
							onClick={ () =>
								onChange(
									textDecoration.value === value
										? undefined
										: textDecoration.value
								)
							}
							aria-label={ textDecoration.name }
						/>
					);
				} ) }
			</div>
		</fieldset>
	);
}
