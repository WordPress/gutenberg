/**
 * External dependencies
 */
import { boolean, select, text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InputControl from '../';

export default {
	title: 'Components (Experimental)/InputControl',
	component: InputControl,
	parameters: {
		knobs: { disable: false },
	},
};

function Example() {
	const [ value, setValue ] = useState( '' );

	const props = {
		disabled: boolean( 'disabled', false ),
		hideLabelFromVision: boolean( 'hideLabelFromVision', false ),
		isPressEnterToChange: boolean( 'isPressEnterToChange', false ),
		label: text( 'label', 'Value' ),
		labelPosition: select(
			'labelPosition',
			{
				top: 'top',
				side: 'side',
				bottom: 'bottom',
			},
			'top'
		),
		placeholder: text( 'placeholder', 'Placeholder' ),
		size: select(
			'size',
			{
				default: 'default',
				small: 'small',
				'__unstable-large': '__unstable-large',
			},
			'default'
		),
		suffix: text( 'suffix', '' ),
		prefix: text( 'prefix', '' ),
	};

	const suffixMarkup = props.suffix ? <div>{ props.suffix }</div> : null;
	const prefixMarkup = props.prefix ? <div>{ props.prefix }</div> : null;

	return (
		<InputControl
			{ ...props }
			onChange={ ( v ) => setValue( v ) }
			prefix={ prefixMarkup }
			suffix={ suffixMarkup }
			value={ value }
		/>
	);
}

export const _default = () => {
	return <Example />;
};
