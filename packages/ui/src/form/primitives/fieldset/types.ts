import type { Fieldset as _Fieldset } from '@base-ui/react';
import type { ComponentProps } from '../../../utils/types';

export type FieldsetRootProps = ComponentProps< typeof _Fieldset.Root > & {
	children?: React.ReactNode;
};

export type FieldsetLegendProps = ComponentProps< typeof _Fieldset.Legend > & {
	children?: React.ReactNode;
};

export type FieldsetDescriptionProps = ComponentProps< 'p' > & {
	/**
	 * The accessible description, associated using `aria-describedby`.
	 *
	 * For screen reader accessibility, this should only contain plain text,
	 * and no semantics such as links.
	 */
	children?: string;
};

export type FieldsetDetailsProps = ComponentProps< 'div' > & {
	/**
	 * Additional information about the fieldset, which unlike a normal description,
	 * can include links and other semantic elements.
	 *
	 * Although this content is not associated with the fieldset using direct semantics,
	 * it is made discoverable to screen reader users via a visually hidden description,
	 * alerting them to the presence of additional information below.
	 *
	 * Do not use this component when the details content is only plain text,
	 * as it makes the readout unnecessarily verbose for screen reader users.
	 */
	children?: React.ReactNode;
};
