import type { ComponentProps } from 'react';
import type {
	Autocomplete as WCAutocomplete,
	__unstableUseAutocompleteProps,
} from '@wordpress/components';

type UseAutocompletePropsOptions = Parameters<
	typeof __unstableUseAutocompleteProps
>[ 0 ];

// `@wordpress/components` does not export the completer type.
export type Completer = UseAutocompletePropsOptions[ 'completers' ][ number ];

export type UseBlockEditorAutocompletePropsOptions = Omit<
	UseAutocompletePropsOptions,
	'completers'
> & {
	completers?: Completer[];
};

export type BlockEditorAutocompleteProps = Omit<
	ComponentProps< typeof WCAutocomplete >,
	'completers'
> & {
	completers?: Completer[];
};
