/**
 * WordPress dependencies
 */
import { useSelect, select } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export function usePreParsePatterns() {
	const patterns = useSelect(
		( _select ) =>
			_select( editSiteStore ).getSettings().__experimentalBlockPatterns,
		[]
	);

	useEffect( () => {
		if ( ! patterns ) {
			return;
		}

		let handle;
		let index = -1;
		window.console.time( '[usePreParsePatterns] initiate queue' );
		const callback = () => {
			index++;
			const marker = `[usePreParsePatterns] process ${ index } ${ patterns[ index ].title }`;
			window.console.time( marker );
			if ( patterns.length > index ) {
				select( blockEditorStore ).__experimentalGetParsedBlocks(
					patterns[ index ].content,
					index
				);
				window.requestIdleCallback( callback );
			}
			window.console.timeEnd( marker );
		};
		window.requestIdleCallback( callback );
		window.console.timeEnd( '[usePreParsePatterns] initiate queue' );

		return () => window.cancelIdleCallback( handle );
	}, [ patterns ] );

	return null;
}
