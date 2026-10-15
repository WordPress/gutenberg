import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import type { Field } from '@wordpress/dataviews';
import type { BasePostWithEmbeddedAuthor } from '@wordpress/fields';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import { ATTACHMENT_POST_TYPE } from '../../store/constants';
import { useFields } from '../../dataviews/fields-loader';

function usePostFields( {
	postType,
}: {
	postType: string;
} ): Field< BasePostWithEmbeddedAuthor >[] {
	const { registerPostTypeSchema } = unlock( useDispatch( editorStore ) );
	useEffect( () => {
		registerPostTypeSchema( postType );
	}, [ registerPostTypeSchema, postType ] );

	// The media editor keeps the attachment fields the editor registers
	// itself; the other post types read theirs from the server.
	const isAttachment = postType === ATTACHMENT_POST_TYPE;

	const clientFields = useSelect(
		( select ) =>
			isAttachment
				? unlock( select( editorStore ) ).getEntityFields(
						'postType',
						postType
					)
				: undefined,
		[ isAttachment, postType ]
	);

	const { fields: serverFields } = useFields< BasePostWithEmbeddedAuthor >( {
		kind: 'postType',
		name: postType,
		isEnabled: ! isAttachment,
	} );

	return isAttachment ? clientFields : serverFields;
}

/**
 * Hook to get the fields for a post (BasePost or BasePostWithEmbeddedAuthor).
 */
export default usePostFields;
