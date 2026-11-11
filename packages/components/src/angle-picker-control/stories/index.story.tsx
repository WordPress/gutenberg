import type { Meta, StoryFn } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from '@wordpress/element';
import { AnglePickerControl } from '..';

const meta: Meta< typeof AnglePickerControl > = {
	id: 'components-anglepickercontrol',
	title: 'Components/@wordpress-components/AnglePickerControl',
	component: AnglePickerControl,
	argTypes: {
		as: { control: false },
		value: { control: false },
	},
	args: {
		onChange: fn(),
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'recommended',
			whereUsed: 'editor',
		},
	},
};

export default meta;

const AnglePickerWithState: StoryFn< typeof AnglePickerControl > = ( {
	onChange,
	...args
} ) => {
	const [ angle, setAngle ] = useState< number >( 0 );

	const handleChange = ( newValue: number ) => {
		setAngle( newValue );
		onChange( newValue );
	};

	return (
		<AnglePickerControl
			{ ...args }
			value={ angle }
			onChange={ handleChange }
		/>
	);
};

export const Default = AnglePickerWithState.bind( {} );

/**
 * Use `min` and `max` to change the range of angles that can be entered,
 * for example to allow negative angles. Dragging the circle anticlockwise
 * from 0 gives a negative angle, and it stops at `min` and `max`.
 */
export const WithCustomRange = AnglePickerWithState.bind( {} );
WithCustomRange.args = {
	min: -180,
	max: 180,
};

/**
 * A range wider than a full turn keeps counting as the circle turns, so
 * dragging clockwise from 350 gives 360 and then 370.
 */
export const WithMoreThanOneTurn = AnglePickerWithState.bind( {} );
WithMoreThanOneTurn.args = {
	min: -360,
	max: 360,
};

/**
 * A range narrower than a full turn stops at `min` and `max`, however far
 * the circle is dragged.
 */
export const WithNarrowRange = AnglePickerWithState.bind( {} );
WithNarrowRange.args = {
	min: 0,
	max: 90,
};
