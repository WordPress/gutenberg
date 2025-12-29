import type { Field } from '@base-ui/react/field';
import type { ComponentProps } from '../../../utils/types';

export type FieldRootProps = Omit<
	ComponentProps< typeof Field.Root >,
	| 'disabled'
	// TODO: Maybe allow these when we have validation support ready.
	| 'dirty'
	| 'invalid'
	| 'touched'
	| 'validate'
	| 'validationDebounceTime'
	| 'validationMode'
> & {
	children?: Field.Root.Props[ 'children' ];
	/**
	 * Whether the field is disabled.
	 *
	 * @default false
	 */
	disabled?: Field.Root.Props[ 'disabled' ];
};

export type FieldItemProps = ComponentProps< typeof Field.Item > & {
	children?: React.ReactNode;
};

export type FieldLabelProps = ComponentProps< typeof Field.Label > & {
	/**
	 * The label string, or the string and the element to associate it with.
	 *
	 * To keep things accessible, do not include other interactive
	 * elements such as links or buttons.
	 */
	children?: Field.Label.Props[ 'children' ];
	/**
	 * The visual variant of the label.
	 *
	 * Use 'plain' for controls like checkboxes and radio buttons.
	 *
	 * @default 'default'
	 */
	variant?: 'default' | 'plain';
};

export type FieldControlProps = Omit<
	ComponentProps< typeof Field.Control >,
	'defaultValue'
> & {
	children?: Field.Control.Props[ 'children' ];
	/**
	 * The default value to use in uncontrolled mode.
	 */
	defaultValue?: Field.Control.Props[ 'defaultValue' ];
};

export type FieldDescriptionProps = ComponentProps<
	typeof Field.Description
> & {
	/**
	 * The accessible description, associated using `aria-describedby`.
	 *
	 * For screen reader accessibility, this should only contain plain text,
	 * and no semantics such as links.
	 */
	children?: string;
};

export type FieldDetailsProps = ComponentProps< 'div' > & {
	/**
	 * Additional information about the field, which unlike a normal description,
	 * can include links and other semantic elements.
	 *
	 * Although this content is not associated with the field using direct semantics,
	 * it is made discoverable to screen reader users via a visually hidden description,
	 * alerting them to the presence of additional information below.
	 *
	 * Do not use this component when the details content is only plain text,
	 * as it makes the readout unnecessarily verbose for screen reader users.
	 */
	children?: React.ReactNode;
};
