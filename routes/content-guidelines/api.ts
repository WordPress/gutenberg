/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { downloadBlob } from '@wordpress/blob';
import { dispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as coreContentGuidelinesStore } from './store';
import type {
	RestGuidelinesResponse,
	GuidelinesImportData,
	ContentGuidelinesRevision,
	Categories,
} from './types';

const FLAT_CATEGORIES = [ 'site', 'copy', 'images', 'additional' ] as const;

function isValidGuidelinesImport(
	data: unknown
): data is GuidelinesImportData {
	return (
		!! data &&
		typeof data === 'object' &&
		'guideline_categories' in data &&
		typeof ( data as Record< string, unknown > ).guideline_categories ===
			'object' &&
		( data as Record< string, unknown > ).guideline_categories !== null
	);
}

export async function fetchContentGuidelines(): Promise< RestGuidelinesResponse > {
	const { setFromResponse } = dispatch( coreContentGuidelinesStore );

	const response = ( await apiFetch( {
		path: '/wp/v2/content-guidelines?context=edit',
	} ) ) as RestGuidelinesResponse;

	setFromResponse( response );

	return response;
}

export async function saveContentGuidelines(): Promise< RestGuidelinesResponse > {
	const { setFromResponse } = dispatch( coreContentGuidelinesStore );

	const guidelinesStore = select( coreContentGuidelinesStore );

	const id = guidelinesStore.getId();
	const status = guidelinesStore.getStatus() || 'draft';
	const categories = guidelinesStore.getAllGuidelines();

	const response = await saveGuidelinesBypassingStore(
		id,
		status,
		categories
	);

	setFromResponse( response );

	return response;
}

async function saveGuidelinesBypassingStore(
	id: number | null,
	status: string,
	categories: Categories
): Promise< RestGuidelinesResponse > {
	const data = {
		id,
		status,
		guideline_categories: {
			site: {
				guidelines: categories.site,
			},
			copy: {
				guidelines: categories.copy,
			},
			images: {
				guidelines: categories.images,
			},
			additional: {
				guidelines: categories.additional,
			},
			blocks: Object.fromEntries(
				Object.entries( categories.blocks ).map(
					( [ blockName, guidelines ] ) => [
						blockName,
						{ guidelines },
					]
				)
			),
		},
	};

	const path = id
		? `/wp/v2/content-guidelines/${ id }`
		: '/wp/v2/content-guidelines';
	const method = id ? 'PUT' : 'POST';

	const response = ( await apiFetch( {
		path,
		method,
		data,
	} ) ) as RestGuidelinesResponse;

	return response;
}

/**
 * Opens file selector, reads the selected file and imports the content guidelines.
 * @param file Content Guidelines JSON file
 */
export async function importContentGuidelines( file: File ): Promise< void > {
	const { setFromResponse } = dispatch( coreContentGuidelinesStore );
	const guidelinesStore = select( coreContentGuidelinesStore );
	const { createSuccessNotice } = dispatch( noticesStore );

	const parsed: unknown = JSON.parse( await file.text() );

	if ( ! isValidGuidelinesImport( parsed ) ) {
		throw new Error(
			__(
				'Check that your file contains valid JSON markup and try again.'
			)
		);
	}

	const existingGuidelines = guidelinesStore.getAllGuidelines();

	const newGuidelines = {
		/**
		 * Set empty string to all the simple guidelines so that if the category is not present
		 * in the parsed data, the category gets removed.
		 */
		...Object.fromEntries(
			FLAT_CATEGORIES.map( ( category ) => [ category, '' ] )
		),
		/**
		 * Set empty string to all the existing block guidelines so that if the block is not present
		 * in the parsed data, the block gets removed.
		 */
		blocks: Object.fromEntries(
			Object.keys( existingGuidelines.blocks ).map( ( block ) => [
				block,
				'',
			] )
		),
	} as Categories;

	// Now let's populate the simple guidelines with the parsed data.
	for ( const cat of FLAT_CATEGORIES ) {
		const guidelines = parsed.guideline_categories[ cat ]?.guidelines || '';
		newGuidelines[ cat ] = guidelines;
	}

	// Now let's populate the block guidelines with the parsed data.
	const parsedBlocks = parsed.guideline_categories?.blocks ?? {};
	for ( const [ key, value ] of Object.entries( parsedBlocks ) ) {
		newGuidelines.blocks[ key ] = value?.guidelines || '';
	}

	const response = await saveGuidelinesBypassingStore(
		guidelinesStore.getId(),
		guidelinesStore.getStatus() || 'draft',
		newGuidelines
	);

	setFromResponse( response );
	createSuccessNotice( __( 'Guidelines imported.' ), {
		type: 'snackbar',
	} );
}

/**
 * Exports the content guidelines as a JSON file.
 */
export function exportContentGuidelines(): void {
	const { createSuccessNotice } = dispatch( noticesStore );

	const guidelinesStore = select( coreContentGuidelinesStore );
	const contentGuidelinesCategories = guidelinesStore.getAllGuidelines();
	const blockGuidelines = guidelinesStore.getBlockGuidelines();

	const data = {
		guideline_categories: {
			...Object.fromEntries(
				FLAT_CATEGORIES.map( ( guidelineCategory ) => [
					guidelineCategory,
					{
						guidelines:
							contentGuidelinesCategories[ guidelineCategory ] ??
							'',
					},
				] )
			),
			blocks: Object.fromEntries(
				Object.entries( blockGuidelines ).map(
					( [ blockName, guidelines ] ) => [
						blockName,
						{ guidelines },
					]
				)
			),
		},
	};

	const now = new Date();
	const exportDate = [
		now.getFullYear(),
		String( now.getMonth() + 1 ).padStart( 2, '0' ),
		String( now.getDate() ).padStart( 2, '0' ),
	].join( '-' );
	downloadBlob(
		`guidelines-${ exportDate }.json`,
		JSON.stringify( data, null, 2 ),
		'application/json'
	);

	createSuccessNotice( __( 'Guidelines exported.' ), {
		type: 'snackbar',
	} );
}

export async function fetchContentGuidelinesRevisions( {
	guidelinesId,
	page = 1,
	perPage = 10,
	search,
}: {
	guidelinesId: number;
	page?: number;
	perPage?: number;
	search?: string;
} ): Promise< {
	revisions: ContentGuidelinesRevision[];
	total: number;
	totalPages: number;
} > {
	const params = new URLSearchParams( {
		page: String( page ),
		per_page: String( perPage ),
		_embed: 'author',
		...( search ? { search } : {} ),
	} );

	const response = ( await apiFetch( {
		path: `/wp/v2/content-guidelines/${ guidelinesId }/revisions?${ params }`,
		parse: false,
	} ) ) as Response;

	const revisions = ( await response.json() ) as ContentGuidelinesRevision[];
	const total = parseInt( response.headers.get( 'X-WP-Total' ) ?? '0', 10 );
	const totalPages = parseInt(
		response.headers.get( 'X-WP-TotalPages' ) ?? '0',
		10
	);

	return { revisions, total, totalPages };
}

export async function restoreContentGuidelinesRevision(
	guidelinesId: number,
	revisionId: number
): Promise< RestGuidelinesResponse > {
	return ( await apiFetch( {
		path: `/wp/v2/content-guidelines/${ guidelinesId }/revisions/${ revisionId }/restore`,
		method: 'POST',
	} ) ) as RestGuidelinesResponse;
}
