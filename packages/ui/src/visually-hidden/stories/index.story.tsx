import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId } from '@wordpress/element';
import { VisuallyHidden } from '../';

const meta: Meta< typeof VisuallyHidden > = {
	title: 'Design System/Components/VisuallyHidden',
	component: VisuallyHidden,
};
export default meta;

type Story = StoryObj< typeof VisuallyHidden >;

export const Default: Story = {
	render: () => (
		<>
			<VisuallyHidden>This should not show.</VisuallyHidden>
			<div>
				This text will <VisuallyHidden>but not inline </VisuallyHidden>
				always show.
			</div>
		</>
	),
};

/**
 * Use the `render` prop to change the underlying HTML element.
 * By default, `VisuallyHidden` renders a `<div>`. Here it renders
 * a `<label>` instead, keeping the native label–input association
 * while hiding the label text visually.
 */
export const WithCustomElement: Story = {
	render: function WithCustomElementStory() {
		const inputId = useId();
		return (
			<>
				{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control */ }
				<VisuallyHidden render={ <label htmlFor={ inputId } /> }>
					Accessible label
				</VisuallyHidden>
				<input
					id={ inputId }
					placeholder="This input has a visually hidden label"
				/>
			</>
		);
	},
};
