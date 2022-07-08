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
import { Slider } from '../';

const meta: ComponentMeta< typeof Slider > = {
	title: 'Components (Experimental)/Slider',
	component: Slider,
	argTypes: { onChange: { action: 'onChange' } },
	parameters: {
		controls: { expanded: true, exclude: [ 'heading' ] },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const DefaultTemplate: ComponentStory< typeof Slider > = ( {
	onChange,
	value: valueProp,
	...args
} ) => {
	const [ value, setValue ] = useState( valueProp );
	const handleChange = ( newValue ) => {
		setValue( newValue );
		onChange?.( newValue );
	};

	return <Slider { ...args } value={ value } onChange={ handleChange } />;
};

export const Default: ComponentStory< typeof Slider > = DefaultTemplate.bind(
	{}
);
Default.args = {};
