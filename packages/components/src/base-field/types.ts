/**
 * Internal dependencies
 */
import type { FlexProps } from '../flex/types';

export interface UseBaseFieldProps extends Partial< FlexProps > {
	/**
	 * Renders an error.
	 */
	hasError?: boolean;
	/**
	 * Whether the field is disabled.
	 */
	disabled?: boolean;
	/**
	 * Renders as an inline element (layout).
	 */
	isInline?: boolean;
	/**
	 * Renders a subtle variant.
	 */
	isSubtle?: boolean;
}
