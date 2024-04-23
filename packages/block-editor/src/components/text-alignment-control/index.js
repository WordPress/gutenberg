/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	alignLeft,
	alignCenter,
	alignRight,
	alignJustify,
} from '@wordpress/icons';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SegmentedTextControl from '../segmented-text-control';

const TEXT_ALIGNMENT_CONTROLS = [
	{
		label: __( 'Align text left' ),
		value: 'left',
		icon: alignLeft,
	},
	{
		label: __( 'Align text center' ),
		value: 'center',
		icon: alignCenter,
	},
	{
		label: __( 'Align text right' ),
		value: 'right',
		icon: alignRight,
	},
	{
		label: __( 'Justify text' ),
		value: 'justify',
		icon: alignJustify,
	},
];

const DEFAULT_CONTROLS = [ 'left', 'center', 'right' ];

/**
 * Control to facilitate text alignment selections.
 *
 * @param {Object}   props           Component props.
 * @param {string}   props.className Class name to add to the control.
 * @param {string}   props.value     Currently selected text alignment.
 * @param {Function} props.onChange  Handles change in text alignment selection.
 * @param {string[]} props.controls  Array of text alignment controls to display.
 *
 * @return {Element} Text alignment control.
 */
export default function TextAlignmentControl( {
	className,
	value,
	onChange,
	controls = DEFAULT_CONTROLS,
} ) {
	const validControls = useMemo(
		() =>
			TEXT_ALIGNMENT_CONTROLS.filter( ( control ) =>
				controls.includes( control.value )
			),
		[ controls ]
	);

	if ( ! validControls.length ) {
		return null;
	}

	return (
		<SegmentedTextControl
			label={ __( 'Text alignment' ) }
			controls={ validControls }
			className={ className }
			value={ value }
			onChange={ ( newValue ) => {
				onChange( newValue === value ? undefined : newValue );
			} }
		/>
	);
}
