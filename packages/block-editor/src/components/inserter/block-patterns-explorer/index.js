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

function PatternsExplorer( { initialCategory, rootClientId, onModalClose } ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const [ selectedCategory, setSelectedCategory ] = useState(
		initialCategory?.name
	);

	const patternCategories = usePatternCategories( rootClientId );

	return (
		<div className="block-editor-block-patterns-explorer">
			<PatternExplorerSidebar
				selectedCategory={ selectedCategory }
				patternCategories={ patternCategories }
				onClickCategory={ setSelectedCategory }
				searchValue={ searchValue }
				setSearchValue={ setSearchValue }
			/>
			<PatternList
				searchValue={ searchValue }
				selectedCategory={ selectedCategory }
				patternCategories={ patternCategories }
				rootClientId={ rootClientId }
				onModalClose={ onModalClose }
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
			<PatternsExplorer onModalClose={ onModalClose } { ...restProps } />
		</Modal>
	);
}

export default PatternsExplorerModal;
