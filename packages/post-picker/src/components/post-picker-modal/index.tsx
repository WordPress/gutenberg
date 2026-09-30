import { Modal } from '@wordpress/components';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { DataViewsPicker } from '@wordpress/dataviews';
import type {
	ActionButton,
	Field,
	SupportedLayouts,
	View,
} from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { SelectControl, Stack } from '@wordpress/ui';
import type { PostPickerConfig, PostPickerPost } from '../../store/types';

export interface PostPickerModalProps extends PostPickerConfig {
	/**
	 * Called with the selected posts when the user confirms the selection.
	 */
	onSelect: ( posts: PostPickerPost[] ) => void;

	/**
	 * Called when the modal is dismissed.
	 */
	onClose: () => void;
}

type PostType = {
	slug: string;
	hierarchical?: boolean;
	labels?: { name?: string; singular_name?: string };
};

const defaultView: View = {
	type: 'pickerTable',
	titleField: 'title',
	fields: [ 'parent', 'author', 'date' ],
	perPage: 20,
	page: 1,
	search: '',
	sort: { field: 'date', direction: 'desc' },
};

const defaultLayouts: SupportedLayouts = {
	pickerTable: {},
};

function getTitle( item: PostPickerPost ) {
	return (
		item.title?.raw ||
		decodeEntities( item.title?.rendered ?? '' ) ||
		__( '(no title)' )
	);
}

function getEmbedded( item: PostPickerPost, key: string ) {
	const embedded = item._embedded as
		Record< string, Array< Record< string, any > > > | undefined;
	return embedded?.[ key ]?.[ 0 ];
}

/**
 * A modal for searching and selecting posts of one or more post types.
 *
 * Most callers should use the `pickPosts` action instead, which renders this
 * modal and returns the selection as a promise.
 */
export default function PostPickerModal( {
	postType,
	multiple = false,
	value,
	query,
	title,
	selectLabel,
	onSelect,
	onClose,
}: PostPickerModalProps ) {
	const postTypeSlugs = Array.isArray( postType ) ? postType : [ postType ];
	const [ activePostType, setActivePostType ] = useState(
		postTypeSlugs[ 0 ]
	);
	const [ view, setView ] = useState< View >( defaultView );
	const [ selection, setSelection ] = useState< string[] >( () =>
		( value ?? [] ).map( String )
	);

	const allPostTypes = useSelect(
		( select ) =>
			select( coreStore ).getPostTypes( { per_page: -1 } ) as
				PostType[] | null,
		[]
	);
	const postTypes = useMemo(
		() =>
			postTypeSlugs
				.map( ( slug ) =>
					allPostTypes?.find(
						( postTypeObject ) => postTypeObject.slug === slug
					)
				)
				.filter( ( postTypeObject ): postTypeObject is PostType =>
					Boolean( postTypeObject )
				),
		// `postTypeSlugs` is rebuilt on every render, so depend on its contents.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ allPostTypes, postTypeSlugs.join() ]
	);
	const isHierarchical = !! postTypes.find(
		( postTypeObject ) => postTypeObject.slug === activePostType
	)?.hierarchical;

	const queryArgs = useMemo(
		() => ( {
			per_page: view.perPage,
			page: view.page,
			search: view.search || undefined,
			orderby: view.sort?.field,
			order: view.sort?.direction,
			_embed: 'author,up',
			...query,
		} ),
		[ view, query ]
	);

	const {
		records,
		isResolving: isLoading,
		totalItems,
		totalPages,
	} = useEntityRecords< PostPickerPost >(
		'postType',
		activePostType,
		queryArgs
	);

	const paginationInfo = useMemo(
		() => ( {
			totalItems: totalItems ?? 0,
			totalPages: totalPages ?? 0,
		} ),
		[ totalItems, totalPages ]
	);

	const fields: Field< PostPickerPost >[] = useMemo(
		() => [
			{
				id: 'title',
				type: 'text',
				label: __( 'Title' ),
				getValue: ( { item } ) => getTitle( item ),
				enableHiding: false,
				filterBy: false,
			},
			...( isHierarchical
				? [
						{
							id: 'parent',
							type: 'text' as const,
							label: __( 'Parent' ),
							getValue: ( { item }: { item: PostPickerPost } ) =>
								decodeEntities(
									getEmbedded( item, 'up' )?.title
										?.rendered ?? ''
								),
							enableSorting: false,
							filterBy: false as const,
						},
					]
				: [] ),
			{
				id: 'author',
				type: 'text',
				label: __( 'Author' ),
				getValue: ( { item } ) =>
					getEmbedded( item, 'author' )?.name ?? '',
				enableSorting: false,
				filterBy: false,
			},
			{
				id: 'date',
				type: 'datetime',
				label: __( 'Date' ),
				getValue: ( { item } ) => item.date as string,
				filterBy: false,
			},
		],
		[ isHierarchical ]
	);

	const actions: ActionButton< PostPickerPost >[] = useMemo(
		() => [
			{
				id: 'select',
				label: selectLabel ?? __( 'Select' ),
				isPrimary: true,
				supportsBulk: multiple,
				async callback( items, { registry } ) {
					if ( ! selection.length ) {
						return;
					}
					// The selection can span pages, so fetch the selected
					// posts rather than reading them from the current page.
					const selectedPosts: PostPickerPost[] | null =
						await registry
							.resolveSelect( coreStore )
							.getEntityRecords( 'postType', activePostType, {
								...query,
								include: selection.map( Number ),
								orderby: 'include',
								per_page: -1,
								_embed: 'author,up',
							} );
					onSelect( selectedPosts ?? [] );
				},
			},
		],
		[ selectLabel, multiple, selection, activePostType, query, onSelect ]
	);

	const postTypeItems = postTypes.map( ( postTypeObject ) => ( {
		value: postTypeObject.slug,
		label: postTypeObject.labels?.singular_name ?? postTypeObject.slug,
	} ) );

	return (
		<Modal
			title={ title ?? __( 'Choose content' ) }
			onRequestClose={ onClose }
			overlayClassName="post-picker-modal"
			size="large"
		>
			<DataViewsPicker
				data={ records ?? [] }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				actions={ actions }
				selection={ selection }
				onChangeSelection={ setSelection }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ defaultLayouts }
				getItemId={ ( item: PostPickerPost ) => String( item.id ) }
				itemListLabel={ title ?? __( 'Choose content' ) }
			>
				<Stack
					direction="row"
					align="end"
					justify="space-between"
					gap="sm"
					className="dataviews__view-actions"
				>
					<Stack direction="row" align="end" gap="sm">
						<DataViewsPicker.Search />
						{ postTypeItems.length > 1 && (
							<SelectControl
								label={ __( 'Content type' ) }
								items={ postTypeItems }
								value={ postTypeItems.find(
									( item ) => item.value === activePostType
								) }
								onValueChange={ ( item ) => {
									if ( ! item?.value ) {
										return;
									}
									// Selected posts are fetched from the
									// active post type, so clear the selection
									// when switching.
									setActivePostType( item.value );
									setSelection( [] );
									setView( ( currentView ) => ( {
										...currentView,
										page: 1,
									} ) );
								} }
							/>
						) }
					</Stack>
					<DataViewsPicker.ViewConfig />
				</Stack>
				<DataViewsPicker.Layout />
				<DataViewsPicker.Footer />
			</DataViewsPicker>
		</Modal>
	);
}
