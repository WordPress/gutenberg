/**
 * WordPress dependencies
 */
import { useSelect, select } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createQueue } from '@wordpress/priority-queue';

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

		window.console.time( '[usePreParsePatterns] initiate queue' );
		const asyncQueue = createQueue( 1 );
		const append = ( index ) => () => {
			const marker = `[usePreParsePatterns] process ${ index } ${ patterns[ index ].title }`;
			window.console.time( marker );
			if ( patterns.length <= index ) {
				window.console.timeEnd( marker );
				return;
			}
			select( blockEditorStore ).__experimentalGetParsedBlocks(
				patterns[ index ].content,
				index
			);
			asyncQueue.add( {}, append( index + 1 ) );
			window.console.timeEnd( marker );
		};
		asyncQueue.add( {}, append( 0 ) );
		window.console.timeEnd( '[usePreParsePatterns] initiate queue' );

		return () => asyncQueue.reset();
	}, [ patterns ] );

	return null;
}
