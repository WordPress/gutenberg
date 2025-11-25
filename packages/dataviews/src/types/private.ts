/**
 * Internal dependencies
 */
import type { NormalizedField } from './field-api';

export type SelectionOrUpdater = string[] | ( ( prev: string[] ) => string[] );
export type SetSelection = ( selection: SelectionOrUpdater ) => void;
export type TypeProvidedProps< Item > = Pick<
	NormalizedField< Item >,
	| 'type'
	| 'render'
	| 'Edit'
	| 'sort'
	| 'isValid'
	| 'enableSorting'
	| 'enableGlobalSearch'
	| 'filterBy'
	| 'format'
>;
