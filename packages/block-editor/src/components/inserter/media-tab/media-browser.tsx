import type { ReactNode } from 'react';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { MediaCategoryPanel } from './media-panel';
import SourceMenu from './source-menu';

type MediaCategory = {
	name: string;
	label: string;
	mediaType: string;
	attach?: unknown;
};

// The categories that together make up the media library: one per media type,
// shown as tabs rather than as separate sources. Everything else a category
// can be — the post's attachments, Openverse, anything registered through the
// public API — is a source of its own.
// TODO: `InserterMediaCategory` has no notion of grouping, so this matches by
// name. A `group` property on the registration API would do this properly.
const LIBRARY_CATEGORIES = [ 'images', 'videos', 'audio' ];

const LIBRARY_SOURCE = 'media-library';
const DEFAULT_MEDIA_TYPE = 'image';

/**
 * The Media tab's shell: one search, a source menu, and a tab per media type
 * when browsing the library. The selection resolves to a single registered
 * category, which the panel below fetches and renders.
 */
export default function MediaBrowser( {
	categories,
	onInsert,
	footer,
}: {
	categories: MediaCategory[];
	/**
	 * Called with the block to insert.
	 */
	onInsert: ( block: unknown ) => void;
	/**
	 * Shown in the footer for every source that has no attach action of its
	 * own (i.e. everything but the post's attachments).
	 */
	footer?: ReactNode;
} ) {
	const { libraryCategories, sources } = useMemo( () => {
		const library = categories.filter( ( category ) =>
			LIBRARY_CATEGORIES.includes( category.name )
		);
		return {
			libraryCategories: library,
			sources: [
				...( library.length
					? [ { name: LIBRARY_SOURCE, label: __( 'Media library' ) } ]
					: [] ),
				...categories
					.filter(
						( category ) =>
							! LIBRARY_CATEGORIES.includes( category.name )
					)
					.map( ( { name, label } ) => ( { name, label } ) ),
			],
		};
	}, [ categories ] );

	const [ sourceName, setSourceName ] = useState( LIBRARY_SOURCE );
	const [ mediaType, setMediaType ] = useState( DEFAULT_MEDIA_TYPE );
	// Kept here rather than in the panel so a term survives switching tab or
	// source: the tab has one search box, so it should hold one term.
	const [ search, setSearch ] = useState( '' );

	// The source list is derived from what the editor can insert and what has
	// items, so a selection can stop being available.
	const activeSource =
		sources.find( ( source ) => source.name === sourceName ) ??
		sources[ 0 ];
	const isLibrary = activeSource?.name === LIBRARY_SOURCE;

	const mediaTypes = isLibrary
		? libraryCategories.map( ( category ) => ( {
				value: category.mediaType,
				label: category.label,
			} ) )
		: [];

	const category = isLibrary
		? ( libraryCategories.find(
				( candidate ) => candidate.mediaType === mediaType
			) ?? libraryCategories[ 0 ] )
		: categories.find(
				( candidate ) => candidate.name === activeSource?.name
			);

	if ( ! category ) {
		return null;
	}

	return (
		<MediaCategoryPanel
			category={ category }
			onInsert={ onInsert }
			search={ search }
			onChangeSearch={ setSearch }
			mediaTypes={ mediaTypes }
			mediaType={ category.mediaType }
			onChangeMediaType={ setMediaType }
			sourceMenu={
				sources.length > 1 && (
					<SourceMenu
						sources={ sources }
						value={ activeSource.name }
						onChange={ setSourceName }
					/>
				)
			}
			footer={ footer }
		/>
	);
}
