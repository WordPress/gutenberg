/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PatternExplorerSidebar from './sidebar';
import PatternList from './patterns-list';
import { SYNC_FILTERS } from '../block-patterns-filter';
import { usePatternsCategories } from '../block-patterns-tab';

function PatternsExplorer( { initialCategory, rootClientId } ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const [ filterValue, setFilterValue ] = useState( SYNC_FILTERS.all );
	const [ selectedCategory, setSelectedCategory ] = useState(
		initialCategory?.name
	);
	const patternCategories = usePatternsCategories(
		rootClientId,
		filterValue
	);

	return (
		<div className="block-editor-block-patterns-explorer">
			<PatternExplorerSidebar
				selectedCategory={ selectedCategory }
				patternCategories={ patternCategories }
				onClickCategory={ setSelectedCategory }
				searchValue={ searchValue }
				setSearchValue={ setSearchValue }
				filterValue={ filterValue }
				setFilterValue={ setFilterValue }
			/>
			<PatternList
				searchValue={ searchValue }
				filterValue={ filterValue }
				selectedCategory={ selectedCategory }
				patternCategories={ patternCategories }
			/>
		</div>
	);
}

function PatternsExplorerModal( { onModalClose, ...restProps } ) {
	return (
		<Modal
			title={ __( 'Patterns' ) }
			onRequestClose={ onModalClose }
			isFullScreen
		>
			<PatternsExplorer { ...restProps } />
		</Modal>
	);
}

export default PatternsExplorerModal;
