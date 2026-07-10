/**
 * WordPress dependencies
 */
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import {
	privateApis as mediaEditorPrivateApis,
	type Media,
} from '@wordpress/media-editor';
import { useNavigate, useParams } from '@wordpress/route';
import { unlock } from '@wordpress/routes-lock-unlock';

/**
 * Internal dependencies
 */
import './style.scss';

const { usePostFields } = unlock( editorPrivateApis );
const { MediaEditor } = unlock( mediaEditorPrivateApis );

const MEDIA_LIST_PATH = '/types/attachment/list/all';
const MEDIA_LIBRARY_ADMIN_PATH = 'upload.php';
const MEDIA_EDITOR_ADMIN_PAGE = 'media-editor-wp-admin';

function isMediaEditorAdminPage() {
	return (
		typeof window !== 'undefined' &&
		new URLSearchParams( window.location.search ).get( 'page' ) ===
			MEDIA_EDITOR_ADMIN_PAGE
	);
}

function getMediaTitle( media: Media | null ) {
	const title =
		typeof media?.title === 'string'
			? media.title
			: media?.title?.rendered || media?.title?.raw;

	return title ? decodeEntities( title ) : __( 'Edit media' );
}

function MediaEditorRoute() {
	const { id } = useParams( { from: '/media-editor/$id' } );
	const attachmentId = parseInt( id, 10 );
	const navigate = useNavigate();
	const fields = usePostFields( { postType: 'attachment' } );
	const isStandaloneAdminPage = isMediaEditorAdminPage();

	const media = useSelect(
		( select ) =>
			select( coreStore ).getEditedEntityRecord(
				'postType',
				'attachment',
				attachmentId
			),
		[ attachmentId ]
	);

	const title = getMediaTitle( media ?? null );
	const navigateBack = () => {
		if ( typeof window !== 'undefined' && window.history.length > 1 ) {
			window.history.back();
			return;
		}
		if ( isStandaloneAdminPage ) {
			window.location.assign( MEDIA_LIBRARY_ADMIN_PATH );
			return;
		}
		navigate( { to: MEDIA_LIST_PATH } );
	};

	return (
		<MediaEditor
			id={ attachmentId }
			fields={ fields }
			onClose={ navigateBack }
			onSaved={ ( { id: savedId } ) => {
				if ( savedId !== attachmentId ) {
					navigate( { to: `/media-editor/${ savedId }` } );
				}
			} }
			renderFrame={ ( { children, headerActions, onKeyDown } ) => (
				<Page
					className="media-editor-route"
					ariaLabel={ title }
					breadcrumbs={
						<Breadcrumbs
							items={
								isStandaloneAdminPage
									? [ { label: title } ]
									: [
											{
												label: __( 'Media' ),
												to: MEDIA_LIST_PATH,
											},
											{ label: title },
									  ]
							}
						/>
					}
					actions={ headerActions }
				>
					{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
					<div
						className="media-editor-route__content"
						onKeyDown={ onKeyDown }
					>
						{ children }
					</div>
				</Page>
			) }
		/>
	);
}

export const stage = MediaEditorRoute;
