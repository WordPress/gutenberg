/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDebounce } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PatternExplorerSidebar from './sidebar';
import PatternList from './patterns-list';

function usePatternDirectoryCategories() {
	const [ categories, setCategories ] = useState( [] );
	useEffect( () => {
		apiFetch( {
			path: '/wp/v2/pattern-directory/categories',
		} ).then( ( fetchedCategories ) => {
			setCategories( fetchedCategories );
		} );
	}, [] );
	// TODO: check about custom sorting of categories.
	return categories;
}

function useDebouncedInput() {
	const [ input, setInput ] = useState( '' );
	const [ debounced, setter ] = useState( '' );
	const setDebounced = useDebounce( setter, 250 );
	useEffect( () => {
		if ( debounced !== input ) {
			setDebounced( input );
		}
	}, [ debounced, input ] );
	return [ input, setInput, debounced ];
}

function PatternsExplorer() {
	const categories = usePatternDirectoryCategories();
	const [ search, setSearch, debouncedSearch ] = useDebouncedInput();
	const [ selectedCategory, setSelectedCategory ] = useState();
	return (
		<div className="block-editor-block-patterns-explorer">
			<PatternExplorerSidebar
				selectedCategory={ selectedCategory }
				categories={ categories }
				onClickCategory={ setSelectedCategory }
				filterValue={ search }
				setFilterValue={ setSearch }
			/>
			<PatternList
				filterValue={ debouncedSearch }
				selectedCategory={ selectedCategory }
				patternCategories={ categories }
			/>
		</div>
	);
}

function PatternsExplorerModal( { onModalClose, ...restProps } ) {
	return (
		<Modal
			title={ __( 'Pattern Directory' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ onModalClose }
			isFullScreen
		>
			<PatternsExplorer { ...restProps } />
		</Modal>
	);
}

export default PatternsExplorerModal;
