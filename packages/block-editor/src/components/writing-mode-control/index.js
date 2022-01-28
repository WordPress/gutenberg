/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { arrowDown, arrowRight } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

const WRITING_MODES = [
	{
		name: __( 'Horizontal (default)' ),
		value: 'horizontal-tb',
		icon: arrowRight,
	},
	{
		name: __( 'Vertical - right to left' ),
		value: 'vertical-rl',
		icon: arrowDown,
	},
];

/**
 * Control to facilitate writing mode selections.
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.value    Currently selected writing mode.
 * @param {Function} props.onChange Handles change in writing mode selection.
 *
 * @return {WPElement} Writing mode control.
 */
export default function WritingModeControl( { value, onChange } ) {
	return (
		<fieldset className="block-editor-writing-mode-control">
			<legend>{ __( 'Orientation' ) }</legend>
			<div className="block-editor-writing-mode-control__buttons">
				{ WRITING_MODES.map( ( writingMode ) => {
					return (
						<Button
							key={ writingMode.value }
							icon={ writingMode.icon }
							isSmall
							isPressed={ writingMode.value === value }
							onClick={ () =>
								onChange(
									writingMode.value === value
										? undefined
										: writingMode.value
								)
							}
							aria-label={ writingMode.name }
						/>
					);
				} ) }
			</div>
		</fieldset>
	);
}
