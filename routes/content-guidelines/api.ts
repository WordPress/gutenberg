/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { dispatch, select } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './store';
import type {
	Categories,
	RestGuidelinesResponse,
	GuidelinesImportData,
} from './types';

const FLAT_CATEGORIES = [ 'site', 'copy', 'images', 'additional' ] as const;

function getErrorMessage( error: unknown ): string {
	return error instanceof Error ? error.message : __( 'Unknown error.' );
}

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
	const { setFromResponse } = dispatch( STORE_NAME ) as {
		setFromResponse: ( response: RestGuidelinesResponse ) => void;
	};

	const response = ( await apiFetch( {
		path: '/wp/v2/content-guidelines?context=edit',
	} ) ) as RestGuidelinesResponse;

	setFromResponse( response );

	return response;
}

export async function saveContentGuidelines(): Promise< RestGuidelinesResponse > {
	// @ts-ignore
	const { setFromResponse } = dispatch( STORE_NAME );

	const guidelinesStore = select( STORE_NAME ) as unknown as {
		getId: () => number | null;
		getStatus: () => string | null;
		getAllGuidelines: () => Categories;
		getBlockGuidelines: () => Record< string, string >;
		getGuideline: ( category: string ) => string | Record< string, string >;
	};

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
	const { createErrorNotice } = dispatch( noticesStore );
	// @ts-ignore
	const { setGuideline } = dispatch( STORE_NAME );

	try {
		const parsed: unknown = JSON.parse( await file.text() );

		if ( ! isValidGuidelinesImport( parsed ) ) {
			throw new Error( __( 'Invalid file format.' ) );
		}

		const { guideline_categories: contentGuidelinesCategories } = parsed;

		FLAT_CATEGORIES.forEach( ( guidelineCategory ) => {
			const guidelines =
				contentGuidelinesCategories[ guidelineCategory ]?.guidelines;
			if ( typeof guidelines === 'string' ) {
				setGuideline( guidelineCategory, guidelines );
			}
		} );

		await saveContentGuidelines();
	} catch ( e: unknown ) {
		createErrorNotice(
			sprintf(
				/* translators: %s: Error message. */
				__( 'Failed to import content guidelines: %s' ),
				getErrorMessage( e )
			),
			{ type: 'snackbar' }
		);
	}
}

/**
 * Exports the content guidelines as a JSON file.
 */
export function exportContentGuidelines(): void {
	const { createSuccessNotice, createErrorNotice } = dispatch( noticesStore );

	try {
		const contentGuidelinesCategories = (
			select( STORE_NAME ) as {
				getAllGuidelines: () => Categories;
			}
		 ).getAllGuidelines();

		const data = {
			guideline_categories: Object.fromEntries(
				FLAT_CATEGORIES.map( ( guidelineCategory ) => [
					guidelineCategory,
					{
						guidelines:
							contentGuidelinesCategories[ guidelineCategory ],
					},
				] )
			),
		};

		const blob = new Blob( [ JSON.stringify( data, null, 2 ) ], {
			type: 'application/json',
		} );
		const url = URL.createObjectURL( blob );
		const anchor = document.createElement( 'a' );
		anchor.href = url;
		anchor.download = 'content-guidelines.json';
		document.body.appendChild( anchor );
		anchor.click();
		document.body.removeChild( anchor );
		URL.revokeObjectURL( url );

		createSuccessNotice( __( 'Content guidelines exported.' ), {
			type: 'snackbar',
		} );
	} catch ( e: unknown ) {
		createErrorNotice(
			sprintf(
				/* translators: %s: Error message. */
				__( 'Failed to export content guidelines: %s' ),
				getErrorMessage( e )
			),
			{ type: 'snackbar' }
		);
	}
}
