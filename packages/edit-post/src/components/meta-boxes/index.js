/**
 * WordPress dependencies
 */
import { useSelect, useRegistry } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import MetaBoxesArea from './meta-boxes-area';
import MetaBoxVisibility from './meta-box-visibility';
import { store as editPostStore } from '../../store';

export default function MetaBoxes( { location } ) {
	const registry = useRegistry();
	const { metaBoxes, areMetaBoxesInitialized, isEditorReady } = useSelect(
		( select ) => {
			const { __unstableIsEditorReady } = select( editorStore );
			const {
				getMetaBoxesPerLocation,
				areMetaBoxesInitialized: _areMetaBoxesInitialized,
			} = select( editPostStore );
			return {
				metaBoxes: getMetaBoxesPerLocation( location ),
				areMetaBoxesInitialized: _areMetaBoxesInitialized(),
				isEditorReady: __unstableIsEditorReady(),
			};
		},
		[ location ]
	);

	const hasMetaBoxes = !! metaBoxes?.length;

	// When editor is ready, initialize postboxes (wp core script) and metabox
	// saving. This initializes all meta box locations, not just this specific
	// one.
	useEffect( () => {
		if ( isEditorReady && hasMetaBoxes && ! areMetaBoxesInitialized ) {
			registry.dispatch( editPostStore ).initializeMetaBoxes();
		}
	}, [ isEditorReady, hasMetaBoxes, areMetaBoxesInitialized ] );

	if ( ! areMetaBoxesInitialized ) {
		return null;
	}

	return (
		<>
			{ ( metaBoxes ?? [] ).map( ( { id } ) => (
				<MetaBoxVisibility key={ id } id={ id } />
			) ) }
			<MetaBoxesArea location={ location } />
		</>
	);
}
