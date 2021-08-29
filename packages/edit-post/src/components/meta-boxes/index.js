/**
 * External dependencies
 */
import { map } from 'lodash';

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
	const {
		metaBoxes,
		isVisible,
		metaBoxesInitialized,
		isEditorReady,
	} = useSelect(
		( select ) => {
			const { __unstableIsEditorReady } = select( editorStore );
			const {
				isMetaBoxLocationVisible,
				getMetaBoxesPerLocation,
				metaBoxesInitialized: _metaBoxesInitialized,
			} = select( editPostStore );
			return {
				metaBoxes: getMetaBoxesPerLocation( location ),
				isVisible: isMetaBoxLocationVisible( location ),
				metaBoxesInitialized: _metaBoxesInitialized(),
				isEditorReady: __unstableIsEditorReady(),
			};
		},
		[ location ]
	);

	// When editor is ready, initialize postboxes (wp core script) and metabox
	// saving. This initializes all meta box locations, not just this specific
	// one.
	useEffect( () => {
		if ( isEditorReady ) {
			registry.dispatch( editPostStore ).initializeMetaBoxes();
		}
	}, [ isEditorReady ] );

	if ( ! metaBoxesInitialized ) {
		return null;
	}

	return (
		<>
			{ map( metaBoxes, ( { id } ) => (
				<MetaBoxVisibility key={ id } id={ id } />
			) ) }
			{ isVisible && <MetaBoxesArea location={ location } /> }
		</>
	);
}
