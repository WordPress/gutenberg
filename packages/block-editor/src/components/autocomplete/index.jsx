import { applyFilters, hasFilter } from '@wordpress/hooks';
import deprecated from '@wordpress/deprecated';
import { useMemo } from '@wordpress/element';
import { getDefaultBlockName, getBlockSupport } from '@wordpress/blocks';
import { useBlockEditContext } from '../block-edit/context';
import blockAutocompleter from '../../autocompleters/block';
import { useAutocompleteProps } from './use-autocomplete';

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation.
 *
 * @type {Array}
 */
const EMPTY_ARRAY = [];

function useCompleters( { completers = EMPTY_ARRAY } ) {
	const { name } = useBlockEditContext();
	return useMemo( () => {
		let filteredCompleters = [ ...completers ];

		if (
			name === getDefaultBlockName() ||
			getBlockSupport( name, '__experimentalSlashInserter', false )
		) {
			filteredCompleters = [ ...filteredCompleters, blockAutocompleter ];
		}

		if ( hasFilter( 'editor.Autocomplete.completers' ) ) {
			// Provide copies so filters may directly modify them.
			if ( filteredCompleters === completers ) {
				filteredCompleters = filteredCompleters.map(
					( completer ) => ( { ...completer } )
				);
			}

			filteredCompleters = applyFilters(
				'editor.Autocomplete.completers',
				filteredCompleters,
				name
			);
		}

		return filteredCompleters;
	}, [ completers, name ] );
}

export function useBlockEditorAutocompleteProps( props ) {
	return useAutocompleteProps( {
		...props,
		completers: useCompleters( props ),
	} );
}

/**
 * Renders its children without autocompletion. The component is deprecated
 * and kept only so that existing calls keep rendering.
 *
 * @type {React.FC}
 */
function BlockEditorAutocomplete( { children } ) {
	deprecated( 'wp.blockEditor.Autocomplete', {
		since: '7.2',
		hint: 'The component no longer provides autocompletion. The RichText component accepts completers through its autocompleters prop.',
	} );
	return children( {
		listBoxId: undefined,
		activeId: null,
		onKeyDown: () => {},
	} );
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/autocomplete/README.md
 */
export default BlockEditorAutocomplete;
