import { applyFilters, hasFilter } from '@wordpress/hooks';
import {
	Autocomplete as WCAutocomplete,
	__unstableUseAutocompleteProps as useAutocompleteProps,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { getDefaultBlockName, getBlockSupport } from '@wordpress/blocks';
import { useBlockEditContext } from '../block-edit/context';
import blockAutocompleter from '../../autocompleters/block';
import type {
	BlockEditorAutocompleteProps,
	Completer,
	UseBlockEditorAutocompletePropsOptions,
} from './types';

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation.
 */
const EMPTY_ARRAY: Completer[] = [];

function useCompleters( {
	completers = EMPTY_ARRAY,
}: {
	completers?: Completer[];
} ) {
	const { name } = useBlockEditContext();
	return useMemo( () => {
		let filteredCompleters = [ ...completers ];

		if (
			name === getDefaultBlockName() ||
			getBlockSupport( name, '__experimentalSlashInserter', false )
		) {
			filteredCompleters = [
				...filteredCompleters,
				// It lists its items through `useItems`, so it has no `options`.
				blockAutocompleter as unknown as Completer,
			];
		}

		if ( hasFilter( 'editor.Autocomplete.completers' ) ) {
			// Provide copies so filters may directly modify them.
			if ( filteredCompleters === completers ) {
				filteredCompleters = filteredCompleters.map(
					( completer ) => ( { ...completer } )
				);
			}

			// Filters are untyped.
			filteredCompleters = applyFilters(
				'editor.Autocomplete.completers',
				filteredCompleters,
				name
			) as Completer[];
		}

		return filteredCompleters;
	}, [ completers, name ] );
}

export function useBlockEditorAutocompleteProps(
	props: UseBlockEditorAutocompletePropsOptions
) {
	return useAutocompleteProps( {
		...props,
		completers: useCompleters( props ),
	} );
}

/**
 * Wrap the default Autocomplete component with one that supports a filter hook
 * for customizing its list of autocompleters.
 */
function BlockEditorAutocomplete( props: BlockEditorAutocompleteProps ) {
	return (
		<WCAutocomplete { ...props } completers={ useCompleters( props ) } />
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/autocomplete/README.md
 */
export default BlockEditorAutocomplete;
