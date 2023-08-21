/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { Spinner, SearchControl } from '@wordpress/components';
import { focus } from '@wordpress/dom';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MediaList from './media-list';
import useDebouncedInput from '../hooks/use-debounced-input';
import { useMediaResults } from './hooks';
import InserterNoResults from '../no-results';

const INITIAL_MEDIA_ITEMS_PER_PAGE = 10;

export function MediaCategoryDialog( { rootClientId, onInsert, category } ) {
	const container = useRef();
	useEffect( () => {
		const timeout = setTimeout( () => {
			const [ firstTabbable ] = focus.tabbable.find( container.current );
			firstTabbable?.focus();
		} );
		return () => clearTimeout( timeout );
	}, [ category ] );
	return (
		<div ref={ container } className="block-editor-inserter__media-dialog">
			<MediaCategoryPanel
				rootClientId={ rootClientId }
				onInsert={ onInsert }
				category={ category }
			/>
		</div>
	);
}

export function MediaCategoryPanel( { rootClientId, onInsert, category } ) {
	const [ search, setSearch, debouncedSearch ] = useDebouncedInput();
	const { mediaList, isLoading } = useMediaResults( category, {
		per_page: !! debouncedSearch ? 20 : INITIAL_MEDIA_ITEMS_PER_PAGE,
		search: debouncedSearch,
	} );
	const baseCssClass = 'block-editor-inserter__media-panel';
	const searchLabel = category.labels.search_items || __( 'Search' );
	return (
		<div className={ baseCssClass }>
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
				/>
			) }
		</div>
	);
}
