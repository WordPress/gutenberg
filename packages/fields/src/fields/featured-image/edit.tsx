import { withFilters } from '@wordpress/components';
import {
	store as coreStore,
	useEntityId,
	type Attachment,
	type Type,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { MediaEditControl } from '../../components/media-edit';
import type { BasePostWithEmbeddedFeaturedMedia } from '../../types';

type Item = BasePostWithEmbeddedFeaturedMedia;

const FilteredMediaEdit = withFilters( 'editor.PostFeaturedImage' )(
	function PostFeaturedImage(
		props: DataFormControlProps< Item > & {
			postType: Type< 'edit' > | undefined;
		}
	) {
		return (
			<MediaEditControl
				{ ...props }
				isExpanded
				isPickerFiltered
				featuredImageFlow
				pickerTitle={
					props.postType?.labels?.featured_image || props.field.label
				}
			/>
		);
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
 * `featuredImageId`, `media` and `postType`, and its `onRemoveImage` handler;
 * its picker resolves through the `editor.MediaUpload` filter, as the classic
 * panel's does. Callbacks of either filter may read the props to render their
 * own controls next to the picker and may act through the editor store
 * (`editPost`, `useEntityProp`), which is why this only renders where that
 * store's current post is the item (see `FeaturedImageEdit`).
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
 * context, the control goes through the `editor.PostFeaturedImage` filter and
 * its picker through `editor.MediaUpload`, so plugins that extend the classic
 * featured image panel or its media picker keep working. Elsewhere, such as
 * Quick Edit, it renders the media control directly, with the plain picker.
 *
 * @param props The DataForm control props.
 */
export default function FeaturedImageEdit(
	props: DataFormControlProps< Item >
) {
	const { data } = props;
	const labels = useSelect(
		( select ) => select( coreStore ).getPostType( data.type )?.labels,
		[ data.type ]
	);
	const setFeaturedImageLabel = labels?.set_featured_image;
	// The post type's labels, as the classic panel's button and frame use.
	const field = useMemo(
		() =>
			setFeaturedImageLabel
				? { ...props.field, placeholder: setFeaturedImageLabel }
				: props.field,
		[ props.field, setFeaturedImageLabel ]
	);
	// The post and site editor load different APIs. Callbacks written for the
	// classic panel and its picker may rely on `core/editor` selectors, actions
	// (e.g. `editPost`), `useEntityProp` without an id, or on plugins only
	// loaded in the post editor, so the filters can't be offered safely in
	// Quick Edit. They only apply where the item is the entity in context, as
	// in the post editor. A callback that only reads the passed props would
	// work in Quick Edit too, but it can't be told apart from the others, so
	// none apply.
	const contextId = useEntityId( 'postType', data.type );
	if (
		contextId === undefined ||
		String( contextId ) !== String( data.id )
	) {
		return (
			<MediaEditControl
				{ ...props }
				field={ field }
				isExpanded
				featuredImageFlow
				pickerTitle={ labels?.featured_image || field.label }
			/>
		);
	}
	return <FilteredFeaturedImageEdit { ...props } field={ field } />;
}
