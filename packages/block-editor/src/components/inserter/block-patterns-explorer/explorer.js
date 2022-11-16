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
import { usePatternDirectoryCategories, useDebouncedInput } from './hooks';

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
