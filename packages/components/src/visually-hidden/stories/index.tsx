/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '..';

const meta: ComponentMeta< typeof VisuallyHidden > = {
	component: VisuallyHidden,
	title: 'Components/VisuallyHidden',
	argTypes: {
		children: { control: { type: null } },
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

export const Default: ComponentStory< typeof VisuallyHidden > = ( args ) => (
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

export const WithForwardedProps: ComponentStory< typeof VisuallyHidden > = (
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

export const WithAdditionalClassNames: ComponentStory<
	typeof VisuallyHidden
> = ( args ) => (
	<>
		Additional class names passed to VisuallyHidden extend the component
		class name.{ ' ' }
		<VisuallyHidden as="label" className="test-input" { ...args }>
			Check out my class!{ ' ' }
		</VisuallyHidden>
		Inspect the HTML to see!
	</>
);
