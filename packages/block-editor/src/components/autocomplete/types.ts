import type { ComponentProps } from 'react';
import type { Block } from '@wordpress/blocks';
import type {
	Autocomplete as WCAutocomplete,
	__unstableUseAutocompleteProps,
} from '@wordpress/components';

// Completers in the editor replace the field with blocks.
type UseAutocompletePropsOptions = Parameters<
	typeof __unstableUseAutocompleteProps< Block | Block[] >
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
	ComponentProps< typeof WCAutocomplete< Block | Block[] > >,
	'completers'
> & {
	completers?: Completer[];
};
