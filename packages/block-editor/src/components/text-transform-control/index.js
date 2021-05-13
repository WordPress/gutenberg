/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
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
 * @param  {Object}   props                Component props.
 * @param  {string}   props.value          Currently selected text transform.
 * @param  {Function} props.onChange       Handles change in text transform selection.
 *
 * @return {WPElement} Text transform control.
 */
export default function TextTransformControl( { value, onChange } ) {
	return (
		<fieldset className="block-editor-text-transform-control">
			<legend>{ __( 'Letter case' ) }</legend>
			<div className="block-editor-text-transform-control__buttons">
				{ TEXT_TRANSFORMS.map( ( textTransform ) => {
					return (
						<Button
							key={ textTransform.value }
							icon={ textTransform.icon }
							isSmall
							isPressed={ value === textTransform.value }
							aria-label={ textTransform.name }
							onClick={ () =>
								onChange(
									value === textTransform.value
										? undefined
										: textTransform.value
								)
							}
						/>
					);
				} ) }
			</div>
		</fieldset>
	);
}
