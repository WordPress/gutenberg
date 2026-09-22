import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { useDebounce } from '@wordpress/compose';
// eslint-disable-next-line @wordpress/use-recommended-components -- SearchableSelect is the only searchable single-select in `@wordpress/ui`.
import { SearchableSelect, Spinner, Stack } from '@wordpress/ui';
import { store as editorStore } from '../../store';
import { useAuthorsQuery } from './hook';

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

	// The results shown are still the ones for the previous term until the
	// debounced search runs and its request resolves.
	const isSearching = isLoading || inputValue !== search;

	function onInputValueChange( nextInputValue ) {
		setInputValue( nextInputValue );
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
			items={ items }
			value={ value }
			onValueChange={ onValueChange }
			isItemEqualToValue={ isSameAuthor }
			inputValue={ inputValue }
			onInputValueChange={ onInputValueChange }
			placeholder={ __( 'Select author' ) }
			statusContent={
				isSearching && (
					<Stack direction="row" gap="sm" align="center">
						<Spinner />
						{ __( 'Searching…' ) }
					</Stack>
				)
			}
			emptyContent={ isSearching ? null : __( 'No authors found.' ) }
		/>
	);
}

export default PostAuthorControl;
