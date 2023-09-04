/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { DuotoneSwatch } from '..';

const meta: Meta< typeof DuotoneSwatch > = {
	title: 'Components/DuotoneSwatch',
	component: DuotoneSwatch,
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof DuotoneSwatch > = ( args ) => {
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
