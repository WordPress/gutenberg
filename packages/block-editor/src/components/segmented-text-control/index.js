/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { BaseControl, Button } from '@wordpress/components';

/**
 * @typedef {Object} Option
 * @property {string} label The label of the option.
 * @property {string} value The value of the option.
 * @property {string} icon  The icon of the option.
 */

/**
 * Control to facilitate selecting a text style from a set of options.
 *
 * @param {Object}   props           Component props.
 * @param {string}   props.label     A label for the option.
 * @param {string}   props.value     Currently selected value.
 * @param {Function} props.onChange  Callback to handle onChange.
 * @param {Option[]} props.options   Array of options to display.
 * @param {string}   props.className Additional class name to apply.
 *
 * @return {Element} Element to render.
 */
export default function SegmentedTextControl( {
	label,
	value,
	options,
	onChange,
	className,
} ) {
	return (
		<fieldset
			className={ clsx(
				'block-editor-segmented-text-control',
				className
			) }
		>
			<BaseControl.VisualLabel as="legend">
				{ label }
			</BaseControl.VisualLabel>
			<div className="block-editor-segmented-text-control__buttons">
				{ options.map( ( option ) => {
					return (
						<Button
							size="compact"
							key={ option.value }
							icon={ option.icon }
							label={ option.label }
							isPressed={ option.value === value }
							onClick={ () => onChange( option.value ) }
						/>
					);
				} ) }
			</div>
		</fieldset>
	);
}
