import type { InputProps } from '../input/types';

export type SearchInputProps = Omit<
	InputProps,
	'type' | 'prefix' | 'suffix'
> & {
	/**
	 * The accessible name of the search field.
	 *
	 * Defaults to "Search" when the field has no associated `<label>`, such as
	 * a `Field.Label`.
	 */
	'aria-label'?: string;
	/**
	 * Text shown in the field when it is empty.
	 *
	 * @default 'Search'
	 */
	placeholder?: string;
};
