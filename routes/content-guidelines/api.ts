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
import type { BlockGuideline, GuidelineCategories, Revision } from './types';

interface RestGuidelinesResponse {
	id: number;
	status: string;
	guideline_categories?: Record< string, { guidelines?: string } > & {
		blocks?: BlockGuideline[];
	};
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

// Categories fork function extended: adds `blocks` to the payload.
export async function saveContentGuidelines(): Promise< RestGuidelinesResponse > {
	// @ts-ignore
	const { setFromResponse } = dispatch( STORE_NAME );

	const guidelinesStore = select( STORE_NAME ) as {
		getId: () => number | null;
		getStatus: () => string | null;
		getAllGuidelines: () => Partial< Record< string, string > >;
		getGuideline: ( category: string ) => string;
		getBlocks: () => BlockGuideline[];
	};

	const id = guidelinesStore.getId();
	const status = guidelinesStore.getStatus() || 'draft';
	const categories = guidelinesStore.getAllGuidelines();
	const blocks = guidelinesStore.getBlocks();

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
			blocks,
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

// Actions fork addition: lazy-loaded when user opens the revisions screen.
export async function fetchRevisions( postId: number ): Promise< void > {
	const { setRevisions } = dispatch( STORE_NAME ) as {
		setRevisions: (
			revisions: Array< Revision & { categories: GuidelineCategories } >
		) => void;
	};

	try {
		const response = ( await apiFetch( {
			path: `/wp/v2/content-guidelines/${ postId }/revisions`,
		} ) ) as Array<
			Revision & {
				guideline_categories?: Record<
					string,
					{ guidelines?: string }
				> & { blocks?: BlockGuideline[] };
			}
		>;

		const revisions = response.map( ( revision ) => {
			const raw = revision.guideline_categories ?? {};
			const categories: GuidelineCategories = {
				site: { guidelines: raw.site?.guidelines ?? '' },
				copy: { guidelines: raw.copy?.guidelines ?? '' },
				images: { guidelines: raw.images?.guidelines ?? '' },
				additional: { guidelines: raw.additional?.guidelines ?? '' },
				blocks: Array.isArray( raw.blocks ) ? raw.blocks : [],
			};
			return {
				id: revision.id,
				date: revision.date,
				author_name: revision.author_name,
				categories,
			};
		} );

		setRevisions( revisions );
	} catch ( error: unknown ) {
		const { createErrorNotice } = dispatch( noticesStore ) as {
			createErrorNotice: (
				message: string,
				options?: { type?: 'snackbar' | 'default' }
			) => void;
		};

		createErrorNotice(
			__(
				'There was an error loading revision history. Please try again.'
			),
			{ type: 'snackbar' }
		);
		throw error;
	}
}

// Restore a revision
export async function restoreRevision(
	revisionId: number,
	categories: GuidelineCategories
): Promise< void > {
	const { setGuideline, setBlocks, setCurrentRevisionId } = dispatch(
		STORE_NAME
	) as {
		setGuideline: ( category: string, value: string ) => void;
		setBlocks: ( blocks: BlockGuideline[] ) => void;
		setCurrentRevisionId: ( id: number ) => void;
	};

	// Write text categories to the store.
	( [ 'site', 'copy', 'images', 'additional' ] as const ).forEach(
		( slug ) => {
			setGuideline( slug, categories[ slug ].guidelines );
		}
	);

	// Write blocks to the store.
	setBlocks( categories.blocks );

	// Persist to backend (reuses save logic including success/error notices).
	await saveContentGuidelines();

	// Mark this revision as current.
	setCurrentRevisionId( revisionId );
}
