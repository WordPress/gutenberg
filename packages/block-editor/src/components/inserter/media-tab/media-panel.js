/**
 * WordPress dependencies
 */
import { Spinner, SearchControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDebouncedInput } from '@wordpress/compose';
import { useState, useEffect, useRef } from '@wordpress/element';
import { getScrollContainer } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import MediaList from './media-list';
import { useMediaResults } from './hooks';
import InserterNoResults from '../no-results';
import Pagination from '../../pagination';

const INITIAL_MEDIA_ITEMS_PER_PAGE = 10;

export function MediaCategoryPanel( { rootClientId, onInsert, category } ) {
	const [ search, setSearch, debouncedSearch ] = useDebouncedInput();
	const [ page, setPage ] = useState( 1 );
	const panelRef = useRef();

	// Reset page when search changes.
	useEffect( () => {
		setPage( 1 );
	}, [ debouncedSearch ] );

	const { mediaList, isLoading, hasMore } = useMediaResults( category, {
		per_page: INITIAL_MEDIA_ITEMS_PER_PAGE,
		search: debouncedSearch,
		page,
	} );

	const changePage = ( newPage ) => {
		const scrollContainer = getScrollContainer( panelRef?.current );
		scrollContainer?.scrollTo( 0, 0 );
		setPage( newPage );
	};

	const baseCssClass = 'block-editor-inserter__media-panel';
	const searchLabel = category.labels.search_items || __( 'Search' );
	const showPagination =
		! isLoading && !! mediaList?.length && ( page > 1 || hasMore );

	return (
		<div className={ baseCssClass } ref={ panelRef }>
			<SearchControl
				className={ `${ baseCssClass }-search` }
				onChange={ setSearch }
				value={ search }
				label={ searchLabel }
				placeholder={ searchLabel }
			/>
			{ isLoading && (
				<div className={ `${ baseCssClass }-spinner` }>
					<Spinner />
				</div>
			) }
			{ ! isLoading && ! mediaList?.length && <InserterNoResults /> }
			{ ! isLoading && !! mediaList?.length && (
				<MediaList
					rootClientId={ rootClientId }
					onClick={ onInsert }
					mediaList={ mediaList }
					category={ category }
				>
					{ showPagination && (
						<Pagination
							currentPage={ page }
							changePage={ changePage }
							hasMore={ hasMore }
							className="block-editor-inserter__media-pagination"
						/>
					) }
				</MediaList>
			) }
		</div>
	);
}
