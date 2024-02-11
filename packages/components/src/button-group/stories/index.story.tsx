/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

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

const Template: StoryFn< typeof ButtonGroup > = ( args ) => {
	const style = { margin: '0 4px' };
	return (
		<ButtonGroup { ...args }>
			<Button variant="primary" style={ style }>
				Button 1
			</Button>
			<Button variant="primary" style={ style }>
				Button 2
			</Button>
		</ButtonGroup>
	);
};

export const Default: StoryFn< typeof ButtonGroup > = Template.bind( {} );
