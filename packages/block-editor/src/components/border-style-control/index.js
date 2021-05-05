/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { dashedIcon, dottedIcon, solidIcon } from './icons';

const BORDER_STYLES = [
	{ label: __( 'Solid' ), icon: solidIcon, value: 'solid' },
	{ label: __( 'Dashed' ), icon: dashedIcon, value: 'dashed' },
	{ label: __( 'Dotted' ), icon: dottedIcon, value: 'dotted' },
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
			<legend>{ __( 'Style' ) }</legend>
			<div className="components-border-style-control__buttons">
				{ BORDER_STYLES.map( ( borderStyle ) => (
					<Button
						key={ borderStyle.value }
						icon={ borderStyle.icon }
						isSmall
						isPressed={ borderStyle.value === value }
						onClick={ () =>
							onChange(
								borderStyle.value === value
									? undefined
									: borderStyle.value
							)
						}
						aria-label={ borderStyle.label }
					/>
				) ) }
			</div>
		</fieldset>
	);
}
