import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { Spinner } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import PatternsExplorerModal from '../block-patterns-explorer';
import PatternsGrid from './patterns-grid';
import { usePatternCategories } from './use-pattern-categories';
import InserterNoResults from '../no-results';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import type { BlockPatternsTabProps } from '../types';

/**
 * The inserter's Patterns tab: one sidebar with a search, a settings menu, the
 * pattern categories as tabs and the patterns of the selected one, starting on
 * "All". It browses like the Media tab.
 */
function BlockPatternsTab( {
	onSelectCategory,
	selectedCategory,
	onInsert,
	rootClientId,
}: BlockPatternsTabProps ) {
	const [ showPatternsExplorer, setShowPatternsExplorer ] = useState( false );

	const categories = usePatternCategories( rootClientId );

	const isResolvingPatterns = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).isResolvingPatterns(),
		[]
	);

	if ( ! categories.length ) {
		return isResolvingPatterns ? (
			<div className="block-editor-inserter__patterns-loading">
				<Spinner />
			</div>
		) : (
			<InserterNoResults />
		);
	}

	return (
		<>
			<PatternsGrid
				categories={ categories }
				initialCategory={ selectedCategory }
				onSelectCategory={ onSelectCategory }
				onInsert={ onInsert }
				rootClientId={ rootClientId }
				footer={
					<Button
						__next40pxDefaultSize
						className="block-editor-inserter__patterns-explore-button"
						onClick={ () => setShowPatternsExplorer( true ) }
						variant="secondary"
					>
						{ __( 'Explore all patterns' ) }
					</Button>
				}
			/>
			{ showPatternsExplorer && (
				<PatternsExplorerModal
					initialCategory={ selectedCategory || categories[ 0 ] }
					patternCategories={ categories }
					onModalClose={ () => setShowPatternsExplorer( false ) }
					rootClientId={ rootClientId }
				/>
			) }
		</>
	);
}

export default BlockPatternsTab;
