import { __, _x } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { download } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { downloadBlob } from '@wordpress/blob';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { store as editorStore } from '../../store';
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
} from '../../store/constants';
import MoreMenuItem from '../more-menu/more-menu-item';

/**
 * Menu item offering to download the active theme, with the user's template
 * and style changes, as a zip.
 *
 * Offered only while editing one of the entities the exported theme is made
 * of — a template or a template part — and only to users the export endpoint
 * accepts. The host places it in a menu group.
 *
 * @return {React.ReactNode} The menu item, or nothing where export does not
 *                           apply.
 */
export default function SiteExport() {
	const canExport = useSelect( ( select ) => {
		const postType = select( editorStore ).getCurrentPostType();
		if (
			postType !== TEMPLATE_POST_TYPE &&
			postType !== TEMPLATE_PART_POST_TYPE
		) {
			return false;
		}

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

			downloadBlob( fileName + '.zip', blob, 'application/zip' );
		} catch ( errorResponse ) {
			let error = {};
			try {
				error = await errorResponse.json();
			} catch {}
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the site export.' );

			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	}

	return (
		<MoreMenuItem
			icon={ download }
			onClick={ handleExport }
			info={ __(
				'Download your theme with updated templates and styles.'
			) }
		>
			{ _x( 'Export', 'site exporter menu item' ) }
		</MoreMenuItem>
	);
}
