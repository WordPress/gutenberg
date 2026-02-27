/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { dispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

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
		const { createErrorNotice } = dispatch( noticesStore ) as {
			createErrorNotice: (
				message: string,
				options?: { type?: 'snackbar' | 'default'; context?: string }
			) => void;
		};

		createErrorNotice(
			__(
				'There was an error loading your content guidelines. Please try again.'
			),
			{ type: 'snackbar' }
		);
		throw error;
	}
}

export async function saveContentGuidelines(): Promise< RestGuidelinesResponse > {
	// @ts-ignore
	const { setFromResponse } = dispatch( STORE_NAME );

	const guidelinesStore = select( STORE_NAME ) as {
		getId: () => number | null;
		getStatus: () => string | null;
		getAllGuidelines: () => Partial< Record< string, string > >;
		getGuideline: ( category: string ) => string;
	};

	const id = guidelinesStore.getId();
	const status = guidelinesStore.getStatus() || 'draft';
	const categories = guidelinesStore.getAllGuidelines();

	const data = {
		id: id && id > 0 ? id : undefined,
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

	const { createSuccessNotice, createErrorNotice } = dispatch( noticesStore );

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

		createSuccessNotice( __( 'Content guidelines saved.' ), {
			type: 'snackbar',
		} );

		return response;
	} catch ( error: unknown ) {
		createErrorNotice(
			__(
				'There was an error saving your content guidelines. Please try again.'
			),
			{ type: 'snackbar' }
		);
		throw error;
	}
}
