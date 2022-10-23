/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import ButtonGroup from '..';
import Button from '../../button';

const meta: ComponentMeta< typeof ButtonGroup > = {
	title: 'Components/ButtonGroup',
	component: ButtonGroup,
	argTypes: {
		children: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof ButtonGroup > = ( args ) => {
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

export const Default: ComponentStory< typeof ButtonGroup > = Template.bind(
	{}
);
