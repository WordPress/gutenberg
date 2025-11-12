/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import SandBox from '..';

const meta: Meta< typeof SandBox > = {
	component: SandBox,
	title: 'Components/Utilities/SandBox',
	id: 'components-sandbox',
	argTypes: {
		onFocus: { control: false },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof SandBox > = ( args ) => <SandBox { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	html: '<p>Arbitrary HTML content</p>',
};
