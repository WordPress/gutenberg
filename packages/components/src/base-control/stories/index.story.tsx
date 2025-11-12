/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import BaseControl, { useBaseControlProps } from '..';
import Button from '../../button';

const meta: Meta< typeof BaseControl > = {
	title: 'Components/Selection & Input/Common/BaseControl',
	id: 'components-basecontrol',
	component: BaseControl,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'BaseControl.VisualLabel': BaseControl.VisualLabel,
	},
	argTypes: {
		children: { control: false },
		help: { control: { type: 'text' } },
		label: { control: { type: 'text' } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const BaseControlWithTextarea: StoryFn< typeof BaseControl > = ( props ) => {
	const { baseControlProps, controlProps } = useBaseControlProps( props );

	return (
		<BaseControl { ...baseControlProps }>
			<textarea style={ { display: 'block' } } { ...controlProps } />
		</BaseControl>
	);
};

export const Default: StoryFn< typeof BaseControl > =
	BaseControlWithTextarea.bind( {} );
Default.args = {
	__nextHasNoMarginBottom: true,
	label: 'Label text',
};

export const WithHelpText = BaseControlWithTextarea.bind( {} );
WithHelpText.args = {
	...Default.args,
	help: 'Help text adds more explanation.',
};

/**
 * `BaseControl.VisualLabel` is used to render a purely visual label inside a `BaseControl` component.
 *
 * It should only be used in cases where the children being rendered inside `BaseControl` are already accessibly labeled,
 * e.g., a button, but we want an additional visual label for that section equivalent to the labels `BaseControl` would
 * otherwise use if the `label` prop was passed.
 */
export const WithVisualLabel: StoryFn< typeof BaseControl > = ( props ) => {
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
	label: undefined,
};
