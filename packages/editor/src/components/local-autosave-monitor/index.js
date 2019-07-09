/**
 * External dependencies
 */
import { once } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { ifCondition } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import AutosaveMonitor from '../autosave-monitor';

const AUTOSAVE_INTERVAL_SECONDS = 15;

const hasLocalStorageSupport = once( () => {
	try {
		// Private Browsing in Safari 10 and earlier will throw an error when
		// attempting to set into localStorage. The test here is intentional in
		// causing a thrown error as condition for using fallback object storage.
		window.localStorage.setItem( '__wpEditorTestLocalStorage', '' );
		window.localStorage.removeItem( '__wpEditorTestLocalStorage' );
		return true;
	} catch ( error ) {
		return false;
	}
} );

function LocalAutosaveMonitor() {
	const {
		postId,
		getEditedPostAttribute,
	} = useSelect( ( select ) => ( {
		postId: select( 'core/editor' ).getCurrentPostId(),
		getEditedPostAttribute: select( 'core/editor' ).getEditedPostAttribute,
	} ) );

	const autosave = useCallback( () => {
		window.localStorage.setItem( 'post_' + postId, JSON.stringify( {
			post_title: getEditedPostAttribute( 'title' ),
			content: getEditedPostAttribute( 'content' ),
			excerpt: getEditedPostAttribute( 'excerpt' ),
		} ) );
	}, [ postId, getEditedPostAttribute ] );

	return (
		<AutosaveMonitor
			interval={ AUTOSAVE_INTERVAL_SECONDS }
			autosave={ autosave }
		/>
	);
}

export default ifCondition( hasLocalStorageSupport )( LocalAutosaveMonitor );
