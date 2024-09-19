/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PatternsExplorerModal from '../block-patterns-explorer';
import MobileTabNavigation from '../mobile-tab-navigation';
import { PatternCategoryPreviews } from './pattern-category-previews';
import { usePatternCategories } from './use-pattern-categories';
import CategoryTabs from '../category-tabs';
import InserterNoResults from '../no-results';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

function BlockPatternsTab( {
	onSelectCategory,
	selectedCategory,
	onInsert,
	rootClientId,
	children,
} ) {
	const [ showPatternsExplorer, setShowPatternsExplorer ] = useState( false );

	const categories = usePatternCategories( rootClientId );

	const isMobile = useViewportMatch( 'medium', '<' );
	const isResolvingPatterns = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).isResolvingPatterns(),
		[]
	);

	if ( isResolvingPatterns ) {
		return (
			<div className="block-editor-inserter__patterns-loading">
				<Spinner />
			</div>
		);
	}

	if ( ! categories.length ) {
		return <InserterNoResults />;
	}

	return (
		<>
			{ ! isMobile && (
				<div className="block-editor-inserter__block-patterns-tabs-container">
					<CategoryTabs
						categories={ categories }
						selectedCategory={ selectedCategory }
						onSelectCategory={ onSelectCategory }
					>
						{ children }
					</CategoryTabs>
					<Button
						__next40pxDefaultSize
						className="block-editor-inserter__patterns-explore-button"
						onClick={ () => setShowPatternsExplorer( true ) }
						variant="secondary"
					>
						{ __( 'Explore all patterns' ) }
					</Button>
				</div>
			) }
			{ isMobile && (
				<MobileTabNavigation categories={ categories }>
					{ ( category ) => (
						<div className="block-editor-inserter__category-panel">
							<PatternCategoryPreviews
								key={ category.name }
								onInsert={ onInsert }
								rootClientId={ rootClientId }
								category={ category }
								showTitlesAsTooltip={ false }
							/>
						</div>
					) }
				</MobileTabNavigation>
			) }
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
