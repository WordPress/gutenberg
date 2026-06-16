/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

export const route = {
	title: () => __( 'Home' ),
	async canvas() {
		const siteData = ( await resolveSelect( coreStore ).getEntityRecord(
			'root',
			'__unstableBase'
		) ) as { home?: string } | undefined;

		return {
			isPreview: true,
			previewUrl: siteData?.home,
		};
	},
};
