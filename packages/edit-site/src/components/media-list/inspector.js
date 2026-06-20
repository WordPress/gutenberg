/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { __, sprintf, _n } from '@wordpress/i18n';
import {
	Icon,
	image as imageIcon,
	audio as audioIcon,
	video as videoIcon,
	file as fileIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

function getMediaTypeIcon( mimeType ) {
	if ( ! mimeType ) {
		return fileIcon;
	}
	if ( mimeType.startsWith( 'image/' ) ) {
		return imageIcon;
	}
	if ( mimeType.startsWith( 'audio/' ) ) {
		return audioIcon;
	}
	if ( mimeType.startsWith( 'video/' ) ) {
		return videoIcon;
	}
	return fileIcon;
}

function formatFileSize( bytes ) {
	if ( ! bytes ) {
		return '';
	}
	const sizes = [ 'B', 'KB', 'MB', 'GB' ];
	const i = Math.floor( Math.log( bytes ) / Math.log( 1024 ) );
	return (
		parseFloat( ( bytes / Math.pow( 1024, i ) ).toFixed( 1 ) ) +
		' ' +
		sizes[ i ]
	);
}

function formatHumanTime( dateString ) {
	if ( ! dateString ) {
		return '';
	}
	const date = new Date( dateString );
	const now = new Date();
	const diffMs = now - date;
	const diffSec = Math.floor( diffMs / 1000 );
	const diffMin = Math.floor( diffSec / 60 );
	const diffHour = Math.floor( diffMin / 60 );
	const diffDay = Math.floor( diffHour / 24 );

	if ( Math.floor( diffDay / 365 ) > 0 ) {
		const y = Math.floor( diffDay / 365 );
		return sprintf(
			/* translators: %d: number of years */
			_n( '%d year ago', '%d years ago', y ),
			y
		);
	}
	if ( Math.floor( diffDay / 30 ) > 0 ) {
		const m = Math.floor( diffDay / 30 );
		return sprintf(
			/* translators: %d: number of months */
			_n( '%d month ago', '%d months ago', m ),
			m
		);
	}
	if ( diffDay > 0 ) {
		return sprintf(
			/* translators: %d: number of days */
			_n( '%d day ago', '%d days ago', diffDay ),
			diffDay
		);
	}
	if ( diffHour > 0 ) {
		return sprintf(
			/* translators: %d: number of hours */
			_n( '%d hour ago', '%d hours ago', diffHour ),
			diffHour
		);
	}
	if ( diffMin > 0 ) {
		return sprintf(
			/* translators: %d: number of minutes */
			_n( '%d minute ago', '%d minutes ago', diffMin ),
			diffMin
		);
	}
	return __( 'Just now' );
}

function MetaRow( { label, children } ) {
	return (
		<div className="edit-site-media-inspector__meta-row">
			<span className="edit-site-media-inspector__meta-label">
				{ label }
			</span>
			<span className="edit-site-media-inspector__meta-value">
				{ children }
			</span>
		</div>
	);
}

function MetaSection( { title, children } ) {
	return (
		<div className="edit-site-media-inspector__section">
			<h3 className="edit-site-media-inspector__section-title">
				{ title }
			</h3>
			{ children }
		</div>
	);
}

export default function MediaInspector() {
	const { query } = useLocation();
	const { postId } = query;

	const attachment = useSelect(
		( select ) => {
			if ( ! postId ) {
				return null;
			}
			const { getEntityRecord } = select( coreStore );
			return getEntityRecord( 'postType', 'attachment', postId );
		},
		[ postId ]
	);

	if ( ! postId || ! attachment ) {
		return null;
	}

	const titleValue =
		attachment.title?.raw ||
		attachment.title?.rendered ||
		__( '(no title)' );
	const mimeType = attachment.mime_type || '';
	const mediaTypeIcon = getMediaTypeIcon( mimeType );
	const authorName =
		attachment._embedded?.author?.[ 0 ]?.name || __( 'Unknown' );
	const fileSize = formatFileSize(
		attachment.media_details?.filesize || attachment.filesize_raw
	);
	const dimensions = attachment.media_details?.width
		? `${ attachment.media_details.width } × ${ attachment.media_details.height }`
		: '';

	return (
		<div className="edit-site-media-inspector">
			<div className="edit-site-media-inspector__header">
				<Icon icon={ mediaTypeIcon } size={ 24 } />
				<h2 className="edit-site-media-inspector__title">
					{ titleValue }
				</h2>
			</div>

			<div className="edit-site-media-inspector__preview">
				{ mimeType.startsWith( 'image/' ) && attachment.source_url && (
					<img
						src={ attachment.source_url }
						alt={ attachment.alt_text || '' }
						className="edit-site-media-inspector__image"
					/>
				) }
				{ ! mimeType.startsWith( 'image/' ) && (
					<div className="edit-site-media-inspector__file-icon">
						<Icon icon={ mediaTypeIcon } size={ 48 } />
					</div>
				) }
			</div>

			<div className="edit-site-media-inspector__body">
				<div className="edit-site-media-inspector__description-field">
					<span className="edit-site-media-inspector__description-label">
						{ __( 'Description' ) }
					</span>
					<p className="edit-site-media-inspector__description-text">
						{ attachment.description?.raw ||
							__( 'Add a description\u2026' ) }
					</p>
				</div>

				<div className="edit-site-media-inspector__audit">
					<span>
						{ sprintf(
							/* translators: %s: author name */
							__( 'Uploaded by %s' ),
							authorName
						) }
					</span>
					<span>
						{ attachment.date
							? sprintf(
									/* translators: %s: relative time */
									__( 'Uploaded %s' ),
									formatHumanTime( attachment.date )
							  )
							: '' }
					</span>
					<span>
						{ attachment.modified
							? sprintf(
									/* translators: %s: relative time */
									__( 'Last modified %s' ),
									formatHumanTime( attachment.modified )
							  )
							: '' }
					</span>
				</div>

				<MetaSection title={ __( 'Metadata' ) }>
					<MetaRow label={ __( 'Attached To' ) }>
						{ attachment.post
							? String( attachment.post )
							: __( 'Unattached' ) }
					</MetaRow>
					<MetaRow label={ __( 'Comments' ) }>
						{ String( attachment.comment_count ?? 0 ) }
					</MetaRow>
					<MetaRow label={ __( 'Alt Text' ) }>
						{ attachment.alt_text || '—' }
					</MetaRow>
					<MetaRow label={ __( 'Caption' ) }>
						{ attachment.caption?.raw || '—' }
					</MetaRow>
					<MetaRow label={ __( 'File Name' ) }>
						{ attachment.filename_raw || '—' }
					</MetaRow>
					<MetaRow label={ __( 'Format' ) }>
						{ mimeType.split( '/' )[ 1 ]?.toUpperCase() || '—' }
					</MetaRow>
					<MetaRow label={ __( 'File Size' ) }>
						{ fileSize || '—' }
					</MetaRow>
					{ dimensions && (
						<MetaRow label={ __( 'Dimensions' ) }>
							{ dimensions }
						</MetaRow>
					) }
				</MetaSection>
			</div>
		</div>
	);
}
