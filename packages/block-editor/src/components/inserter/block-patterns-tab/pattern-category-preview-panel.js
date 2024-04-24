/**
 * Internal dependencies
 */

import { PatternCategoryPreviews } from './pattern-category-previews';

export function PatternCategoryPreviewPanel( {
	rootClientId,
	onInsert,
	onHover,
	category,
	showTitlesAsTooltip,
	patternFilter,
} ) {
	return (
		<PatternCategoryPreviews
			key={ category.name }
			rootClientId={ rootClientId }
			onInsert={ onInsert }
			onHover={ onHover }
			category={ category }
			showTitlesAsTooltip={ showTitlesAsTooltip }
			patternFilter={ patternFilter }
		/>
	);
}
