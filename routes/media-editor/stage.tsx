import type { KeyboardEvent, ReactNode } from 'react';
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
import { Text } from '@wordpress/ui';
import { useViewConfig } from '@wordpress/views';
import './style.scss';

const { usePostFields } = unlock( editorPrivateApis );
const { MediaEditor } = unlock( mediaEditorPrivateApis );

/**
 * The stage only renders a form, so it requests the `form` of the entity view
 * configuration alone. Must match the fields the route loader requests, so
 * both resolve under the same cache key.
 */
const VIEW_CONFIG_FIELDS = [ 'form' ];

const MEDIA_LIST_PATH = '/types/attachment/list/all';
const MEDIA_LIBRARY_ADMIN_PATH = 'upload.php';
const MEDIA_EDITOR_ADMIN_PAGE = 'media-editor-wp-admin';

/*
 * The `MediaEditor` callback arguments this route reads. The private API
 * does not publish its types, so these stay local until it stabilizes.
 */
interface SaveResult {
	id: number;
}

interface FrameProps {
	children: ReactNode;
	isImage: boolean;
	layout: 'wide' | 'narrow';
	onKeyDown: ( event: KeyboardEvent< HTMLElement > ) => void;
}

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

/**
 * Returns the value of one of the attachment fields for the media, or an
 * empty string if the field isn't available.
 *
 * @param fields  The attachment fields.
 * @param fieldId The id of the field to read.
 * @param media   The media record.
 */
function getFieldValue(
	fields: Array< {
		id: string;
		getValue?: ( args: { item: Media } ) => string;
	} >,
	fieldId: string,
	media: Media | false
): string {
	if ( ! media ) {
		return '';
	}
	const field = fields.find( ( { id } ) => id === fieldId );
	return field?.getValue?.( { item: media } ) || '';
}

/**
 * Returns the extension of a filename, or an empty string if it has none.
 *
 * @param filename The filename.
 */
function getFileExtension( filename: string ) {
	const index = filename.lastIndexOf( '.' );
	return index > 0 ? filename.slice( index + 1 ) : '';
}

/**
 * The file type and size shown beside the title.
 *
 * @param props
 * @param props.fileType The file extension.
 * @param props.fileSize The formatted file size.
 */
function MediaEditorFileDetails( {
	fileType,
	fileSize,
}: {
	fileType: string;
	fileSize: string;
} ) {
	if ( ! fileType && ! fileSize ) {
		return null;
	}
	return (
		<Text variant="body-md" className="media-editor-route__file-details">
			{ fileType && <span>{ fileType }</span> }
			{ fileType && fileSize && <span aria-hidden="true">·</span> }
			{ fileSize && <span>{ fileSize }</span> }
		</Text>
	);
}

function MediaEditorRoute() {
	const { id } = useParams( { from: '/media-editor/$id' } );
	const attachmentId = parseInt( id, 10 );
	const navigate = useNavigate();
	const fields = usePostFields( { postType: 'attachment' } );
	// Until the form resolves, and if it fails to, the editor lays the fields
	// out with its own default form.
	const { form } = useViewConfig( {
		kind: 'postType',
		name: 'attachment',
		fields: VIEW_CONFIG_FIELDS,
	} );
	const isStandaloneAdminPage = isMediaEditorAdminPage();

	const media = useSelect(
		( select ) =>
			/* The record of an attachment is always assignable to `Media`. */
			select( coreStore ).getEditedEntityRecord(
				'postType',
				'attachment',
				attachmentId
			) as Media | false,
		[ attachmentId ]
	);

	const title = getMediaTitle( media || null );
	// Read through the attachment fields, so the values match the Details
	// panel.
	const fileType = getFileExtension(
		getFieldValue( fields, 'filename', media )
	);
	const fileSize = getFieldValue( fields, 'filesize', media );
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
	// Replace the history entry so Cancel leaves the editor.
	const openAttachment = ( newId: number ) =>
		navigate( { to: `/media-editor/${ newId }`, replace: true } );

	return (
		<MediaEditor
			id={ attachmentId }
			fields={ fields }
			form={ form }
			onClose={ navigateBack }
			onSaved={ ( { id: savedId }: SaveResult ) => {
				if ( savedId !== attachmentId ) {
					openAttachment( savedId );
				}
			} }
			onEditOriginal={ openAttachment }
			renderFrame={ ( {
				children,
				isImage,
				layout,
				onKeyDown,
			}: FrameProps ) => {
				// Below `small` the page header already carries the
				// breadcrumbs, Cancel/Save and (under `medium`) the
				// framework's navigation toggle, in a row that does not wrap,
				// so History moves to a bar under the canvas instead.
				const isNarrow = layout === 'narrow';
				return (
					// The keydown handler covers the whole frame, not just the
					// canvas: undo/redo live in the header, so after clicking
					// one, focus sits outside the content region and the
					// keyboard shortcuts would no longer reach the handler.
					// `Page` takes no `onKeyDown`, hence the wrapper; it is
					// `display: contents`, so it adds no box to the layout.
					// eslint-disable-next-line jsx-a11y/no-static-element-interactions
					<div
						className="media-editor-route__shortcut-scope"
						onKeyDown={ onKeyDown }
					>
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
							badges={
								<MediaEditorFileDetails
									fileType={ fileType }
									fileSize={ fileSize }
								/>
							}
							actions={
								<>
									{ ! isNarrow && (
										<MediaEditor.HistoryActions />
									) }
									{ /* Same order as the block editor's
									     header: sidebar toggle, save, then the
									     more menu. */ }
									<MediaEditor.PanelToggle />
									{ /* Compact to match the header's other
									     controls, as elsewhere in wp-admin. */ }
									<MediaEditor.SaveActions size="compact" />
									<MediaEditor.MoreMenu />
								</>
							}
						>
							<div className="media-editor-route__content">
								{ children }
							</div>
							{ isNarrow && isImage && (
								<div className="media-editor-route__toolbar">
									<MediaEditor.HistoryActions />
								</div>
							) }
						</Page>
					</div>
				);
			} }
		/>
	);
}

export const stage = MediaEditorRoute;
