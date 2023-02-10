/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

export function useNonReactObserver( clientId ) {
	const { __unstableIframeIncompatible } = useDispatch( blockEditorStore );
	return useRefEffect( ( node ) => {
		const observer = new node.ownerDocument.defaultView.MutationObserver(
			( mutationList ) => {
				for ( const mutation of mutationList ) {
					for ( const addedNode of mutation.addedNodes ) {
						if ( ! addedNode.isConnected ) continue;

						if (
							addedNode.isContentEditable ||
							addedNode.parentElement.isContentEditable
						)
							continue;

						if (
							Object.keys( addedNode ).some( ( i ) => {
								// Yes, React could change this at any point,
								// but we'll know when we update the version.
								return i.startsWith( '__react' );
							} )
						)
							continue;

						__unstableIframeIncompatible( clientId );
					}
				}
			}
		);
		observer.observe( node, { childList: true, subtree: true } );
		return () => {
			observer.disconnect( node );
		};
	}, [] );
}
