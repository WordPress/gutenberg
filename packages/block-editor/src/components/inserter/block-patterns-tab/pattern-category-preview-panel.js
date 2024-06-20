/**
 * Internal dependencies
 */
import { PatternCategoryPreviews } from './pattern-category-previews';
import { useZoomOut } from '../../../hooks/use-zoom-out';

function PatternCategoryPreviewPanelInner( {
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

function PatternCategoryPreviewPanelWithZoomOut( props ) {
	useZoomOut();
	return <PatternCategoryPreviewPanelInner { ...props } />;
}

export function PatternCategoryPreviewPanel( props ) {
	// When the pattern panel is showing, we want to use zoom out mode
	if ( window.__experimentalEnableZoomedOutPatternsTab ) {
		return <PatternCategoryPreviewPanelWithZoomOut { ...props } />;
	}

	return <PatternCategoryPreviewPanelInner { ...props } />;
}
