/**
 * Internal dependencies
 */

import { PatternCategoryPreviews } from './pattern-category-previews';
import { useZoomOut } from '../../../hooks/use-zoom-out';

export function PatternCategoryPreviewPanel( {
	rootClientId,
	onInsert,
	onHover,
	category,
	showTitlesAsTooltip,
	patternFilter,
} ) {
	// Move to zoom out mode when this component is mounted
	// and back to the previous mode when unmounted.
	useZoomOut();

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
