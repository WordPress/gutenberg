/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

import { focus } from '@wordpress/dom';

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
	const container = useRef();

	useEffect( () => {
		const timeout = setTimeout( () => {
			const [ firstTabbable ] = focus.tabbable.find( container.current );
			firstTabbable?.focus();
		} );
		return () => clearTimeout( timeout );
	}, [ category ] );

	// Move to zoom out mode when this component is mounted
	// and back to the previous mode when unmounted.
	useZoomOut();

	return (
		<div
			ref={ container }
			className="block-editor-inserter__patterns-category-dialog"
		>
			<PatternCategoryPreviews
				key={ category.name }
				rootClientId={ rootClientId }
				onInsert={ onInsert }
				onHover={ onHover }
				category={ category }
				showTitlesAsTooltip={ showTitlesAsTooltip }
				patternFilter={ patternFilter }
			/>
		</div>
	);
}
