/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PatternExplorerSidebar from './pattern-explorer-sidebar';
import PatternList from './pattern-list';
import { usePatternCategories } from '../block-patterns-tab/use-pattern-categories';

function PatternsExplorer( { initialCategory, rootClientId } ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const [ patternSourceFilter, setPatternSourceFilter ] = useState( 'all' );

	const [ selectedCategory, setSelectedCategory ] = useState(
		initialCategory?.name
	);

	const patternCategories = usePatternCategories(
		rootClientId,
		patternSourceFilter
	);

	return (
		<div className="block-editor-block-patterns-explorer">
			<PatternExplorerSidebar
				selectedCategory={ selectedCategory }
				patternCategories={ patternCategories }
				onClickCategory={ setSelectedCategory }
				searchValue={ searchValue }
				setSearchValue={ setSearchValue }
				patternSourceFilter={ patternSourceFilter }
				setPatternSourceFilter={ setPatternSourceFilter }
			/>
			<PatternList
				searchValue={ searchValue }
				selectedCategory={ selectedCategory }
				patternCategories={ patternCategories }
				patternSourceFilter={ patternSourceFilter }
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
