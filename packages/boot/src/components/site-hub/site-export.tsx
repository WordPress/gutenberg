/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { downloadBlob } from '@wordpress/blob';
import { DropdownMenu, MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { download, moreVertical } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

export default function SiteExport() {
	const canExport = useSelect( ( select ) => {
		const targetHints =
			select( coreStore ).getCurrentTheme()?._links?.[
				'wp:export-theme'
			]?.[ 0 ]?.targetHints ?? {};

		return !! targetHints.allow?.includes( 'GET' );
	}, [] );
	const { createErrorNotice } = useDispatch( noticesStore );

	if ( ! canExport ) {
		return null;
	}

	async function handleExport() {
		try {
			const response = await apiFetch< unknown, false >( {
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
				contentDisposition?.match( /=(.+)\.zip/ );
			const fileName = contentDispositionMatches?.[ 1 ]
				? contentDispositionMatches[ 1 ]
				: 'edit-site-export';

			downloadBlob( fileName + '.zip', blob, 'application/zip' );
		} catch ( errorResponse ) {
			let error: { code?: string; message?: string } = {};
			try {
				error = await ( errorResponse as Response ).json();
			} catch {}
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the site export.' );

			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	}

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Options' ) }
			toggleProps={ {
				variant: 'tertiary',
				size: 'compact',
			} }
			popoverProps={ {
				placement: 'bottom-start',
			} }
		>
			{ ( { onClose } ) => (
				<MenuItem
					role="menuitem"
					icon={ download }
					onClick={ () => {
						void handleExport();
						onClose();
					} }
					info={ __(
						'Download your theme with updated templates and styles.'
					) }
				>
					{ _x( 'Export', 'site exporter menu item' ) }
				</MenuItem>
			) }
		</DropdownMenu>
	);
}
