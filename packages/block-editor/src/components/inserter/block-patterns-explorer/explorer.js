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
	onModalClose,
} ) {
	const [ filterValue, setFilterValue ] = useState( '' );
	const patternList = !! filterValue ? (
		<PatternExplorerSearchResults
			filterValue={ filterValue }
			// onSelect={ onSelect }
		/>
	) : (
		children
	);
	return (
		<Modal
			title={ __( 'Patterns' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ onModalClose }
			shouldCloseOnClickOutside={ false }
			isFullScreen
		>
			<Grid
				columns={ 2 }
				templateColumns="20% auto"
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
		</Modal>
	);
}

export default PatternsExplorer;
