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
import { store as coreGuidelinesStore } from './store';
import type {
	RestGuidelinesResponse,
	GuidelinesImportData,
	GuidelinesRevision,
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

export async function fetchGuidelines(): Promise< RestGuidelinesResponse > {
	const { setFromResponse } = dispatch( coreGuidelinesStore );

	const response = ( await apiFetch( {
		path: '/wp/v2/content-guidelines?context=edit',
	} ) ) as RestGuidelinesResponse;

	setFromResponse( response );

	return response;
}

export async function saveGuidelines(): Promise< RestGuidelinesResponse > {
	const { setFromResponse } = dispatch( coreGuidelinesStore );

	const guidelinesStore = select( coreGuidelinesStore );

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
 * Opens file selector, reads the selected file and imports the guidelines.
 * @param file Guidelines JSON file
 */
export async function importGuidelines( file: File ): Promise< void > {
	const { setFromResponse } = dispatch( coreGuidelinesStore );
	const guidelinesStore = select( coreGuidelinesStore );
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
 * Exports the guidelines as a JSON file.
 */
export function exportGuidelines(): void {
	const { createSuccessNotice } = dispatch( noticesStore );

	const guidelinesStore = select( coreGuidelinesStore );
	const guidelinesCategories = guidelinesStore.getAllGuidelines();
	const blockGuidelines = guidelinesStore.getBlockGuidelines();

	const data = {
		guideline_categories: {
			...Object.fromEntries(
				FLAT_CATEGORIES.map( ( guidelineCategory ) => [
					guidelineCategory,
					{
						guidelines:
							guidelinesCategories[ guidelineCategory ] ?? '',
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

export async function fetchGuidelinesRevisions( {
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
	revisions: GuidelinesRevision[];
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

	const revisions = ( await response.json() ) as GuidelinesRevision[];
	const total = parseInt( response.headers.get( 'X-WP-Total' ) ?? '0', 10 );
	const totalPages = parseInt(
		response.headers.get( 'X-WP-TotalPages' ) ?? '0',
		10
	);

	return { revisions, total, totalPages };
}

export async function restoreGuidelinesRevision(
	guidelinesId: number,
	revisionId: number
): Promise< RestGuidelinesResponse > {
	return ( await apiFetch( {
		path: `/wp/v2/content-guidelines/${ guidelinesId }/revisions/${ revisionId }/restore`,
		method: 'POST',
	} ) ) as RestGuidelinesResponse;
}
