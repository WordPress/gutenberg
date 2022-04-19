/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InputControl from '..';

const meta: ComponentMeta< typeof InputControl > = {
	title: 'Components (Experimental)/InputControl',
	component: InputControl,
	argTypes: {
		__unstableInputWidth: { control: { type: 'text' } },
		__unstableStateReducer: { control: { type: null } },
		onChange: { control: { type: null } },
		prefix: { control: { type: null } },
		suffix: { control: { type: null } },
		type: { control: { type: 'text' } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const UncontrolledTemplate: ComponentStory< typeof InputControl > = (
	args
) => <InputControl { ...args } />;

const ControlledTemplate: ComponentStory< typeof InputControl > = ( args ) => {
	const [ value, setValue ] = useState( '' );

	return (
		<InputControl
			{ ...args }
			value={ value }
			onChange={ ( nextValue ) => setValue( nextValue ?? '' ) }
		/>
	);
};

export const Default = UncontrolledTemplate.bind( {} );
Default.args = {
	label: 'Value',
	placeholder: 'Placeholder',
};

export const WithPrefix = UncontrolledTemplate.bind( {} );
WithPrefix.args = {
	...Default.args,
	prefix: <span style={ { paddingLeft: 8 } }>@</span>,
};

export const WithSuffix = UncontrolledTemplate.bind( {} );
WithSuffix.args = {
	...Default.args,
	suffix: <button style={ { marginRight: 4 } }>Send</button>,
};

export const WithSideLabel = UncontrolledTemplate.bind( {} );
WithSideLabel.args = {
	...Default.args,
	labelPosition: 'side',
};

export const WithEdgeLabel = UncontrolledTemplate.bind( {} );
WithEdgeLabel.args = {
	...Default.args,
	__unstableInputWidth: '20em',
	labelPosition: 'edge',
};

export const Controlled = ControlledTemplate.bind( {} );
Controlled.args = {
	...Default.args,
};
Controlled.argTypes = {
	value: { control: { disable: true } },
};
