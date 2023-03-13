/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Truncate } from '..';

const meta: ComponentMeta< typeof Truncate > = {
	component: Truncate,
	title: 'Components (Experimental)/Truncate',
	argTypes: {
		children: { control: { type: 'text' } },
		as: { control: { type: 'text' } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const defaultText =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut facilisis dictum tortor, eu tincidunt justo scelerisque tincidunt. Duis semper dui id augue malesuada, ut feugiat nisi aliquam. Vestibulum venenatis diam sem, finibus dictum massa semper in. Nulla facilisi. Nunc vulputate faucibus diam, in lobortis arcu ornare vel. In dignissim nunc sed facilisis finibus. Etiam imperdiet mattis arcu, sed rutrum sapien blandit gravida. Aenean sollicitudin neque eget enim blandit, sit amet rutrum leo vehicula. Nunc malesuada ultricies eros ut faucibus. Aliquam erat volutpat. Nulla nec feugiat risus. Vivamus iaculis dui aliquet ante ultricies feugiat. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Vivamus nec pretium velit, sit amet consectetur ante. Praesent porttitor ex eget fermentum mattis.';

const Template: ComponentStory< typeof Truncate > = ( args ) => {
	return <Truncate { ...args } />;
};

export const Default: ComponentStory< typeof Truncate > = Template.bind( {} );
Default.args = {
	numberOfLines: 2,
	children: defaultText,
};

export const CharacterCount: ComponentStory< typeof Truncate > = Template.bind(
	{}
);
CharacterCount.args = {
	limit: 23,
	children: defaultText,
	ellipsizeMode: 'tail',
	ellipsis: '[---]',
};
CharacterCount.storyName = 'Truncate by character count';
