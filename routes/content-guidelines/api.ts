/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { dispatch, select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './store';

interface RestGuidelinesResponse {
	id: number;
	status: string;
	guideline_categories?: Record< string, { guidelines?: string } >;
}

export async function fetchContentGuidelines(): Promise< RestGuidelinesResponse > {
	const { setFromResponse } = dispatch( STORE_NAME ) as {
		setFromResponse: ( response: RestGuidelinesResponse ) => void;
	};

	try {
		const response = ( await apiFetch( {
			path: '/wp/v2/content-guidelines?context=edit',
		} ) ) as RestGuidelinesResponse;

		setFromResponse( response );

		return response;
	} catch ( error: unknown ) {
		throw error;
	}
}

export async function saveContentGuidelines(): Promise< RestGuidelinesResponse > {
	const { setFromResponse } = dispatch( STORE_NAME ) as {
		setFromResponse: ( response: RestGuidelinesResponse ) => void;
	};

	const guidelinesStore = select( STORE_NAME ) as {
		getId: () => number | null;
		getStatus: () => string | null;
		getAllGuidelines: () => Partial< Record< string, string > >;
	};

	const id = guidelinesStore.getId();
	const status = guidelinesStore.getStatus() || 'draft';
	const categories = guidelinesStore.getAllGuidelines();

	const data: {
		id?: number;
		status: string;
		guideline_categories: RestGuidelinesResponse[ 'guideline_categories' ];
	} = {
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
		},
	};

	if ( id && id > 0 ) {
		data.id = id;
	}

	try {
		const hasExistingId = !! ( id && id > 0 );
		const path = hasExistingId
			? `/wp/v2/content-guidelines/${ id }`
			: '/wp/v2/content-guidelines';
		const method = hasExistingId ? 'PUT' : 'POST';

		const response = ( await apiFetch( {
			path,
			method,
			data,
		} ) ) as RestGuidelinesResponse;

		setFromResponse( response );

		return response;
	} catch ( error: unknown ) {
		throw error;
	}
}
