/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BaseControl, Button } from '@wordpress/components';
import { reset, formatStrikethrough, formatUnderline } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

const TEXT_DECORATIONS = [
	{
		name: __( 'None' ),
		value: 'none',
		icon: reset,
	},
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
 * @param {Object}   props             Component props.
 * @param {string}   props.value       Currently selected text decoration.
 * @param {Function} props.onChange    Handles change in text decoration selection.
 * @param {string}   [props.className] Additional class name to apply.
 *
 * @return {WPElement} Text decoration control.
 */
export default function TextDecorationControl( {
	value,
	onChange,
	className,
} ) {
	return (
		<fieldset
			className={ classnames(
				'block-editor-text-decoration-control',
				className
			) }
		>
			<BaseControl.VisualLabel as="legend">
				{ __( 'Decoration' ) }
			</BaseControl.VisualLabel>
			<div className="block-editor-text-decoration-control__buttons">
				{ TEXT_DECORATIONS.map( ( textDecoration ) => {
					return (
						<Button
							key={ textDecoration.value }
							icon={ textDecoration.icon }
							label={ textDecoration.name }
							isPressed={ textDecoration.value === value }
							onClick={ () => {
								onChange(
									textDecoration.value === value
										? undefined
										: textDecoration.value
								);
							} }
						/>
					);
				} ) }
			</div>
		</fieldset>
	);
}
