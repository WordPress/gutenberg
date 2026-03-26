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
	const blockGuidelines = guidelinesStore.getBlockGuidelines();

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
				Object.entries( blockGuidelines ).map(
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

	setFromResponse( response );

	return response;
}

/**
 * Opens file selector, reads the selected file and imports the content guidelines.
 * @param file Content Guidelines JSON file
 */
export async function importContentGuidelines( file: File ): Promise< void > {
	const { setGuideline, setBlockGuideline } = dispatch(
		coreContentGuidelinesStore
	);
	const { createSuccessNotice } = dispatch( noticesStore );

	const parsed: unknown = JSON.parse( await file.text() );

	if ( ! isValidGuidelinesImport( parsed ) ) {
		throw new Error(
			__(
				'Check that your file contains valid JSON markup and try again.'
			)
		);
	}

	const guidelinesStore = select( coreContentGuidelinesStore );
	const previousCategories = guidelinesStore.getAllGuidelines();
	const previousBlocks = { ...guidelinesStore.getBlockGuidelines() };

	const { guideline_categories: contentGuidelinesCategories } = parsed;

	FLAT_CATEGORIES.forEach( ( guidelineCategory ) => {
		const guidelines =
			contentGuidelinesCategories[ guidelineCategory ]?.guidelines;
		if ( typeof guidelines === 'string' ) {
			setGuideline( guidelineCategory, guidelines );
		}
	} );

	const blocksData = contentGuidelinesCategories.blocks;
	if ( blocksData && typeof blocksData === 'object' ) {
		Object.entries( blocksData ).forEach( ( [ blockName, blockData ] ) => {
			if ( blockData && typeof blockData.guidelines === 'string' ) {
				setBlockGuideline( blockName, blockData.guidelines );
			}
		} );
	}

	try {
		await saveContentGuidelines();
		createSuccessNotice( __( 'Guidelines imported.' ), {
			type: 'snackbar',
		} );
	} catch ( error ) {
		FLAT_CATEGORIES.forEach( ( cat ) => {
			setGuideline( cat, previousCategories[ cat ] ?? '' );
		} );

		const currentBlocks = guidelinesStore.getBlockGuidelines();
		Object.keys( currentBlocks ).forEach( ( blockName ) =>
			setBlockGuideline( blockName, '' )
		);
		Object.entries( previousBlocks ).forEach( ( [ blockName, value ] ) =>
			setBlockGuideline( blockName, value )
		);

		throw error;
	}
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

	downloadBlob(
		'guidelines.json',
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
