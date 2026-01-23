import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId } from '@wordpress/element';
import '@wordpress/theme/design-tokens.css';
import { Field } from '../../../..';

const meta: Meta< typeof Field.Root > = {
	title: 'Design System/Components/Form/Primitives/Field',
	component: Field.Root,
	subcomponents: {
		Item: Field.Item,
		Label: Field.Label,
		Control: Field.Control,
		Description: Field.Description,
		Details: Field.Details,
	},
};
export default meta;

/**
 * If your control component forwards refs, as well as the `aria-labelledby` and `aria-describedby` props
 * to the actual underlying HTML element to be labeled,
 * you can simply place your control in the `render` prop of `Field.Control`.
 */
export const Default: StoryObj< typeof Field.Root > = {
	args: {
		children: (
			<>
				<Field.Label>Label</Field.Label>
				<Field.Control
					render={ <input type="text" placeholder="Placeholder" /> }
				/>
				<Field.Description>
					The accessible description.
				</Field.Description>
			</>
		),
	},
};

const MyNonRefForwardingControl = (
	props: React.ComponentProps< 'input' >
) => {
	return <input type="text" { ...props } />;
};

/**
 * If your control component does not forward refs, but does forward the `id` prop
 * to the actual underlying HTML element to be labeled, use the `htmlFor` prop
 * of the `Field.Label` component to associate the label with the control.
 *
 * This is preferred over `aria-labelledby` because it allows users to click the
 * label to focus the control.
 */
export const UsingHtmlFor: StoryObj< typeof Field.Root > = {
	name: 'Using htmlFor',
	render: ( args ) => {
		const controlId = useId();
		const descriptionId = useId();

		return (
			<Field.Root { ...args }>
				<Field.Label htmlFor={ controlId }>Label</Field.Label>
				<MyNonRefForwardingControl
					placeholder="Placeholder"
					id={ controlId }
					aria-describedby={ descriptionId }
				/>
				<Field.Description id={ descriptionId }>
					The accessible description.
				</Field.Description>
			</Field.Root>
		);
	},
};

/**
 * If your control component does not forward refs nor the `id` prop, but does
 * forward the `aria-labelledby` prop to the actual underlying HTML element to be
 * labeled, use the `id` prop of the `Field.Label` component to associate the
 * label with the control.
 */
export const UsingAriaLabelledby: StoryObj< typeof Field.Root > = {
	name: 'Using aria-labelledby',
	render: ( args ) => {
		const labelId = useId();
		const descriptionId = useId();

		return (
			<Field.Root { ...args }>
				<Field.Label id={ labelId }>Label</Field.Label>
				<MyNonRefForwardingControl
					placeholder="Placeholder"
					aria-labelledby={ labelId }
					aria-describedby={ descriptionId }
				/>
				<Field.Description id={ descriptionId }>
					The accessible description.
				</Field.Description>{ ' ' }
			</Field.Root>
		);
	},
};

/**
 * To add rich content (such as links) to the description, use `Field.Details`.
 *
 * Although this content is not associated with the field using direct semantics,
 * it is made discoverable to screen reader users via a visually hidden description,
 * alerting them to the presence of additional information below.
 *
 * If the content only includes plain text, use `Field.Description` instead,
 * so the readout is not unnecessarily verbose for screen reader users.
 */
export const WithDetails: StoryObj< typeof Field.Root > = {
	args: {
		children: (
			<>
				<Field.Label>Label</Field.Label>
				<Field.Control
					render={ <input type="text" placeholder="Placeholder" /> }
				/>
				<Field.Details>
					Details can include{ '	' }
					<a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a">
						links to more information
					</a>{ ' ' }
					and other semantic elements.
				</Field.Details>
			</>
		),
	},
};
