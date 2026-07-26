/**
 * WordPress dependencies
 */
import { useBlockProps, BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarDropdownMenu } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { resultsFound, displayingResults } from './icons';

/**
 * QueryTotalEdit component.
 *
 * @param {Object}   props               Component props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Block attributes setter.
 * @param {Object}   props.context       Block context.
 */
export default function QueryTotalEdit( {
	attributes,
	setAttributes,
	context,
} ) {
	const { displayType } = attributes;
	const blockProps = useBlockProps();

	// Destructure query object from context with defaults.
	const {
		perPage = 10,
		pages = 0,
		offset = 0,
		postType = 'post',
		order = 'desc',
		orderBy = 'date',
		author,
		search,
		exclude = [],
		sticky,
		taxQuery = {},
		parents = [],
		format = [],
	} = context?.query || {};

	// Build query arguments for fetching posts.
	const queryArgs = {
		per_page: perPage,
		page: pages > 0 ? pages : 1,
		offset,
		order,
		orderby: orderBy,
		...( author && { author } ),
		...( search?.trim() && { search: search.trim() } ),
		...( exclude.length && { exclude: exclude.join( ',' ) } ),
		...( sticky && { sticky } ),
		...( taxQuery.post_tag?.length && {
			tags: taxQuery.post_tag.join( ',' ),
		} ),
		...( taxQuery.category?.length && {
			categories: taxQuery.category.join( ',' ),
		} ),
		...( parents.length && { parent: parents.join( ',' ) } ),
		...( format.length && { format: format.join( ',' ) } ),
	};

	// Fetch posts using the built queryArgs.
	const { totalItems } = useEntityRecords( 'postType', postType, queryArgs );
	const totalResults = totalItems || 0;
	const currentPage = queryArgs.page;
	const postsPerPage = queryArgs.per_page;

	// Determine which icon to display based on the display type.
	const getButtonPositionIcon = () =>
		displayType === 'range-display' ? displayingResults : resultsFound;

	// Define toolbar controls for switching between display modes.
	const buttonPositionControls = [
		{
			role: 'menuitemradio',
			title: __( 'Total results' ),
			isActive: displayType === 'total-results',
			icon: resultsFound,
			onClick: () => setAttributes( { displayType: 'total-results' } ),
		},
		{
			role: 'menuitemradio',
			title: __( 'Range display' ),
			isActive: displayType === 'range-display',
			icon: displayingResults,
			onClick: () => setAttributes( { displayType: 'range-display' } ),
		},
	];

	// Render the display text dynamically.
	const renderDisplay = () => {
		if ( ! totalResults ) {
			return <>{ __( 'No results found' ) }</>;
		}

		if ( displayType === 'total-results' ) {
			/* translators: %1$d: number of results. */
			return <>{ sprintf( __( '%1$d results found' ), totalResults ) }</>;
		}

		if ( displayType === 'range-display' ) {
			const start = ( currentPage - 1 ) * postsPerPage + 1;
			const end = Math.min( currentPage * postsPerPage, totalResults );
			return (
				<>
					{ sprintf(
						// translators: %1$d: starting post number, %2$d: ending post number, %3$d: total results.
						__( 'Displaying %1$d – %2$d of %3$d' ),
						start,
						end,
						totalResults
					) }
				</>
			);
		}

		return null;
	};

	return (
		<div { ...blockProps }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarDropdownMenu
						icon={ getButtonPositionIcon() }
						label={ __( 'Change display type' ) }
						controls={ buttonPositionControls }
					/>
				</ToolbarGroup>
			</BlockControls>
			{ renderDisplay() }
		</div>
	);
}
