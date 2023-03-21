/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { DuotoneSwatch } from '..';

const meta: ComponentMeta< typeof DuotoneSwatch > = {
	title: 'Components/DuotoneSwatch',
	component: DuotoneSwatch,
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof DuotoneSwatch > = ( args ) => {
	return <DuotoneSwatch { ...args } />;
};

export const Default = Template.bind( {} );
Default.args = {
	values: [ '#000', '#fff' ],
};

export const SingleColor = Template.bind( {} );
SingleColor.args = {
	values: [ 'pink' ],
};

export const Null = Template.bind( {} );
Null.args = {
	values: null,
};
