import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId } from '@wordpress/element';
import { Popover } from '../..';
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

/**
 * When composing `VisuallyHidden` with another component that has its own
 * semantic element, always make `VisuallyHidden` the **host** (outer
 * component) and pass the other component via `render`. This preserves
 * the other component's HTML element and semantics.
 *
 * ```jsx
 * // Correct — Popover.Title keeps its <h2> element.
 * <VisuallyHidden render={ <Popover.Title /> }>
 *   Title text
 * </VisuallyHidden>
 *
 * // Avoid — replaces Popover.Title's <h2> with a <div>.
 * <Popover.Title render={ <VisuallyHidden /> }>
 *   Title text
 * </Popover.Title>
 * ```
 */
export const ComposedWithAnotherComponent: Story = {
	render: () => (
		<Popover.Root defaultOpen>
			<Popover.Trigger>Open popover</Popover.Trigger>
			<Popover.Popup>
				<VisuallyHidden render={ <Popover.Title /> }>
					Accessible popover heading
				</VisuallyHidden>
				<p>
					This popover has a visually hidden title that is still
					accessible to screen readers via{ ' ' }
					<code>aria-labelledby</code>.
				</p>
			</Popover.Popup>
		</Popover.Root>
	),
};
