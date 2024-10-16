/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Internal dependencies
 */
import ButtonGroup from '..';
import Button from '../../button';

const meta: Meta< typeof ButtonGroup > = {
	title: 'Components/ButtonGroup',
	component: ButtonGroup,
	argTypes: {
		children: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

export const Default: StoryObj< typeof ButtonGroup > = {
	args: {
		children: (
			<>
				<Button variant="primary">Button 1</Button>
				<Button>Button 2</Button>
			</>
		),
	},
};
