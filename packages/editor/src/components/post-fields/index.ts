/**
 * WordPress dependencies
 */
import { useEffect, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import type { Field } from '@wordpress/dataviews';
import type { BasePostWithEmbeddedAuthor } from '@wordpress/fields';
import { useFieldCollections } from '@wordpress/field-collections';

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
	// Registers the entity actions and the editor-only preview field.
	const { registerPostTypeSchema } = unlock( useDispatch( editorStore ) );
	useEffect( () => {
		registerPostTypeSchema( postType );
	}, [ registerPostTypeSchema, postType ] );

	// The preview field (and any other editor-store field) registered above.
	const editorFields = useSelect(
		( select ) => {
			const { getEntityFields } = unlock( select( editorStore ) );
			return getEntityFields( 'postType', postType );
		},
		[ postType ]
	);

	// The serializable field definitions plus their non-serializable
	// extensions, merged from the field collections registered server-side.
	const collectionFields = useFieldCollections< BasePostWithEmbeddedAuthor >(
		'postType',
		postType
	);

	return useMemo(
		() => [ ...editorFields, ...collectionFields ],
		[ editorFields, collectionFields ]
	);
}

/**
 * Hook to get the fields for a post (BasePost or BasePostWithEmbeddedAuthor).
 */
export default usePostFields;
