/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { home, layout } from '@wordpress/icons';

export const route = {
	title: () => __( 'Home' ),
	async canvas() {
		const [ siteData, siteSettings ] = ( await Promise.all( [
			resolveSelect( coreStore ).getEntityRecord(
				'root',
				'__unstableBase'
			),
			resolveSelect( coreStore ).getEntityRecord( 'root', 'site' ),
		] ) ) as [
			{ home?: string } | undefined,
			{ show_on_front?: string } | undefined,
		];
		const isLatestPostsHomepage = siteSettings?.show_on_front === 'posts';

		return {
			isPreview: true,
			previewUrl: siteData?.home,
			previewLabel: __( 'Home' ),
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
