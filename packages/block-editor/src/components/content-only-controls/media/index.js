/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	__experimentalGrid as Grid,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	audio as audioIcon,
	image as imageIcon,
	media as mediaIcon,
	video as videoIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MediaReplaceFlow from '../../media-replace-flow';
import MediaUploadCheck from '../../media-upload/check';
import { useInspectorPopoverPlacement } from '../use-inspector-popover-placement';
import { getMediaSelectKey } from '../../../store/private-keys';
import { store as blockEditorStore } from '../../../store';

function MediaThumbnail( { data, field, attachment } ) {
	const config = field.config || {};
	const { allowedTypes = [], multiple = false } = config;

	if ( multiple ) {
		return 'todo multiple';
	}

	if ( attachment?.media_type === 'image' || attachment?.poster ) {
		return (
			<img
				className="block-editor-content-only-controls__media-thumbnail"
				alt=""
				width={ 24 }
				height={ 24 }
				src={
					attachment.media_type === 'image'
						? attachment.source_url
						: attachment.poster
				}
			/>
		);
	}

	if ( allowedTypes.length === 1 ) {
		const value = field.getValue( { item: data } );
		const src = value?.src || value?.url;

		if ( src ) {
			return (
				<img
					className="block-editor-content-only-controls__media-thumbnail"
					alt=""
					width={ 24 }
					height={ 24 }
					src={ src }
				/>
			);
		}

		let icon;
		if ( allowedTypes[ 0 ] === 'image' ) {
			icon = imageIcon;
		} else if ( allowedTypes[ 0 ] === 'video' ) {
			icon = videoIcon;
		} else if ( allowedTypes[ 0 ] === 'audio' ) {
			icon = audioIcon;
		} else {
			icon = mediaIcon;
		}

		if ( icon ) {
			return <Icon icon={ icon } size={ 24 } />;
		}
	}

	return <Icon icon={ mediaIcon } size={ 24 } />;
}

export default function Media( { data, field } ) {
	const { popoverProps } = useInspectorPopoverPlacement( {
		isControl: true,
	} );
	const value = field.getValue( { item: data } );
	const config = field.config || {};
	const { allowedTypes = [], multiple = false } = config;

	// For custom Edit components, we need to call updateBlockAttributes directly
	const { clientId, updateBlockAttributes } = field;
	const updateAttributes = ( newFieldValue ) => {
		const mappedChanges = field.setValue( {
			item: data,
			value: newFieldValue,
		} );
		updateBlockAttributes( clientId, mappedChanges );
	};

	// Check if featured image is supported by checking if it's in the value
	// Cover block uses 'featuredImage' as the field property name
	const hasFeaturedImageSupport = 'featuredImage' in value;

	const id = value?.id;
	const src = value?.src || value?.url;

	const attachment = useSelect(
		( select ) => {
			if ( ! id ) {
				return;
			}

			const settings = select( blockEditorStore ).getSettings();
			const getMedia = settings[ getMediaSelectKey ];

			if ( ! getMedia ) {
				return;
			}

			return getMedia( select, id );
		},
		[ id ]
	);

	// TODO - pluralize when multiple.
	let chooseItemLabel;
	if ( allowedTypes.length === 1 ) {
		const allowedType = allowedTypes[ 0 ];
		if ( allowedType === 'image' ) {
			chooseItemLabel = __( 'Choose an image…' );
		} else if ( allowedType === 'video' ) {
			chooseItemLabel = __( 'Choose a video…' );
		} else if ( allowedType === 'application' ) {
			chooseItemLabel = __( 'Choose a file…' );
		} else {
			chooseItemLabel = __( 'Choose a media item…' );
		}
	} else {
		chooseItemLabel = __( 'Choose a media item…' );
	}

	return (
		<MediaUploadCheck>
			<MediaReplaceFlow
				className="block-editor-content-only-controls__media-replace-flow"
				allowedTypes={ allowedTypes }
				mediaId={ id }
				mediaURL={ src }
				multiple={ multiple }
				popoverProps={ popoverProps }
				onReset={ () => {
					// Reset to empty/cleared values
					const resetValue = {
						id: undefined,
						src: undefined,
						url: undefined,
						caption: '',
						alt: '',
					};
					// Turn off featured image when resetting
					if ( hasFeaturedImageSupport ) {
						resetValue.featuredImage = false;
					}
					// Merge with existing value to preserve other field properties
					updateAttributes( { ...value, ...resetValue } );
				} }
				{ ...( hasFeaturedImageSupport && {
					useFeaturedImage: !! value?.featuredImage,
					onToggleFeaturedImage: () => {
						updateAttributes( {
							...value,
							featuredImage: ! value?.featuredImage,
						} );
					},
				} ) }
				onSelect={ ( selectedMedia ) => {
					if ( selectedMedia.id && selectedMedia.url ) {
						// Determine mediaType from MIME type, not from object type
						let mediaType = 'image'; // default
						if ( selectedMedia.mime_type ) {
							if (
								selectedMedia.mime_type.startsWith( 'video/' )
							) {
								mediaType = 'video';
							} else if (
								selectedMedia.mime_type.startsWith( 'audio/' )
							) {
								mediaType = 'audio';
							}
						}

						const newValue = {
							id: selectedMedia.id,
							src: selectedMedia.url,
							url: selectedMedia.url,
							type: mediaType,
						};

						// Capture mediaLink
						if ( selectedMedia.link ) {
							newValue.link = selectedMedia.link;
						}

						if ( ! value?.caption && selectedMedia.caption ) {
							newValue.caption = selectedMedia.caption;
						}
						if ( ! value?.alt && selectedMedia.alt ) {
							newValue.alt = selectedMedia.alt;
						}
						if ( selectedMedia.poster ) {
							newValue.poster = selectedMedia.poster;
						}

						// Turn off featured image when manually selecting media
						if ( hasFeaturedImageSupport ) {
							newValue.featuredImage = false;
						}

						// Merge with existing value to preserve other field properties
						const finalValue = { ...value, ...newValue };
						updateAttributes( finalValue );
					}
				} }
				renderToggle={ ( buttonProps ) => (
					<Button
						__next40pxDefaultSize
						className="block-editor-content-only-controls__media"
						{ ...buttonProps }
					>
						<Grid
							rowGap={ 0 }
							columnGap={ 8 }
							templateColumns="24px 1fr"
							className="block-editor-content-only-controls__media-row"
						>
							{ src && (
								<>
									<MediaThumbnail
										attachment={ attachment }
										field={ field }
										data={ data }
									/>
									<span className="block-editor-content-only-controls__media-title">
										{
											// TODO - truncate long titles or url smartly (e.g. show filename).
											attachment?.title?.raw &&
											attachment?.title?.raw !== ''
												? attachment?.title?.raw
												: src
										}
									</span>
								</>
							) }
							{ ! src && (
								<>
									<span
										className="block-editor-content-only-controls__media-placeholder"
										style={ {
											width: '24px',
											height: '24px',
										} }
									/>
									<span className="block-editor-content-only-controls__media-title">
										{ chooseItemLabel }
									</span>
								</>
							) }
						</Grid>
					</Button>
				) }
			/>
		</MediaUploadCheck>
	);
}
