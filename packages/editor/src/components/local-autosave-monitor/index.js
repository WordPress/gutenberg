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
import {
	localAutosaveGet,
	localAutosaveClear,
} from '../../store/controls';

const requestIdleCallback = window.requestIdleCallback ? window.requestIdleCallback : window.requestAnimationFrame;

/**
 * Function which returns true if the current environment supports browser
 * sessionStorage, or false otherwise. The result of this function is cached and
 * reused in subsequent invocations.
 */
const hasSessionStorageSupport = once( () => {
	try {
		// Private Browsing in Safari 10 and earlier will throw an error when
		// attempting to set into sessionStorage. The test here is intentional in
		// causing a thrown error as condition bailing from local autosave.
		window.sessionStorage.setItem( '__wpEditorTestSessionStorage', '' );
		window.sessionStorage.removeItem( '__wpEditorTestSessionStorage' );
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
function useAutosaveCallback() {
	const { localAutosave } = useDispatch( 'core/editor' );
	return useCallback( () => {
		requestIdleCallback( localAutosave );
	}, [] );
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
		let autosave = localAutosaveGet( postId );
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
		// saved and that which is stored in sessionStorage.
		const hasDifference = Object.keys( edits ).some( ( key ) => {
			return edits[ key ] !== getEditedPostAttribute( key );
		} );

		if ( ! hasDifference ) {
			// If there is no difference, it can be safely ejected from storage.
			localAutosaveClear( postId );

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
		isDirty,
		isAutosaving,
		didError,
	} = useSelect( ( select ) => ( {
		postId: select( 'core/editor' ).getCurrentPostId(),
		postType: select( 'core/editor' ).getCurrentPostType(),
		isDirty: select( 'core/editor' ).isEditedPostDirty(),
		isAutosaving: select( 'core/editor' ).isAutosavingPost(),
		didError: select( 'core/editor' ).didPostSaveRequestFail(),
	} ) );

	const lastIsDirty = useRef( isDirty );
	const lastIsAutosaving = useRef( isAutosaving );

	useEffect( () => {
		if (
			( lastIsDirty.current && ! isDirty ) ||
			( lastIsAutosaving.current && ! isAutosaving && ! didError )
		) {
			localAutosaveClear( postId );
		}

		lastIsDirty.current = isDirty;
		lastIsAutosaving.current = isAutosaving;
	}, [ isDirty, isAutosaving, didError ] );
}

function LocalAutosaveMonitor() {
	const autosave = useAutosaveCallback();
	useAutosaveNotice();
	useAutosavePurge();

	const { localAutosaveInterval } = useSelect( ( select ) => ( {
		localAutosaveInterval: select( 'core/editor' )
			.getEditorSettings().__experimentalLocalAutosaveInterval,
	} ) );

	return (
		<AutosaveMonitor
			interval={ localAutosaveInterval }
			autosave={ autosave }
			shouldThrottle
		/>
	);
}

export default ifCondition( hasSessionStorageSupport )( LocalAutosaveMonitor );
