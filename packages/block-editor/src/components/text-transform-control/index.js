/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BaseControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	reset,
	formatCapitalize,
	formatLowercase,
	formatUppercase,
} from '@wordpress/icons';

const TEXT_TRANSFORMS = [
	{
		name: __( 'None' ),
		value: 'none',
		icon: reset,
	},
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
 * @param {Object}   props           Component props.
 * @param {string}   props.className Class name to add to the control.
 * @param {string}   props.value     Currently selected text transform.
 * @param {Function} props.onChange  Handles change in text transform selection.
 *
 * @return {WPElement} Text transform control.
 */
export default function TextTransformControl( { className, value, onChange } ) {
	return (
		<fieldset
			className={ classnames(
				'block-editor-text-transform-control',
				className
			) }
		>
			<BaseControl.VisualLabel as="legend">
				{ __( 'Letter case' ) }
			</BaseControl.VisualLabel>
			<div className="block-editor-text-transform-control__buttons">
				{ TEXT_TRANSFORMS.map( ( textTransform ) => {
					return (
						<Button
							key={ textTransform.value }
							icon={ textTransform.icon }
							label={ textTransform.name }
							isPressed={ textTransform.value === value }
							onClick={ () => {
								onChange(
									textTransform.value === value
										? undefined
										: textTransform.value
								);
							} }
						/>
					);
				} ) }
			</div>
		</fieldset>
	);
}
