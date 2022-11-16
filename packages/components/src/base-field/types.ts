/**
 * Internal dependencies
 */
import type { FlexProps } from '../flex/types';

export type BaseFieldProps = FlexProps & {
	/**
	 * Whether the field is disabled.
	 */
	disabled?: boolean;
	/**
	 * Renders an error style around the component.
	 */
	hasError?: boolean;
	/**
	 * Renders a component that can be inlined in some text.
	 */
	isInline?: boolean;
	/**
	 * Renders a subtle variant of the component.
	 */
	isSubtle?: boolean;
};
