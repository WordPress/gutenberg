/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
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
		</>
	);
}

export default BlockPatternsTab;
