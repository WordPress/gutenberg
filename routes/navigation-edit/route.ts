/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { menu } from '@wordpress/icons';
import { notFound } from '@wordpress/route';

const NAVIGATION_POST_TYPE = 'wp_navigation';

type NavigationRecord = {
	status?: string;
	title?: {
		raw?: string;
		rendered?: string;
	};
};

function getNavigationTitle( navigation?: NavigationRecord ) {
	const title = navigation?.title?.rendered || navigation?.title?.raw;
	return title ? decodeEntities( title ) : __( 'Navigation' );
}

function getPreviewStatusLabel( status?: string ) {
	switch ( status ) {
		case 'publish':
			return __( 'Published' );
		case 'future':
			return __( 'Scheduled' );
		case 'draft':
		case 'auto-draft':
			return __( 'Draft' );
		case 'pending':
			return __( 'Pending review' );
		case 'private':
			return __( 'Private' );
		case 'trash':
			return __( 'Trash' );
		default:
			return __( 'Preview' );
	}
}

async function canEditNavigation( navigationId: number ) {
	return !! ( await resolveSelect( coreStore ).canUser( 'update', {
		kind: 'postType',
		name: NAVIGATION_POST_TYPE,
		id: navigationId,
	} ) );
}

export const route = {
	beforeLoad: async ( {
		params,
	}: {
		params: {
			id: string;
		};
	} ) => {
		const navigationId = parseInt( params.id, 10 );

		if ( Number.isNaN( navigationId ) ) {
			throw notFound();
		}

		try {
			const navigation = await resolveSelect( coreStore ).getEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				navigationId
			);

			if ( ! navigation ) {
				throw notFound();
			}
		} catch {
			throw notFound();
		}
	},
	title: async ( {
		params,
	}: {
		params: {
			id: string;
		};
	} ) => {
		const navigationId = parseInt( params.id );
		const navigation = await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			NAVIGATION_POST_TYPE,
			navigationId
		);

		if ( navigation?.title?.rendered ) {
			return decodeEntities( navigation.title.rendered );
		}

		return __( 'Navigation' );
	},
	canvas: async ( {
		params,
	}: {
		params: {
			id: string;
		};
	} ) => {
		const postId = parseInt( params.id );
		const navigation = ( await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			NAVIGATION_POST_TYPE,
			postId
		) ) as NavigationRecord | undefined;
		return {
			postType: NAVIGATION_POST_TYPE,
			postId,
			isPreview: true,
			editLink: `/types/wp_navigation/edit/${ postId }`,
			previewLabel: getNavigationTitle( navigation ),
			previewIcon: menu,
			previewStatus: navigation?.status,
			previewStatusLabel: getPreviewStatusLabel( navigation?.status ),
			previewEditLabel: __( 'Edit navigation' ),
			previewCanEdit: await canEditNavigation( postId ),
			previewTone: 'global' as const,
		};
	},
	loader: async ( {
		params,
	}: {
		params: {
			id: string;
		};
	} ) => {
		const navigationId = parseInt( params.id );
		await resolveSelect( coreStore ).getEntityRecord(
			'postType',
			NAVIGATION_POST_TYPE,
			navigationId
		);
	},
};
