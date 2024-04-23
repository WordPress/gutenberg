/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BaseControl, Button } from '@wordpress/components';

/**
 * @typedef {Object} Control
 * @property {string} label The label of the control.
 * @property {string} value The value of the control.
 * @property {string} icon  The icon of the control.
 */

/**
 * Control to facilitate selecting a text style from a set of options.
 *
 * @param {Object}    props           Component props.
 * @param {string}    props.label     A label for the control.
 * @param {string}    props.value     Currently selected value.
 * @param {Function}  props.onChange  Callback to handle onChange.
 * @param {Control[]} props.controls  Array of controls to display.
 * @param {string}    props.className Additional class name to apply.
 *
 * @return {Element} Element to render.
 */
export default function SegmentedTextControl( {
	label,
	value,
	controls,
	onChange,
	className,
} ) {
	return (
		<fieldset
			className={ classnames(
				'block-editor-segmented-text-control',
				className
			) }
		>
			<BaseControl.VisualLabel as="legend">
				{ label }
			</BaseControl.VisualLabel>
			<div className="block-editor-segmented-text-control__buttons">
				{ controls.map( ( control ) => {
					return (
						<Button
							size="compact"
							key={ control.value }
							icon={ control.icon }
							label={ control.label }
							isPressed={ control.value === value }
							onClick={ () => onChange( control.value ) }
						/>
					);
				} ) }
			</div>
		</fieldset>
	);
}
