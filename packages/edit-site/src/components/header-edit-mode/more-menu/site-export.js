/**
 * External dependencies
 */
import downloadjs from 'downloadjs';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { download } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

export default function SiteExport() {
	const { createErrorNotice } = useDispatch( noticesStore );

	async function handleExport() {
		try {
			const response = await apiFetch( {
				path: '/wp-block-editor/v1/export',
				parse: false,
				headers: {
					Accept: 'application/zip',
				},
			} );
			const blob = await response.blob();
			const contentDisposition = response.headers.get(
				'content-disposition'
			);
			const contentDispositionMatches =
				contentDisposition.match( /=(.+)\.zip/ );
			const fileName = contentDispositionMatches[ 1 ]
				? contentDispositionMatches[ 1 ]
				: 'edit-site-export';

			downloadjs( blob, fileName + '.zip', 'application/zip' );
		} catch ( errorResponse ) {
			let error = {};
			try {
				error = await errorResponse.json();
			} catch ( e ) {}
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the site export.' );

			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	}

	return (
		<MenuItem
			role="menuitem"
			icon={ download }
			onClick={ handleExport }
			info={ __(
				'Download your theme with updated templates and styles.'
			) }
		>
			{ _x( 'Export', 'site exporter menu item' ) }
		</MenuItem>
	);
}
