/**
 * External dependencies
 */
import { once, uniqueId, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { ifCondition } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import AutosaveMonitor from '../autosave-monitor';

/**
 * Time interval at which local autosave should occur after a change, in
 * seconds.
 *
 * @var {number}
 */
const AUTOSAVE_INTERVAL_SECONDS = 15;

/**
 * Function which returns true if the current environment supports browser
 * localStorage, or false otherwise. The result of this function is cached and
 * reused in subsequent invocations.
 */
const hasLocalStorageSupport = once( () => {
	try {
		// Private Browsing in Safari 10 and earlier will throw an error when
		// attempting to set into localStorage. The test here is intentional in
		// causing a thrown error as condition bailing from local autosave.
		window.localStorage.setItem( '__wpEditorTestLocalStorage', '' );
		window.localStorage.removeItem( '__wpEditorTestLocalStorage' );
		return true;
	} catch ( error ) {
		return false;
	}
} );

/**
 * Custom hook which returns a callback function to be invoked when a local
 * autosave should occur.
 *
 * @return {Function} Callback function.
 */
function useAutosaveSaveCallback() {
	const {
		postId,
		getEditedPostAttribute,
	} = useSelect( ( select ) => ( {
		postId: select( 'core/editor' ).getCurrentPostId(),
		getEditedPostAttribute: select( 'core/editor' ).getEditedPostAttribute,
	} ) );

	return useCallback( () => {
		window.localStorage.setItem( 'post_' + postId, JSON.stringify( {
			post_title: getEditedPostAttribute( 'title' ),
			content: getEditedPostAttribute( 'content' ),
			excerpt: getEditedPostAttribute( 'excerpt' ),
		} ) );
	}, [ postId, getEditedPostAttribute ] );
}

/**
 * Custom hook which manages the creation of a notice prompting the user to
 * restore a local autosave, if one exists.
 */
function useAutosaveNotice() {
	const {
		postId,
		getEditedPostAttribute,
	} = useSelect( ( select ) => ( {
		postId: select( 'core/editor' ).getCurrentPostId(),
		getEditedPostAttribute: select( 'core/editor' ).getEditedPostAttribute,
	} ) );

	const { createWarningNotice, removeNotice } = useDispatch( 'core/notices' );
	const { editPost, resetEditorBlocks } = useDispatch( 'core/editor' );

	useEffect( () => {
		let autosave = window.localStorage.getItem( 'post_' + postId );
		if ( ! autosave ) {
			return;
		}

		try {
			autosave = JSON.parse( autosave );
		} catch ( error ) {
			// Not usable if it can't be parsed.
			return;
		}

		const { post_title: title, content, excerpt } = autosave;
		const edits = { title, content, excerpt };

		// Only display a notice if there is a difference between what has been
		// saved and that which is stored in localStorage.
		const hasDifference = Object.keys( edits ).some( ( key ) => {
			return edits[ key ] !== getEditedPostAttribute( key );
		} );

		if ( ! hasDifference ) {
			// If there is no difference, it can be safely ejected from storage.
			window.localStorage.removeItem( 'post_' + postId );

			return;
		}

		const noticeId = uniqueId( 'wpEditorAutosaveRestore' );

		createWarningNotice( __( 'The backup of this post in your browser is different from the version below.' ), {
			id: noticeId,
			actions: [
				{
					label: __( 'Restore the backup' ),
					onClick() {
						editPost( omit( edits, [ 'content' ] ) );
						resetEditorBlocks( parse( edits.content ) );
						removeNotice( noticeId );
					},
				},
			],
		} );
	}, [ postId ] );
}

/**
 * Custom hook which ejects a local autosave after a successful save occurs.
 */
function useAutosavePurge() {
	const {
		postId,
		didSave,
	} = useSelect( ( select ) => ( {
		postId: select( 'core/editor' ).getCurrentPostId(),
		didSave: select( 'core/editor' ).didPostSaveRequestSucceed(),
	} ) );

	const lastDidSave = useRef( didSave );

	useEffect( () => {
		if ( lastDidSave.current !== true && didSave ) {
			window.localStorage.removeItem( 'post_' + postId );
		}

		lastDidSave.current = didSave;
	}, [ didSave ] );
}

function LocalAutosaveMonitor() {
	const autosave = useAutosaveSaveCallback();
	useAutosaveNotice();
	useAutosavePurge();

	return (
		<AutosaveMonitor
			interval={ AUTOSAVE_INTERVAL_SECONDS }
			autosave={ autosave }
		/>
	);
}

export default ifCondition( hasLocalStorageSupport )( LocalAutosaveMonitor );
