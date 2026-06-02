/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import type { Field } from '@wordpress/dataviews';
import type { BasePostWithEmbeddedAuthor } from '@wordpress/fields';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

function usePostFields( {
	postType,
}: {
	postType: string;
} ): Field< BasePostWithEmbeddedAuthor >[] {
	const { registerPostTypeSchema } = unlock( useDispatch( editorStore ) );
	useEffect( () => {
		registerPostTypeSchema( postType );
	}, [ registerPostTypeSchema, postType ] );

	const { fields } = useSelect(
		( select ) => {
			const { getEntityFields } = unlock( select( editorStore ) );
			return {
				fields: getEntityFields( 'postType', postType ),
			};
		},
		[ postType ]
	);

	return fields;
}

/**
 * Hook to get the fields for a post (BasePost or BasePostWithEmbeddedAuthor).
 */
export default usePostFields;
