/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import TextHighlight from '..';

const meta: ComponentMeta< typeof TextHighlight > = {
	component: TextHighlight,
	title: 'Components/TextHighlight',
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof TextHighlight > = ( args ) => {
	return <TextHighlight { ...args } />;
};

export const Default: ComponentStory< typeof TextHighlight > = Template.bind(
	{}
);
Default.args = {
	text: 'We call the new editor Gutenberg. The entire editing experience has been rebuilt for media rich pages and posts.',
	highlight: 'Gutenberg',
};
