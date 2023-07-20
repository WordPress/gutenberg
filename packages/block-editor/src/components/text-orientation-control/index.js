/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BaseControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { textMixed, textUpright } from '@wordpress/icons';

const TEXT_ORIENTATIONS = [
	{
		name: __( 'Upright' ),
		value: 'upright',
		icon: textUpright,
	},
	{
		name: __( 'Mixed' ),
		value: 'mixed',
		icon: textMixed,
	},
];

/**
 * Control to facilitate writing mode selections.
 *
 * @param {Object}   props           Component props.
 * @param {string}   props.className Class name to add to the control.
 * @param {string}   props.value     Currently selected writing mode.
 * @param {Function} props.onChange  Handles change in the writing mode selection.
 *
 * @return {WPElement} Writing Mode control.
 */
export default function textOrientationControl( {
	className,
	value,
	onChange,
} ) {
	return (
		<fieldset
			className={ classnames(
				'block-editor-text-orientation-control',
				className
			) }
		>
			<BaseControl.VisualLabel as="legend">
				{ __( 'Orientation' ) }
			</BaseControl.VisualLabel>

			<div className="block-editor-text-orientation-control__buttons">
				{ TEXT_ORIENTATIONS.map( ( textOrientation ) => {
					return (
						<Button
							key={ textOrientation.value }
							icon={ textOrientation.icon }
							label={ textOrientation.name }
							isPressed={ textOrientation.value === value }
							onClick={ () => {
								onChange(
									textOrientation.value === value
										? undefined
										: textOrientation.value
								);
							} }
						/>
					);
				} ) }
			</div>
		</fieldset>
	);
}
