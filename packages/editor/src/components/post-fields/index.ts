import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
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

	return useFields< BasePostWithEmbeddedAuthor >( {
		kind: 'postType',
		name: postType,
	} ).fields;
}

/**
 * Hook to get the fields for a post (BasePost or BasePostWithEmbeddedAuthor).
 */
export default usePostFields;
