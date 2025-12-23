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
		const url = value?.url;

		if ( url ) {
			return (
				<img
					className="block-editor-content-only-controls__media-thumbnail"
					alt=""
					width={ 24 }
					height={ 24 }
					src={ url }
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

export default function Media( { data, field, onChange, config = {} } ) {
	const { popoverProps } = useInspectorPopoverPlacement( {
		isControl: true,
	} );
	const value = field.getValue( { item: data } );
	const { allowedTypes = [], multiple = false } = field.config || {};
	const { fieldDef } = config;
	const updateAttributes = ( newFieldValue ) => {
		const mappedChanges = field.setValue( {
			item: data,
			value: newFieldValue,
		} );
		onChange( mappedChanges );
	};

	// Check if featured image is supported by checking if it's in the mapping
	const hasFeaturedImageSupport =
		fieldDef?.mapping && 'featuredImage' in fieldDef.mapping;

	const id = value?.id;
	const url = value?.url;

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
				mediaURL={ url }
				multiple={ multiple }
				popoverProps={ popoverProps }
				onReset={ () => {
					// Build reset value dynamically based on mapping
					const resetValue = {};

					if ( fieldDef?.mapping ) {
						Object.keys( fieldDef.mapping ).forEach( ( key ) => {
							if (
								key === 'id' ||
								key === 'src' ||
								key === 'url'
							) {
								resetValue[ key ] = undefined;
							} else if ( key === 'caption' || key === 'alt' ) {
								resetValue[ key ] = '';
							}
						} );
					}

					// Turn off featured image when resetting (only if it's in the mapping)
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

						// Build new value dynamically based on what's in the mapping
						const newValue = {};

						// Iterate over mapping keys and set values for supported properties
						if ( fieldDef?.mapping ) {
							Object.keys( fieldDef.mapping ).forEach(
								( key ) => {
									if ( key === 'id' ) {
										newValue[ key ] = selectedMedia.id;
									} else if (
										key === 'src' ||
										key === 'url'
									) {
										newValue[ key ] = selectedMedia.url;
									} else if ( key === 'type' ) {
										newValue[ key ] = mediaType;
									} else if (
										key === 'link' &&
										selectedMedia.link
									) {
										newValue[ key ] = selectedMedia.link;
									} else if (
										key === 'caption' &&
										! value?.caption &&
										selectedMedia.caption
									) {
										newValue[ key ] = selectedMedia.caption;
									} else if (
										key === 'alt' &&
										! value?.alt &&
										selectedMedia.alt
									) {
										newValue[ key ] = selectedMedia.alt;
									} else if (
										key === 'poster' &&
										selectedMedia.poster
									) {
										newValue[ key ] = selectedMedia.poster;
									}
								}
							);
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
							{ url && (
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
												: url
										}
									</span>
								</>
							) }
							{ ! url && (
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
