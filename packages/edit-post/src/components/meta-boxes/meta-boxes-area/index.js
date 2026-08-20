import clsx from 'clsx';
import { useRef, useEffect } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { store as editPostStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

const { useNativeUndo } = unlock( blockEditorPrivateApis );

/**
 * Render metabox area.
 *
 * @param {Object} props          Component props.
 * @param {string} props.location metabox location.
 * @return {Component} The component to be rendered.
 */
function MetaBoxesArea( { location } ) {
	const container = useRef( null );
	const formRef = useRef( null );

	useEffect( () => {
		formRef.current = document.querySelector(
			'.metabox-location-' + location
		);

		if ( formRef.current ) {
			container.current.appendChild( formRef.current );
		}

		return () => {
			if ( formRef.current ) {
				document
					.querySelector( '#metaboxes' )
					.appendChild( formRef.current );
			}
		};
	}, [ location ] );

	const isSaving = useSelect( ( select ) => {
		return select( editPostStore ).isSavingMetaBoxes();
	}, [] );

	const classes = clsx( 'edit-post-meta-boxes-area', `is-${ location }`, {
		'is-loading': isSaving,
	} );

	// Meta box fields are not part of the editor history, so undo and redo
	// within them must remain the browser's own.
	const nativeUndoRef = useNativeUndo();

	return (
		<div className={ classes } ref={ nativeUndoRef }>
			{ isSaving && (
				<Spinner className="edit-post-meta-boxes-area__spinner" />
			) }
			<div
				className="edit-post-meta-boxes-area__container"
				ref={ container }
			/>
			<div className="edit-post-meta-boxes-area__clear" />
		</div>
	);
}

export default MetaBoxesArea;
