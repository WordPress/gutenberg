/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

export default function MetaBoxVisibility( { id } ) {
	const isVisible = useSelect(
		( select ) => {
			return select( editorStore ).isEditorPanelEnabled(
				`meta-box-${ id }`
			);
		},
		[ id ]
	);

	useEffect( () => {
		const element = document.getElementById( id );
		if ( ! element ) {
			return;
		}

		if ( isVisible ) {
			element.classList.remove( 'is-hidden' );
		} else {
			element.classList.add( 'is-hidden' );
		}
	}, [ id, isVisible ] );

	return null;
}
