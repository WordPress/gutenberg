/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TimePicker from '../time';

const meta: Meta< typeof TimePicker > = {
	title: 'Components/TimePicker',
	component: TimePicker,
	argTypes: {
		currentTime: { control: 'date' },
		onChange: { action: 'onChange', control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof TimePicker > = ( {
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

export const Default: StoryFn< typeof TimePicker > = Template.bind( {} );
