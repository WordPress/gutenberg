import { useState, useEffect } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { Button, Spinner as WCSpinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import PatternsExplorerModal from '../block-patterns-explorer';
import MobileTabNavigation from '../mobile-tab-navigation';
import { PatternCategoryPreviews } from './pattern-category-previews';
import { usePatternCategories } from './use-pattern-categories';
import CategoryTabs from '../category-tabs';
import InserterNoResults from '../no-results';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import type { BlockPatternsTabProps } from '../types';

function BlockPatternsTab( {
	onSelectCategory,
	selectedCategory,
	onInsert,
	rootClientId,
	children,
}: BlockPatternsTabProps ) {
	const [ showPatternsExplorer, setShowPatternsExplorer ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( true );

	const categories = usePatternCategories( rootClientId );

	const isMobile = useViewportMatch( 'medium', '<' );

	const isResolvingPatterns = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).isResolvingPatterns(),
		[]
	);

	/**
	 * Hide spinner when atleast one category is loaded or pattern resolution is complete.
	 */
	useEffect( () => {
		if (
			( categories?.length > 0 || ! isResolvingPatterns ) &&
			isLoading
		) {
			setIsLoading( false );
		}
	}, [ isLoading, categories, isResolvingPatterns ] );

	if ( isLoading ) {
		return (
			<WCSpinner className="block-editor-inserter__categories-panel-spinner" />
		);
	}

	if ( ! categories.length && ! isResolvingPatterns ) {
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
