/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BaseControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { footer, header } from '@wordpress/icons';

const POSITION_AREAS = [
	{
		name: __( 'Header' ),
		value: 'top',
		icon: header,
	},
	{
		name: __( 'Footer' ),
		value: 'bottom',
		icon: footer,
	},
];

/**
 * Control to facilitate position area selections such as Header or Footer.
 *
 * @param {Object}      props           Component props.
 * @param {string}      props.className Class name to add to the control.
 * @param {WPComponent} props.help      Help text.
 * @param {string}      props.value     Currently selected position area.
 * @param {Function}    props.onChange  Handles change in position area selection.
 *
 * @return {WPElement} Position area control.
 */
export default function PositionAreaControl( {
	className,
	help,
	value,
	onChange,
} ) {
	return (
		<BaseControl
			className={ classnames(
				'block-editor-position-area-control',
				className
			) }
			help={ help }
			__nextHasNoMarginBottom
		>
			<BaseControl.VisualLabel as="legend">
				{ __( 'Area' ) }
			</BaseControl.VisualLabel>
			<div className="block-editor-position-area-control__buttons">
				{ POSITION_AREAS.map( ( positionArea ) => {
					return (
						<Button
							key={ positionArea.value }
							icon={ positionArea.icon }
							label={ positionArea.name }
							isPressed={ positionArea.value === value }
							onClick={ () => {
								onChange(
									positionArea.value === value
										? undefined
										: positionArea.value
								);
							} }
						/>
					);
				} ) }
			</div>
		</BaseControl>
	);
}
