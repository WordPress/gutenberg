/**
 * WordPress dependencies
 */
import { useSelect, select } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';

export function usePreParsePatterns() {
	const patterns = useSelect(
		( _select ) =>
			_select( blockEditorStore ).getSettings()
				.__experimentalBlockPatterns,
		[]
	);

	useEffect( () => {
		if ( ! patterns?.length ) {
			return;
		}

		let handle;
		let index = -1;

		const callback = () => {
			index++;
			if ( index >= patterns.length ) {
				return;
			}

			const marker = `[usePreParsePatterns] process ${ index } ${ patterns[ index ]?.title }`;
			window.console.time( marker );
			select( blockEditorStore ).__experimentalGetParsedBlocks(
				patterns[ index ].content,
				index
			);
			window.console.timeEnd( marker );

			handle = window.requestIdleCallback( callback );
		};

		window.console.time( '[usePreParsePatterns] initiate' );
		window.console.timeEnd( '[usePreParsePatterns] initiate' );

		handle = window.requestIdleCallback( callback );
		return () => window.cancelIdleCallback( handle );
	}, [ patterns ] );

	return null;
}
