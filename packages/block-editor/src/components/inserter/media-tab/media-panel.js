/**
 * WordPress dependencies
 */
import { useRef, useEffect, useCallback } from '@wordpress/element';
import { Spinner, SearchControl } from '@wordpress/components';
import { focus } from '@wordpress/dom';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { isBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import MediaList from './media-list';
import useDebouncedInput from '../hooks/use-debounced-input';
import { useMediaResults } from './hooks';
import InserterNoResults from '../no-results';
import { store as blockEditorStore } from '../../../store';

const INITIAL_MEDIA_ITEMS_PER_PAGE = 10;
const ALLOWED_MEDIA_TYPES = [ 'image' ];

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
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const mediaUpload = useSelect(
		( select ) => select( blockEditorStore ).getSettings().mediaUpload,
		[]
	);
	const onMediaInsert = useCallback(
		( block ) => {
			const { id, url, caption } = block.attributes;
			// Media item already exists in library, so just insert it.
			if ( !! id ) {
				onInsert( block );
				return;
			}
			// Media item does not exist in library, so try to upload it.
			// Fist fetch the image data. This may fail if the image host
			// doesn't allow CORS with the domain.
			// If that happens, we insert the image block using the external
			// URL and let the user know about the implications of that.
			window
				.fetch( url )
				.then( ( response ) => response.blob() )
				.then( ( blob ) => {
					mediaUpload( {
						filesList: [ blob ],
						additionalData: { caption },
						onFileChange( [ img ] ) {
							if ( isBlobURL( img.url ) ) {
								return;
							}
							onInsert( {
								...block,
								attributes: {
									...block.attributes,
									id: img.id,
									url: img.url,
								},
							} );
							createSuccessNotice(
								__( 'Image uploaded and inserted.' ),
								{
									type: 'snackbar',
								}
							);
						},
						allowedTypes: ALLOWED_MEDIA_TYPES,
						onError( message ) {
							createErrorNotice( message, { type: 'snackbar' } );
						},
					} );
				} )
				.catch( () => {
					// TODO: should we insert it with an appropriate warning?
					createErrorNotice(
						'The image cannot be uploaded to the media library. External images can be removed by the external provider without warning and could even have legal compliance issues',
						{
							type: 'snackbar',
						}
					);
					onInsert( block );
				} );
		},
		[ onInsert, mediaUpload, createErrorNotice, createSuccessNotice ]
	);
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
					onClick={ onMediaInsert }
					mediaList={ mediaList }
					category={ category }
				/>
			) }
		</div>
	);
}
