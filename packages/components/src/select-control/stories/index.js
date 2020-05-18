/**
 * External dependencies
 */
import { boolean, object, text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SelectControl from '../';

export default {
	title: 'Components/SelectControl',
	component: SelectControl,
};

const SelectControlWithState = ( props ) => {
	const [ selection, setSelection ] = useState();

	return (
		<SelectControl
			{ ...props }
			value={ selection }
			onChange={ setSelection }
		/>
	);
};

export const _default = () => {
	const label = text( 'Label', 'Label Text' );
	const hideLabelFromVision = boolean( 'Hide Label From Vision', false );
	const help = text(
		'Help Text',
		'Help text to explain the select control.'
	);
	const multiple = boolean( 'Allow Multiple Selection', false );
	const options = object( 'Options', [
		{ value: null, label: 'Select an Option', disabled: true },
		{ value: 'a', label: 'Option A' },
		{ value: 'b', label: 'Option B' },
		{ value: 'c', label: 'Option C' },
	] );
	const className = text( 'Class Name', '' );

	return (
		<SelectControlWithState
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			help={ help }
			multiple={ multiple }
			options={ options }
			className={ className }
		/>
	);
};
