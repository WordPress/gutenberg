/**
 * WordPress dependencies
 */
import { useParams } from '@wordpress/route';
import {
	useEntityRecord,
	EntityProvider,
	store as coreStore,
} from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { InterfaceSkeleton, ComplementaryArea } from '@wordpress/interface';

/**
 * Media editor components
 */
import {
	MediaEditorProvider,
	MediaPreview,
	type Media,
} from '@wordpress/media-editor';
import {
	altTextField,
	captionField,
	descriptionField,
	filenameField,
	filesizeField,
	mediaDimensionsField,
	mediaThumbnailField,
	mimeTypeField,
} from '@wordpress/media-fields';
import type { Field } from '@wordpress/media-editor';

/**
 * Internal dependencies
 */
import Header from './components/header';
import Sidebar from './components/sidebar';
import './style.scss';

const MEDIA_FIELDS: Field< Media >[] = [
	mediaThumbnailField,
	altTextField,
	captionField,
	descriptionField,
	filenameField,
	filesizeField,
	mediaDimensionsField,
	mimeTypeField,
].filter( Boolean );

const interfaceLabels = {
	/* translators: accessibility text for the media editor top bar landmark region. */
	header: __( 'Media editor top bar' ),
	/* translators: accessibility text for the media editor content landmark region. */
	body: __( 'Media editor content' ),
	/* translators: accessibility text for the media editor settings landmark region. */
	sidebar: __( 'Media details' ),
};

function MediaEditorRoute() {
	const { postId } = useParams( { from: '/media/$postId' } );

	// Fetch the media record
	const { isResolving } = useEntityRecord< Media >(
		'postType',
		'attachment',
		postId
	);

	// Get edited entity data
	const editedMedia = useSelect(
		( select ) => {
			return select( coreStore ).getEditedEntityRecord(
				'postType',
				'attachment',
				postId
			);
		},
		[ postId ]
	) as Media;

	// Dispatch actions
	const { editEntityRecord } = useDispatch( coreStore );

	const handleUpdate = ( updates: Partial< Media > ) => {
		editEntityRecord( 'postType', 'attachment', postId, updates );
	};

	return (
		<EntityProvider kind="postType" type="attachment" id={ postId }>
			<div className="media-editor-layout">
				<InterfaceSkeleton
					labels={ interfaceLabels }
					className="media-editor-interface"
					header={ <Header postId={ postId } /> }
					content={
						<div className="media-editor-canvas">
							<div className="media-editor-canvas__content">
								<MediaEditorProvider
									media={ editedMedia }
									fields={ MEDIA_FIELDS }
									onUpdate={ handleUpdate }
									isLoading={ isResolving }
								>
									<MediaPreview />
								</MediaEditorProvider>
							</div>
						</div>
					}
					sidebar={
						<ComplementaryArea.Slot scope="core/media-editor" />
					}
					secondarySidebar={ null }
					footer={ null }
				/>
				<Sidebar postId={ postId } />
			</div>
		</EntityProvider>
	);
}

function Stage() {
	const { postId } = useParams( { from: '/media/$postId' } );

	if ( ! postId ) {
		return <div>{ __( 'No media ID provided.' ) }</div>;
	}

	return <MediaEditorRoute />;
}

export const stage = Stage;
