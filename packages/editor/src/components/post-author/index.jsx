import { __, _n, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { useDebounce } from '@wordpress/compose';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- SearchableSelect is the only searchable single-select in `@wordpress/ui`.
	SearchableSelect,
	Spinner,
	Stack,
	VisuallyHidden,
} from '@wordpress/ui';
import { store as editorStore } from '../../store';
import { useAuthorsQuery } from './hook';

const EMPTY_ARRAY = [];
const SEARCH_DEBOUNCE_MS = 300;

const isSameAuthor = ( authorA, authorB ) => authorA.value === authorB.value;

/**
 * Renders the control for selecting the post author.
 *
 * @return {React.ReactNode} The rendered component.
 */
function PostAuthorControl() {
	const [ inputValue, setInputValue ] = useState( '' );
	const [ search, setSearch ] = useState( '' );
	const debouncedSetSearch = useDebounce( setSearch, SEARCH_DEBOUNCE_MS );

	const { editPost } = useDispatch( editorStore );
	const { items, value, isLoading } = useAuthorsQuery( search );

	// Results lag the input by the debounce and the request.
	const isSearching = isLoading || inputValue !== search;
	// Nothing filters on the client, so stale results have to go.
	const authors = isSearching ? EMPTY_ARRAY : items;

	function onInputValueChange( nextInputValue ) {
		setInputValue( nextInputValue );

		// Cleared by the user, or after a selection.
		if ( ! nextInputValue ) {
			debouncedSetSearch.cancel();
			setSearch( '' );
			return;
		}

		debouncedSetSearch( nextInputValue );
	}

	function onValueChange( author ) {
		if ( ! author ) {
			return;
		}

		editPost( { author: Number( author.value ) } );
	}

	return (
		<SearchableSelect
			aria-label={ __( 'Author' ) }
			// Authors are searched through the REST API.
			filter={ null }
			items={ authors }
			value={ value }
			onValueChange={ onValueChange }
			isItemEqualToValue={ isSameAuthor }
			inputValue={ inputValue }
			onInputValueChange={ onInputValueChange }
			placeholder={ __( 'Select author' ) }
			statusContent={
				isSearching ? (
					<Stack direction="row" gap="sm" align="center">
						<Spinner />
						{ __( 'Searching…' ) }
					</Stack>
				) : (
					authors.length > 0 && (
						<VisuallyHidden>
							{ sprintf(
								/* translators: %d: number of results. */
								_n(
									'%d result found.',
									'%d results found.',
									authors.length
								),
								authors.length
							) }
						</VisuallyHidden>
					)
				)
			}
			emptyContent={ isSearching ? null : __( 'No authors found.' ) }
		/>
	);
}

export default PostAuthorControl;
