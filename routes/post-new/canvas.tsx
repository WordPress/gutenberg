/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { chevronLeft } from '@wordpress/icons';
import { useNavigate, useParams } from '@wordpress/route';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import './style.scss';

const ADMIN_BRIDGE_QUERY_ARG = 'gutenberg_site_editor_admin_bridge';
const POST_LIST_REFRESH_STORAGE_PREFIX = 'site-editor-post-list-refresh';

function getAdminPostNewUrl( postType: string ) {
	const adminPathMatch = window.location.pathname.match(
		/^(.*\/wp-admin)(?:\/.*)?$/
	);
	const adminBasePath = adminPathMatch?.[ 1 ] || '/wp-admin';

	return addQueryArgs( `${ adminBasePath }/post-new.php`, {
		post_type: postType,
		[ ADMIN_BRIDGE_QUERY_ARG ]: '1',
	} );
}

function preserveAdminBridgeContext( iframe: HTMLIFrameElement ) {
	try {
		const frameLocation = iframe.contentWindow?.location;
		if ( ! frameLocation ) {
			return;
		}

		const frameUrl = new URL( frameLocation.href );
		if (
			frameUrl.origin !== window.location.origin ||
			! frameUrl.pathname.includes( '/wp-admin/' ) ||
			frameUrl.searchParams.get( ADMIN_BRIDGE_QUERY_ARG ) === '1'
		) {
			return;
		}

		frameUrl.searchParams.set( ADMIN_BRIDGE_QUERY_ARG, '1' );
		frameLocation.replace( frameUrl.href );
	} catch {
		// Cross-origin or inaccessible iframe navigations should continue
		// without bridge-specific handling.
	}
}

function PostNewCanvas() {
	const { type: postType } = useParams( { from: '/types/$type/new' } );
	const navigate = useNavigate();
	const { invalidateResolutionForStoreSelector } = useDispatch( coreStore );
	const postTypeObject = useSelect(
		( select ) => select( coreStore ).getPostType( postType ),
		[ postType ]
	);
	const goBackToCollection = async () => {
		await invalidateResolutionForStoreSelector( 'getEntityRecords' );
		try {
			window.sessionStorage.setItem(
				`${ POST_LIST_REFRESH_STORAGE_PREFIX }:${ postType }`,
				Date.now().toString()
			);
		} catch {
			// Storage can be unavailable in private browsing contexts. The
			// route-level invalidation above still gives core-data a chance to
			// refresh normally.
		}
		navigate( {
			to: `/types/${ postType }/list/all`,
		} );
	};
	const collectionTitle =
		postTypeObject?.labels?.all_items ||
		( postTypeObject?.labels?.name
			? sprintf(
					/* translators: %s: plural post type label. */
					__( 'All %s' ),
					postTypeObject.labels.name
			  )
			: __( 'All content' ) );
	const frameTitle =
		postTypeObject?.labels?.add_new_item ||
		postTypeObject?.labels?.add_new ||
		__( 'Add new' );

	return (
		<div className="routes-post-new-admin-bridge">
			<div className="routes-post-new-admin-bridge__toolbar">
				<Button
					icon={ chevronLeft }
					label={ __( 'Back' ) }
					onClick={ goBackToCollection }
					__next40pxDefaultSize
				/>
				<h1 className="routes-post-new-admin-bridge__title">
					{ collectionTitle }
				</h1>
			</div>
			<iframe
				className="routes-post-new-admin-bridge__frame"
				onLoad={ ( event ) =>
					preserveAdminBridgeContext( event.currentTarget )
				}
				src={ getAdminPostNewUrl( postType ) }
				title={ frameTitle }
			/>
		</div>
	);
}

export const canvas = PostNewCanvas;
