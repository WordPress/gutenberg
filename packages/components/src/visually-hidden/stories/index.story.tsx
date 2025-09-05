/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '..';

const meta: Meta< typeof VisuallyHidden > = {
	component: VisuallyHidden,
	title: 'Components/Typography/VisuallyHidden',
	id: 'components-visuallyhidden',
	argTypes: {
		children: { control: false },
		as: { control: { type: 'text' } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

export const Default: StoryFn< typeof VisuallyHidden > = ( args ) => (
	<>
		<VisuallyHidden as="span" { ...args }>
			This should not show.
		</VisuallyHidden>
		<div>
			This text will{ ' ' }
			<VisuallyHidden as="span" { ...args }>
				but not inline{ ' ' }
			</VisuallyHidden>{ ' ' }
			always show.
		</div>
	</>
);

export const WithForwardedProps: StoryFn< typeof VisuallyHidden > = (
	args
) => (
	<>
		Additional props can be passed to VisuallyHidden and are forwarded to
		the rendered element.{ ' ' }
		<VisuallyHidden as="span" data-id="test" { ...args }>
			Check out my data attribute!{ ' ' }
		</VisuallyHidden>
		Inspect the HTML to see!
	</>
);

export const WithAdditionalClassNames: StoryFn< typeof VisuallyHidden > = (
	args
) => (
	<>
		Additional class names passed to VisuallyHidden extend the component
		class name.{ ' ' }
		<VisuallyHidden as="label" className="test-input" { ...args }>
			Check out my class!{ ' ' }
		</VisuallyHidden>
		Inspect the HTML to see!
	</>
);
