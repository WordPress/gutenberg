/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { home, layout } from '@wordpress/icons';

type SiteSettings = {
	show_on_front?: string;
	page_on_front?: number;
};

type PageRecord = {
	title?: {
		raw?: string;
		rendered?: string;
	};
};

function getPlainTextTitle( title?: string ) {
	if ( ! title ) {
		return '';
	}

	return decodeEntities( title.replace( /<[^>]+>/g, '' ) ).trim();
}

function getPageTitle( page?: PageRecord ) {
	const title = page?.title?.rendered || page?.title?.raw;
	const plainTitle = getPlainTextTitle( title );
	return plainTitle || __( 'Untitled' );
}

function isHomeEquivalentTitle( title: string ) {
	const normalizedTitle = title
		.toLocaleLowerCase()
		.replace( /[^a-z0-9]+/g, '' );

	return [ 'home', 'homepage', 'frontpage' ].includes( normalizedTitle );
}

function getStaticHomepageLabel( page?: PageRecord ) {
	if ( ! page ) {
		return __( 'Home' );
	}

	const pageTitle = getPageTitle( page );
	if ( isHomeEquivalentTitle( pageTitle ) ) {
		return __( 'Home' );
	}

	return sprintf(
		/* translators: %s: The title of the static page used as the homepage. */
		__( 'Home (%s)' ),
		pageTitle
	);
}

export const route = {
	title: () => __( 'Home' ),
	async canvas() {
		const [ siteData, siteSettings ] = ( await Promise.all( [
			resolveSelect( coreStore ).getEntityRecord(
				'root',
				'__unstableBase'
			),
			resolveSelect( coreStore ).getEntityRecord( 'root', 'site' ),
		] ) ) as [ { home?: string } | undefined, SiteSettings | undefined ];
		const isLatestPostsHomepage = siteSettings?.show_on_front === 'posts';
		const isStaticPageHomepage = siteSettings?.show_on_front === 'page';
		const staticFrontPage =
			isStaticPageHomepage && siteSettings?.page_on_front
				? ( ( await resolveSelect( coreStore ).getEntityRecord(
						'postType',
						'page',
						siteSettings.page_on_front
				  ) ) as PageRecord | undefined )
				: undefined;
		const staticHomepageLabel = getStaticHomepageLabel( staticFrontPage );

		return {
			isPreview: true,
			previewUrl: siteData?.home,
			previewLabel: isStaticPageHomepage
				? staticHomepageLabel
				: __( 'Home' ),
			previewIcon: isLatestPostsHomepage ? layout : home,
			previewStatus: 'homepage',
			previewStatusLabel: __( 'Homepage' ),
			previewEditLabel: isLatestPostsHomepage
				? __( 'Edit template' )
				: __( 'Edit page' ),
			previewTone: isLatestPostsHomepage
				? ( 'global' as const )
				: undefined,
		};
	},
};
