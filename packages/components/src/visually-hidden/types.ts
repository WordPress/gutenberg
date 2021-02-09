/* eslint-disable no-restricted-imports */
/**
 * External dependencies
 */
import type { ComponentProps } from 'react';
import { VisuallyHidden } from 'reakit';
import type { As } from 'reakit-utils';
/* eslint-enable no-restricted-imports */

export type VisuallyHiddenProps< TT extends As > = Omit<
	ComponentProps< typeof VisuallyHidden >,
	'as'
> & {
	as: TT;
	// Allow passing in any HTML attribute props (like `htmlFor` if `as="label"`)
} & ComponentProps< TT >;
