/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { Spinner, SearchControl } from '@wordpress/components';
import { focus } from '@wordpress/dom';
import { useAsyncList } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MediaList from './media-list';
import { useMediaResults, useDebouncedInput } from './hooks';
import InserterNoResults from '../no-results';

const EMPTY_ARRAY = [];

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
		<div ref={ container }>
			<MediaCategoryPanel
				rootClientId={ rootClientId }
				onInsert={ onInsert }
				category={ category }
			/>
		</div>
	);
}

const INITIAL_MEDIA_ITEMS_PER_PAGE = 10;
export function MediaCategoryPanel( { rootClientId, onInsert, category } ) {
	const [ search, setSearch, debouncedSearch ] = useDebouncedInput();
	const results = useMediaResults( {
		per_page: !! debouncedSearch ? 20 : INITIAL_MEDIA_ITEMS_PER_PAGE,
		media_type: category.mediaType,
		search: debouncedSearch,
		orderBy: !! debouncedSearch ? 'relevance' : 'date',
	} );
	const shownResults = useAsyncList( results || EMPTY_ARRAY, {
		step: 3,
	} );
	const baseCssClass = 'block-editor-inserter__media-panel';
	return (
		<div className={ baseCssClass }>
			{ shownResults !== undefined && (
				<SearchControl
					className={ `${ baseCssClass }-search` }
					onChange={ setSearch }
					value={ search }
					label={ sprintf(
						/* translators: %s: Name of the media category(ex. 'Images, Videos'). */
						__( 'Search %s' ),
						category.label
					) }
					placeholder={ sprintf(
						/* translators: %s: Name of the media category(ex. 'Images, Videos'). */
						__( 'Search %s' ),
						category.label
					) }
				/>
			) }
			{ ! results && (
				<div className={ `${ baseCssClass }-spinner` }>
					<Spinner />
				</div>
			) }
			{ Array.isArray( results ) && ! results.length && (
				<InserterNoResults />
			) }
			{ !! shownResults?.length && (
				<MediaList
					rootClientId={ rootClientId }
					onClick={ onInsert }
					results={ shownResults }
					mediaType={ category.mediaType }
				/>
			) }
		</div>
	);
}
