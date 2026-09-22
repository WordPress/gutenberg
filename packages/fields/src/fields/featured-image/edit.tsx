import { withFilters } from '@wordpress/components';
import {
	store as coreStore,
	useEntityId,
	type Attachment,
	type Type,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import type { DataFormControlProps } from '@wordpress/dataviews';
import MediaEdit from '../../components/media-edit';
import type { BasePostWithEmbeddedFeaturedMedia } from '../../types';

type Item = BasePostWithEmbeddedFeaturedMedia;

const FilteredMediaEdit = withFilters( 'editor.PostFeaturedImage' )(
	function PostFeaturedImage( props: DataFormControlProps< Item > ) {
		return <MediaEdit { ...props } isExpanded />;
	}
) as unknown as React.ComponentType<
	DataFormControlProps< Item > & {
		currentPostId: Item[ 'id' ];
		featuredImageId: number;
		media: Attachment< 'view' > | null;
		postType: Type< 'edit' > | undefined;
		onRemoveImage: () => void;
	}
>;

/**
 * The control resolved through the `editor.PostFeaturedImage` filter, with
 * the read-only facts the classic panel passed to it, `currentPostId`,
 * `featuredImageId`, `media` and `postType`, and its `onRemoveImage` handler.
 * Callbacks may read these to render their own controls next to the picker
 * and may act through the editor store (`editPost`, `useEntityProp`), which
 * is why this only renders where that store's current post is the item (see
 * `FeaturedImageEdit`).
 *
 * @param props The DataForm control props.
 */
function FilteredFeaturedImageEdit( props: DataFormControlProps< Item > ) {
	const { data, field, onChange } = props;
	const featuredImageId = field.getValue( { item: data } ) ?? 0;
	const { media, postType } = useSelect(
		( select ) => {
			const { getEntityRecords, getPostType } = select( coreStore );
			return {
				// The same query the media control runs, so this adds no request.
				media: featuredImageId
					? ( (
							getEntityRecords( 'postType', 'attachment', {
								include: [ featuredImageId ],
							} ) as Attachment< 'view' >[] | null
						 )?.[ 0 ] ?? null )
					: null,
				postType: getPostType( data.type ),
			};
		},
		[ featuredImageId, data.type ]
	);
	return (
		<FilteredMediaEdit
			{ ...props }
			currentPostId={ data.id }
			featuredImageId={ featuredImageId }
			media={ media }
			postType={ postType }
			onRemoveImage={ () =>
				onChange( field.setValue( { item: data, value: undefined } ) )
			}
		/>
	);
}

/**
 * Edit control of the featured image field.
 *
 * In the post editor, where the item is the post in the surrounding entity
 * context, the control goes through the `editor.PostFeaturedImage` filter so
 * plugins that extend the classic featured image panel keep working.
 * Elsewhere, such as Quick Edit, it renders the media control directly.
 *
 * @param props The DataForm control props.
 */
export default function FeaturedImageEdit(
	props: DataFormControlProps< Item >
) {
	const { data } = props;
	// The post and site editor load different APIs. Callbacks written for the
	// classic panel may rely on `core/editor` selectors, actions (e.g.
	// `editPost`), `useEntityProp` without an id, or on plugins only loaded in
	// the post editor, so the filter can't be offered safely in Quick Edit. It
	// only applies where the item is the entity in context, as in the post
	// editor. A callback that only reads the passed props would work in Quick
	// Edit too, but it can't be told apart from the others, so none apply.
	const contextId = useEntityId( 'postType', data.type );
	if (
		contextId === undefined ||
		String( contextId ) !== String( data.id )
	) {
		return <MediaEdit { ...props } isExpanded />;
	}
	return <FilteredFeaturedImageEdit { ...props } />;
}
