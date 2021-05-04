/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const BORDER_STYLES = [
	{ label: __( 'Default' ), value: undefined },
	{ label: __( 'None' ), value: 'none' },
	{ label: __( 'Solid' ), value: 'solid' },
	{ label: __( 'Dashed' ), value: 'dashed' },
	{ label: __( 'Dotted' ), value: 'dotted' },
];

/**
 * Control to display border style options.
 *
 * @param {Object} props          Component props.
 * @param {Object} props.onChange Handler for changing border style selection.
 * @param {Object} props.value    Currently selected border style value.
 *
 * @return {WPElement} Custom border style select control.
 */
export default function BorderStyleControl( { onChange, value } ) {
	return (
		<fieldset className="components-border-style-control">
			<SelectControl
				className="components-border-style-control__select"
				label={ __( 'Style' ) }
				options={ BORDER_STYLES }
				value={ value }
				onChange={ onChange }
			/>
		</fieldset>
	);
}
