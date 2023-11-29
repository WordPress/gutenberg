/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import Shortcut from '../';

const meta: Meta< typeof Shortcut > = {
	component: Shortcut,
	title: 'Components/Shortcut',
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof Shortcut > = ( props ) => {
	return <Shortcut shortcut="Ctrl + S" { ...props } />;
};

export const Default: StoryFn< typeof Shortcut > = Template.bind( {} );

export const WithAriaLabel = Template.bind( {} );
WithAriaLabel.args = {
	...Default.args,
	shortcut: { display: 'Ctrl + L', ariaLabel: 'Load' },
};
