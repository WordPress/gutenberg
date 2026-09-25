import clsx from 'clsx';
import { useRef, useLayoutEffect } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { store as editPostStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

const { useNativeUndo } = unlock( blockEditorPrivateApis );

/**
 * Moves `node` to the end of `parent`.
 *
 * `moveBefore` keeps the subtree's state, where `appendChild` reloads any
 * iframe in it. That reload breaks a classic editor rendered by a meta box.
 * `moveBefore` only works between connected nodes.
 *
 * @param {Element} parent Element to move into.
 * @param {Element} node   Element to move.
 */
function move( parent, node ) {
	if ( parent.moveBefore && parent.isConnected && node.isConnected ) {
		parent.moveBefore( node, null );
	} else {
		parent.appendChild( node );
	}
}

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

	// A layout effect because the cleanup has to run before React detaches the
	// meta boxes: `moveBefore` needs them connected.
	useLayoutEffect( () => {
		formRef.current = document.querySelector(
			'.metabox-location-' + location
		);

		if ( formRef.current ) {
			move( container.current, formRef.current );
		}

		return () => {
			if ( formRef.current ) {
				move( document.querySelector( '#metaboxes' ), formRef.current );
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
