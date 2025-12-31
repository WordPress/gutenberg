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
