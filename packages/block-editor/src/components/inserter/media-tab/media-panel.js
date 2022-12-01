/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { Spinner, SearchControl } from '@wordpress/components';
import { focus } from '@wordpress/dom';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MediaList from './media-list';
import useDebouncedInput from '../hooks/use-debounced-input';
import { useMediaResults } from './hooks/use-media-results';
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
	// TODO: here we'll need the request/response interfaces and see where to
	// differentiate between internal and external media sources.
	const mediaList = useMediaResults( category, {
		per_page: !! debouncedSearch ? 20 : INITIAL_MEDIA_ITEMS_PER_PAGE,
		search: debouncedSearch,
		// Check how to handle conditions like this in an abstraction..
		orderBy: !! debouncedSearch ? 'relevance' : 'date',
	} );
	const baseCssClass = 'block-editor-inserter__media-panel';
	return (
		<div className={ baseCssClass }>
			<SearchControl
				className={ `${ baseCssClass }-search` }
				onChange={ setSearch }
				value={ search }
				label={ sprintf(
					/* translators: %s: Name of the media category(ex. 'images, videos'). */
					__( 'Search %s' ),
					category.label.toLocaleLowerCase()
				) }
				placeholder={ sprintf(
					/* translators: %s: Name of the media category(ex. 'images, videos'). */
					__( 'Search %s' ),
					category.label.toLocaleLowerCase()
				) }
			/>
			{ ! mediaList && (
				<div className={ `${ baseCssClass }-spinner` }>
					<Spinner />
				</div>
			) }
			{ Array.isArray( mediaList ) && ! mediaList.length && (
				<InserterNoResults />
			) }
			{ !! mediaList?.length && (
				<MediaList
					rootClientId={ rootClientId }
					onClick={ onInsert }
					mediaList={ mediaList }
					mediaType={ category.mediaType }
				/>
			) }
		</div>
	);
}
