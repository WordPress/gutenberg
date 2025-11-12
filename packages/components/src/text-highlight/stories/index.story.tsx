/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import TextHighlight from '..';

const meta: Meta< typeof TextHighlight > = {
	component: TextHighlight,
	title: 'Components/Typography/TextHighlight',
	id: 'components-texthighlight',
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof TextHighlight > = ( args ) => {
	return <TextHighlight { ...args } />;
};

export const Default: StoryFn< typeof TextHighlight > = Template.bind( {} );
Default.args = {
	text: 'We call the new editor Gutenberg. The entire editing experience has been rebuilt for media rich pages and posts.',
	highlight: 'Gutenberg',
};
