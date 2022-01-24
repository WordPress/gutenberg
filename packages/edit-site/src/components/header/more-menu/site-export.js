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
			} );
			const blob = await response.blob();

			downloadjs( blob, 'edit-site-export.zip', 'application/zip' );
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
			info={ __( 'Download your templates and template parts.' ) }
		>
			{ _x( 'Export', 'site exporter menu item' ) }
		</MenuItem>
	);
}
