/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

import { focus } from '@wordpress/dom';

/**
 * Internal dependencies
 */

import { PatternsCategoryPreviews } from './category-previews';

export function PatternsCategoryPreviewPanel( {
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

	return (
		<div
			ref={ container }
			className="block-editor-inserter__patterns-category-dialog"
		>
			<PatternsCategoryPreviews
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
