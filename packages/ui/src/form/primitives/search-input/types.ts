import type { InputProps } from '../input/types';

export type SearchInputProps = Omit<
	InputProps,
	'type' | 'prefix' | 'suffix' | 'value' | 'defaultValue'
> & {
	/**
	 * The value of the search field (controlled).
	 *
	 * To render an uncontrolled component, use the `defaultValue` prop instead.
	 */
	value?: string;
	/**
	 * The initial value of the search field (uncontrolled).
	 */
	defaultValue?: string;
	/**
	 * The accessible name of the search field.
	 *
	 * A label associated through `Field.Label` takes precedence.
	 *
	 * @default 'Search'
	 */
	'aria-label'?: string;
	/**
	 * Text shown in the field when it is empty.
	 *
	 * @default 'Search'
	 */
	placeholder?: string;
};
