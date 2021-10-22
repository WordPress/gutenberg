/**
 * WordPress dependencies
 */
import { Modal, __experimentalGrid as Grid } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PatternExplorerSidebar from './sidebar';
import PatternExplorerSearchResults from './search-results';

function PatternsExplorer( {
	selectedCategory,
	patternCategories,
	onClickCategory,
	children,
} ) {
	const [ filterValue, setFilterValue ] = useState( '' );
	const patternList = !! filterValue ? (
		<PatternExplorerSearchResults filterValue={ filterValue } />
	) : (
		children
	);
	return (
		<Grid
			columns={ 2 }
			templateColumns="240px auto"
			className="block-editor-block-patterns-explorer"
		>
			<PatternExplorerSidebar
				selectedCategory={ selectedCategory }
				patternCategories={ patternCategories }
				onClickCategory={ onClickCategory }
				filterValue={ filterValue }
				setFilterValue={ setFilterValue }
			/>

			<div>{ patternList }</div>
		</Grid>
	);
}

function PatternsExplorerModal( { onModalClose, ...restProps } ) {
	return (
		<Modal
			title={ __( 'Patterns' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ onModalClose }
			shouldCloseOnClickOutside={ false }
			isFullScreen
		>
			<PatternsExplorer { ...restProps } />
		</Modal>
	);
}

export default PatternsExplorerModal;
