/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Text } from '../component';

const meta: Meta< typeof Text > = {
	component: Text,
	title: 'Components (Experimental)/Text',
	argTypes: {
		as: { control: { type: 'text' } },
		color: { control: { type: 'color' } },
		display: { control: { type: 'text' } },
		lineHeight: { control: { type: 'text' } },
		letterSpacing: { control: { type: 'text' } },
		optimizeReadabilityFor: { control: { type: 'color' } },
		size: { control: { type: 'text' } },
		variant: {
			options: [ undefined, 'muted' ],
			control: { type: 'select' },
		},
		weight: { control: { type: 'text' } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof Text > = ( props ) => {
	return <Text { ...props } />;
};

export const Default = Template.bind( {} );
Default.args = {
	children: 'Code is poetry',
};

export const Truncate = Template.bind( {} );
Truncate.args = {
	children: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut
facilisis dictum tortor, eu tincidunt justo scelerisque tincidunt.
Duis semper dui id augue malesuada, ut feugiat nisi aliquam.
Vestibulum venenatis diam sem, finibus dictum massa semper in. Nulla
facilisi. Nunc vulputate faucibus diam, in lobortis arcu ornare vel.
In dignissim nunc sed facilisis finibus. Etiam imperdiet mattis
arcu, sed rutrum sapien blandit gravida. Aenean sollicitudin neque
eget enim blandit, sit amet rutrum leo vehicula. Nunc malesuada
ultricies eros ut faucibus. Aliquam erat volutpat. Nulla nec feugiat
risus. Vivamus iaculis dui aliquet ante ultricies feugiat.
Vestibulum ante ipsum primis in faucibus orci luctus et ultrices
posuere cubilia curae; Vivamus nec pretium velit, sit amet
consectetur ante. Praesent porttitor ex eget fermentum mattis.`,
	numberOfLines: 2,
	truncate: true,
};

export const Highlight = Template.bind( {} );
Highlight.args = {
	children: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut
facilisis dictum tortor, eu tincidunt justo scelerisque tincidunt.
Duis semper dui id augue malesuada, ut feugiat nisi aliquam.
Vestibulum venenatis diam sem, finibus dictum massa semper in. Nulla
facilisi. Nunc vulputate faucibus diam, in lobortis arcu ornare vel.
In dignissim nunc sed facilisis finibus. Etiam imperdiet mattis
arcu, sed rutrum sapien blandit gravida. Aenean sollicitudin neque
eget enim blandit, sit amet rutrum leo vehicula. Nunc malesuada
ultricies eros ut faucibus. Aliquam erat volutpat. Nulla nec feugiat
risus. Vivamus iaculis dui aliquet ante ultricies feugiat.
Vestibulum ante ipsum primis in faucibus orci luctus et ultrices
posuere cubilia curae; Vivamus nec pretium velit, sit amet
consectetur ante. Praesent porttitor ex eget fermentum mattis.`,
	highlightWords: [ 'con' ],
};
