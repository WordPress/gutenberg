/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TimePicker from '../time';

const meta: ComponentMeta< typeof TimePicker > = {
	title: 'Components/TimePicker',
	component: TimePicker,
	argTypes: {
		currentTime: { control: 'date' },
		onChange: { action: 'onChange', control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof TimePicker > = ( {
	currentTime,
	onChange,
	...args
} ) => {
	const [ time, setTime ] = useState( currentTime );
	useEffect( () => {
		setTime( currentTime );
	}, [ currentTime ] );
	return (
		<TimePicker
			{ ...args }
			currentTime={ time }
			onChange={ ( newTime ) => {
				setTime( newTime );
				onChange?.( newTime );
			} }
		/>
	);
};

export const Default: ComponentStory< typeof TimePicker > = Template.bind( {} );
