import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import type { Field } from '@wordpress/dataviews';
import type { BasePostWithEmbeddedAuthor } from '@wordpress/fields';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import { useFields } from '../../dataviews/fields-loader';

function usePostFields( {
	postType,
}: {
	postType: string;
} ): Field< BasePostWithEmbeddedAuthor >[] {
	// The fields come from the server. The schema still registers the
	// actions of the post type, and fires `core.registerPostTypeSchema`.
	const { registerPostTypeSchema } = unlock( useDispatch( editorStore ) );
	useEffect( () => {
		registerPostTypeSchema( postType );
	}, [ registerPostTypeSchema, postType ] );

	const { fields, error } = useFields< BasePostWithEmbeddedAuthor >( {
		kind: 'postType',
		name: postType,
	} );

	// The callers only get the fields, so a failed request would leave their
	// screen without fields and without a word. The notice id is per post
	// type, so the screens that share the fields show it once.
	const { createErrorNotice } = useDispatch( noticesStore );
	useEffect( () => {
		if ( error ) {
			createErrorNotice( error.message, {
				type: 'snackbar',
				id: `editor-post-fields-${ postType }`,
			} );
		}
	}, [ createErrorNotice, error, postType ] );

	return fields;
}

/**
 * Hook to get the fields for a post (BasePost or BasePostWithEmbeddedAuthor).
 */
export default usePostFields;
