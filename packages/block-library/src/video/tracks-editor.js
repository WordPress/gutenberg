/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	NavigableMenu,
	MenuItem,
	FormFileUpload,
	MenuGroup,
	ToolbarButton,
	Dropdown,
	SVG,
	Rect,
	Path,
	Button,
	TextControl,
	SelectControl,
} from '@wordpress/components';
import {
	MediaUpload,
	MediaUploadCheck,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { upload, media } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

const ALLOWED_TYPES = [ 'text/vtt' ];

const DEFAULT_KIND = 'subtitles';

const KIND_OPTIONS = [
	{ label: __( 'Subtitles' ), value: 'subtitles' },
	{ label: __( 'Captions' ), value: 'captions' },
	{ label: __( 'Descriptions' ), value: 'descriptions' },
	{ label: __( 'Chapters' ), value: 'chapters' },
	{ label: __( 'Metadata' ), value: 'metadata' },
];

const captionIcon = (
	<SVG width="18" height="14" viewBox="0 0 18 14" role="img" fill="none">
		<Rect
			x="0.75"
			y="0.75"
			width="16.5"
			height="12.5"
			rx="1.25"
			stroke="black"
			strokeWidth="1.5"
			fill="none"
		/>
		<Path d="M3 7H15" stroke="black" strokeWidth="1.5" />
		<Path d="M3 10L15 10" stroke="black" strokeWidth="1.5" />
	</SVG>
);

function TrackList( { tracks, onEditPress } ) {
	let content;
	if ( tracks.length === 0 ) {
		content = (
			<p className="block-library-video-tracks-editor__tracks-informative-message">
				{ __(
					'Tracks can be subtitles, captions, chapters, or descriptions. They help make your content more accessible to a wider range of users.'
				) }
			</p>
		);
	} else {
		content = tracks.map( ( track, index ) => {
			return (
				<div
					key={ index }
					className="block-library-video-tracks-editor__track-list-track"
				>
					<span>{ track.label } </span>
					<Button
						variant="tertiary"
						onClick={ () => onEditPress( index ) }
						aria-label={ sprintf(
							/* translators: %s: Label of the video text track e.g: "French subtitles" */
							__( 'Edit %s' ),
							track.label
						) }
					>
						{ __( 'Edit' ) }
					</Button>
				</div>
			);
		} );
	}
	return (
		<MenuGroup
			label={ __( 'Text tracks' ) }
			className="block-library-video-tracks-editor__track-list"
		>
			{ content }
		</MenuGroup>
	);
}

function SingleTrackEditor( { track, onChange, onClose, onRemove } ) {
	const { src = '', label = '', srcLang = '', kind = DEFAULT_KIND } = track;
	const fileName = src.startsWith( 'blob:' )
		? ''
		: src.substring( src.lastIndexOf( '/' ) + 1 );
	return (
		<NavigableMenu>
			<div className="block-library-video-tracks-editor__single-track-editor">
				<span className="block-library-video-tracks-editor__single-track-editor-edit-track-label">
					{ __( 'Edit track' ) }
				</span>
				<span>
					{ __( 'File' ) }: <b>{ fileName }</b>
				</span>
				<div className="block-library-video-tracks-editor__single-track-editor-label-language">
					<TextControl
						/* eslint-disable jsx-a11y/no-autofocus */
						autoFocus
						/* eslint-enable jsx-a11y/no-autofocus */
						onChange={ ( newLabel ) =>
							onChange( {
								...track,
								label: newLabel,
							} )
						}
						label={ __( 'Label' ) }
						value={ label }
						help={ __( 'Title of track' ) }
					/>
					<TextControl
						onChange={ ( newSrcLang ) =>
							onChange( {
								...track,
								srcLang: newSrcLang,
							} )
						}
						label={ __( 'Source language' ) }
						value={ srcLang }
						help={ __( 'Language tag (en, fr, etc.)' ) }
					/>
				</div>
				<SelectControl
					className="block-library-video-tracks-editor__single-track-editor-kind-select"
					options={ KIND_OPTIONS }
					value={ kind }
					label={ __( 'Kind' ) }
					onChange={ ( newKind ) => {
						onChange( {
							...track,
							kind: newKind,
						} );
					} }
				/>
				<div className="block-library-video-tracks-editor__single-track-editor-buttons-container">
					<Button
						variant="secondary"
						onClick={ () => {
							const changes = {};
							let hasChanges = false;
							if ( label === '' ) {
								changes.label = __( 'English' );
								hasChanges = true;
							}
							if ( srcLang === '' ) {
								changes.srcLang = 'en';
								hasChanges = true;
							}
							if ( track.kind === undefined ) {
								changes.kind = DEFAULT_KIND;
								hasChanges = true;
							}
							if ( hasChanges ) {
								onChange( {
									...track,
									...changes,
								} );
							}
							onClose();
						} }
					>
						{ __( 'Close' ) }
					</Button>
					<Button isDestructive variant="link" onClick={ onRemove }>
						{ __( 'Remove track' ) }
					</Button>
				</div>
			</div>
		</NavigableMenu>
	);
}

export default function TracksEditor( { tracks = [], onChange } ) {
	const mediaUpload = useSelect( ( select ) => {
		return select( blockEditorStore ).getSettings().mediaUpload;
	}, [] );
	const [ trackBeingEdited, setTrackBeingEdited ] = useState( null );

	if ( ! mediaUpload ) {
		return null;
	}
	return (
		<Dropdown
			contentClassName="block-library-video-tracks-editor"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<ToolbarButton
					label={ __( 'Text tracks' ) }
					showTooltip
					aria-expanded={ isOpen }
					aria-haspopup="true"
					onClick={ onToggle }
					icon={ captionIcon }
				/>
			) }
			renderContent={ ( {} ) => {
				if ( trackBeingEdited !== null ) {
					return (
						<SingleTrackEditor
							track={ tracks[ trackBeingEdited ] }
							onChange={ ( newTrack ) => {
								const newTracks = [ ...tracks ];
								newTracks[ trackBeingEdited ] = newTrack;
								onChange( newTracks );
							} }
							onClose={ () => setTrackBeingEdited( null ) }
							onRemove={ () => {
								onChange(
									tracks.filter(
										( _track, index ) =>
											index !== trackBeingEdited
									)
								);
								setTrackBeingEdited( null );
							} }
						/>
					);
				}
				return (
					<>
						<NavigableMenu>
							<TrackList
								tracks={ tracks }
								onEditPress={ setTrackBeingEdited }
							/>
							<MenuGroup
								className="block-library-video-tracks-editor__add-tracks-container"
								label={ __( 'Add tracks' ) }
							>
								<MediaUpload
									onSelect={ ( { url } ) => {
										const trackIndex = tracks.length;
										onChange( [ ...tracks, { src: url } ] );
										setTrackBeingEdited( trackIndex );
									} }
									allowedTypes={ ALLOWED_TYPES }
									render={ ( { open } ) => (
										<MenuItem
											icon={ media }
											onClick={ open }
										>
											{ __( 'Open Media Library' ) }
										</MenuItem>
									) }
								/>
								<MediaUploadCheck>
									<FormFileUpload
										onChange={ ( event ) => {
											const files = event.target.files;
											const trackIndex = tracks.length;
											mediaUpload( {
												allowedTypes: ALLOWED_TYPES,
												filesList: files,
												onFileChange: ( [
													{ url },
												] ) => {
													const newTracks = [
														...tracks,
													];
													if (
														! newTracks[
															trackIndex
														]
													) {
														newTracks[
															trackIndex
														] = {};
													}
													newTracks[ trackIndex ] = {
														...tracks[ trackIndex ],
														src: url,
													};
													onChange( newTracks );
													setTrackBeingEdited(
														trackIndex
													);
												},
											} );
										} }
										accept=".vtt,text/vtt"
										render={ ( { openFileDialog } ) => {
											return (
												<MenuItem
													icon={ upload }
													onClick={ () => {
														openFileDialog();
													} }
												>
													{ __( 'Upload' ) }
												</MenuItem>
											);
										} }
									/>
								</MediaUploadCheck>
							</MenuGroup>
						</NavigableMenu>
					</>
				);
			} }
		/>
	);
}
