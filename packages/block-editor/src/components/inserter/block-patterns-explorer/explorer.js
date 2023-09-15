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
import { usePatternsCategories } from '../block-patterns-tab';

function PatternsExplorer( { initialCategory, rootClientId } ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const [ patternSourceFilter, setPatternSourceFilter ] = useState( 'all' );

	const [ selectedCategory, setSelectedCategory ] = useState(
		initialCategory?.name
	);

	const patternCategories = usePatternsCategories(
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
