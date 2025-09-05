/**
 * WordPress dependencies
 */
import { useEffect, useMemo } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import type { Field } from '@wordpress/dataviews';
import type { BasePostWithEmbeddedAuthor } from '@wordpress/fields';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

interface UsePostFieldsReturn {
	isLoading: boolean;
	fields: Field< BasePostWithEmbeddedAuthor >[];
}

interface Author {
	id: number;
	name: string;
}

function usePostFields( {
	postType,
}: {
	postType: string;
} ): UsePostFieldsReturn {
	const { registerPostTypeSchema } = unlock( useDispatch( editorStore ) );
	useEffect( () => {
		registerPostTypeSchema( postType );
	}, [ registerPostTypeSchema, postType ] );

	const { defaultFields } = useSelect(
		( select ) => {
			const { getEntityFields } = unlock( select( editorStore ) );
			return {
				defaultFields: getEntityFields( 'postType', postType ),
			};
		},
		[ postType ]
	);

	const { records: authors, isResolving: isLoadingAuthors } =
		useEntityRecords< Author >( 'root', 'user', { per_page: -1 } );

	const fields = useMemo(
		() =>
			defaultFields.map(
				( field: Field< BasePostWithEmbeddedAuthor > ) => {
					if ( field.id === 'author' ) {
						return {
							...field,
							elements: authors?.map( ( { id, name } ) => ( {
								value: id,
								label: name,
							} ) ),
						};
					}

					return field;
				}
			) as Field< BasePostWithEmbeddedAuthor >[],
		[ authors, defaultFields ]
	);

	return {
		isLoading: isLoadingAuthors,
		fields,
	};
}

/**
 * Hook to get the fields for a post (BasePost or BasePostWithEmbeddedAuthor).
 */
export default usePostFields;
