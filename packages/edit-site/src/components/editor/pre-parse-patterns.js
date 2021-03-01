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

		const asyncQueue = createQueue();
		const append = ( index ) => () => {
			if ( patterns.length <= index ) {
				return;
			}
			select( blockEditorStore ).__experimentalGetParsedBlocks(
				patterns[ index ].content,
				index
			);
			asyncQueue.add( {}, append( index + 1 ) );
		};
		asyncQueue.add( {}, append( 0 ) );

		return () => asyncQueue.reset();
	}, [ patterns ] );

	return null;
}
