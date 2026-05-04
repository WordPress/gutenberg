import type { Field } from './primitives';

export type ControlProps = {
	/**
	 * The accessible label. All controls must be labeled.
	 */
	label: React.ComponentProps< typeof Field.Label >[ 'children' ];
	/**
	 * The accessible description, associated using `aria-describedby`.
	 *
	 * For screen reader accessibility, this should only contain plain text,
	 * and no semantics such as links.
	 */
	description?: React.ComponentProps<
		typeof Field.Description
	>[ 'children' ];
	/**
	 * Additional information about the field, which unlike a normal description,
	 * can include links and other semantic elements.
	 *
	 * Do not use this prop when the content is only plain text;
	 * use `description` instead.
	 */
	details?: React.ComponentProps< typeof Field.Details >[ 'children' ];
	/**
	 * Whether to visually hide the label while keeping it accessible
	 * to screen readers.
	 *
	 * @default false
	 */
	hideLabelFromVision?: React.ComponentProps<
		typeof Field.Label
	>[ 'hideFromVision' ];
};
