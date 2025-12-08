/**
 * WordPress dependencies
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { Modal } from '@wordpress/components';
import { DataViewsPicker } from '@wordpress/dataviews';
import type { View, Field, ActionButton } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { PostPickerModalProps, PostData } from './types';
import { usePostPickerContext } from './context';
import { unlock } from '../../lock-unlock';
import usePostFields from '../post-fields';

// @ts-ignore
const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );

// Layout constants - matching the picker layout types
const LAYOUT_PICKER_GRID = 'pickerGrid';
const LAYOUT_PICKER_TABLE = 'pickerTable';

/**
 * PostPickerModalUI component that uses Modal and DataViewsPicker for post selection.
 *
 * This is the internal UI component. Use the context-based PostPickerModal wrapper instead.
 *
 * @param props               Component props
 * @param props.isOpen        Whether the modal is open
 * @param props.onClose       Function called when modal is closed
 * @param props.onSelect      Function called when a post is selected
 * @param props.postType      The post type slug to filter (e.g., 'page')
 * @param props.excludePostId Optional: Post ID to exclude from results
 * @param props.title         Optional: Custom title for the modal
 * @return JSX element or null
 */
function PostPickerModalUI( {
	isOpen,
	onClose,
	onSelect,
	postType,
	excludePostId,
	title,
}: PostPickerModalProps ) {
	const [ selection, setSelection ] = useState< string[] >( [] );
	// Initialize view with fields to display and title field configuration
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_PICKER_TABLE,
		fields: [ 'title', 'author', 'status', 'date' ],
		titleField: 'title',
	} );

	// Get registered fields for the post type
	const registeredFields = usePostFields( { postType } );

	// Build query args for fetching posts based on view state (pagination, search, sorting)
	const queryArgs = useMemo( () => {
		const args: Record< string, unknown > = {
			per_page: view.perPage || 20,
			page: view.page || 1,
			status: 'publish',
			order: view.sort?.direction || 'asc',
			orderby: view.sort?.field || 'title',
			// Embed author data so we can display author names
			_embed: 'author',
		};

		// Add search if present
		if ( view.search ) {
			args.search = view.search;
		}

		// Exclude the current post if provided
		if ( excludePostId ) {
			args.exclude = [ excludePostId ];
		}

		// TODO: Consider adding parent_exclude to prevent circular hierarchies
		// This would require fetching descendants of excludePostId first

		return args;
	}, [ view, excludePostId ] );

	// Fetch posts using WordPress core data
	const {
		records: posts,
		isResolving: isLoading,
		totalItems,
		totalPages,
	} = useEntityRecordsWithPermissions( 'postType', postType, queryArgs );

	// Filter fields to display in DataViewsPicker - use registered fields when available
	// Show useful fields for identifying and selecting items: title, author, status, date
	const fields: Field< PostData >[] = useMemo( () => {
		if ( ! registeredFields || registeredFields.length === 0 ) {
			// Fallback to basic fields if registration hasn't completed
			return [
				{
					id: 'title',
					type: 'text' as const,
					label: __( 'Title' ),
					getValue: ( { item }: { item: PostData } ) => {
						const titleValue =
							item.title.raw || item.title.rendered;
						return titleValue || __( '(no title)' );
					},
				},
				{
					id: 'author',
					type: 'text' as const,
					label: __( 'Author' ),
					getValue: ( { item }: { item: PostData } ) => {
						// Fallback author display if embedded data not available
						return (
							item._embedded?.author?.[ 0 ]?.name ||
							__( 'Unknown' )
						);
					},
				},
				{
					id: 'status',
					type: 'text' as const,
					label: __( 'Status' ),
					getValue: ( { item }: { item: PostData } ) => {
						const statusMap: Record< string, string > = {
							publish: __( 'Published' ),
							draft: __( 'Draft' ),
							pending: __( 'Pending' ),
							private: __( 'Private' ),
							future: __( 'Scheduled' ),
							trash: __( 'Trash' ),
						};
						return statusMap[ item.status ] || item.status;
					},
				},
				{
					id: 'date',
					type: 'text' as const,
					label: __( 'Date' ),
					getValue: ( { item }: { item: PostData } ) => {
						if ( ! item.modified ) {
							return '';
						}
						const date = new Date( item.modified );
						return date.toLocaleDateString();
					},
				},
			];
		}

		// Use registered fields and display the ones that are most useful for selection
		// Priority: title (always), author, status, date - matches the sidebar fields
		const fieldIdsToDisplay = [ 'title', 'author', 'status', 'date' ];
		return registeredFields
			.filter( ( field ) => fieldIdsToDisplay.includes( field.id ) )
			.map( ( field ) => ( {
				...field,
				// Cast to PostData to align types
			} ) ) as Field< PostData >[];
	}, [ registeredFields ] );

	// Define actions available in DataViewsPicker
	const actions: ActionButton< PostData >[] = useMemo(
		() => [
			{
				id: 'select',
				label: __( 'Select' ),
				isPrimary: true,
				async callback() {
					if ( selection.length === 0 ) {
						return;
					}

					// Get the first selected post ID
					const selectedPostId = parseInt( selection[ 0 ], 10 );

					// Call the onSelect callback with the post ID
					onSelect( selectedPostId );

					// Clear selection but keep modal open
					setSelection( [] );
				},
			},
		],
		[ selection, onSelect ]
	);

	const handleModalClose = useCallback( () => {
		onClose?.();
	}, [ onClose ] );

	const paginationInfo = useMemo(
		() => ( {
			totalItems,
			totalPages,
		} ),
		[ totalItems, totalPages ]
	);

	const defaultLayouts = useMemo(
		() => ( {
			[ LAYOUT_PICKER_GRID ]: {},
			[ LAYOUT_PICKER_TABLE ]: {},
		} ),
		[]
	);

	// Generate default title based on post type
	const defaultTitle = useMemo( () => {
		const typeNames: Record< string, string > = {
			page: __( 'Select Page' ),
			post: __( 'Select Post' ),
		};
		return typeNames[ postType ] || __( 'Select Item' );
	}, [ postType ] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={ title || defaultTitle }
			onRequestClose={ handleModalClose }
			isDismissible
			size="fill"
			overlayClassName="editor-post-picker-modal"
		>
			<DataViewsPicker
				data={ posts || [] }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				actions={ actions }
				selection={ selection }
				onChangeSelection={ setSelection }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ defaultLayouts }
				getItemId={ ( item: PostData ) => String( item.id ) }
				search
				searchLabel={ __( 'Search posts' ) }
				itemListLabel={ __( 'Posts' ) }
			/>
		</Modal>
	);
}

/**
 * PostPickerModal component that integrates with the PostPickerProvider context.
 * This is the main export that should be rendered within the provider.
 */
export function PostPickerModal() {
	const { state, closePostPicker } = usePostPickerContext();

	return (
		<PostPickerModalUI
			isOpen={ state.isOpen }
			postType={ state.postType }
			excludePostId={ state.excludePostId }
			onSelect={ ( postId: number ) => {
				state.onSelect( postId );
				closePostPicker();
			} }
			onClose={ closePostPicker }
			title={ state.title }
		/>
	);
}

export default PostPickerModal;
