/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Internal dependencies
 */
import ButtonGroup from '..';
import Button from '../../button';

/**
 * ButtonGroup can be used to group any related buttons together.
 * To emphasize related buttons, a group should share a common container.
 *
 * This component is deprecated. Use `ToggleGroupControl` instead.
 */
const meta: Meta< typeof ButtonGroup > = {
	title: 'Components (Deprecated)/ButtonGroup',
	id: 'components-buttongroup',
	component: ButtonGroup,
	argTypes: {
		children: { control: false },
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
