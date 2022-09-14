/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import BaseControl from '..';
import Button from '../../button';

const meta: ComponentMeta< typeof BaseControl > = {
	title: 'Components/BaseControl',
	component: BaseControl,
	argTypes: {
		children: { control: { type: null } },
		help: { control: { type: 'text' } },
		label: { control: { type: 'text' } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const BaseControlWithTextarea: ComponentStory< typeof BaseControl > = ( {
	id,
	...props
} ) => {
	return (
		<BaseControl id={ id } { ...props }>
			<textarea style={ { display: 'block' } } id={ id } />
		</BaseControl>
	);
};

export const Default: ComponentStory< typeof BaseControl > =
	BaseControlWithTextarea.bind( {} );
Default.args = {
	__nextHasNoMarginBottom: true,
	id: 'textarea-default-1',
	label: 'Label text',
};

export const WithHelpText = BaseControlWithTextarea.bind( {} );
WithHelpText.args = {
	...Default.args,
	id: 'textarea-with-help-text-1',
	help: 'Help text adds more explanation.',
};

/**
 * `BaseControl.VisualLabel` is used to render a purely visual label inside a `BaseControl` component.
 *
 * It should only be used in cases where the children being rendered inside `BaseControl` are already accessibly labeled,
 * e.g., a button, but we want an additional visual label for that section equivalent to the labels `BaseControl` would
 * otherwise use if the `label` prop was passed.
 */
export const WithVisualLabel: ComponentStory< typeof BaseControl > = (
	props
) => {
	// @ts-expect-error - Unclear how to fix, see also https://github.com/WordPress/gutenberg/pull/39468#discussion_r827150516
	BaseControl.VisualLabel.displayName = 'BaseControl.VisualLabel';

	return (
		<BaseControl { ...props }>
			<BaseControl.VisualLabel>Visual label</BaseControl.VisualLabel>
			<div>
				<Button variant="secondary">Select an author</Button>
			</div>
		</BaseControl>
	);
};
WithVisualLabel.args = {
	...Default.args,
	help: 'This button is already accessibly labeled.',
	id: undefined,
	label: undefined,
};
