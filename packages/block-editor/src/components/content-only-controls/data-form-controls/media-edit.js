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

function MediaThumbnail( { field, data, attachment } ) {
	const { allowedTypes } = field.Edit || {};
	const { mapping } = field;

	if ( ! mapping ) {
		return <Icon icon={ mediaIcon } size={ 24 } />;
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

	if ( allowedTypes?.length === 1 ) {
		const srcAttr = mapping.src;
		const src = srcAttr ? data[ srcAttr ] : undefined;

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

/**
 * MediaEdit component for DataForm integration.
 * Provides media picker capabilities compatible with DataForm's Edit component API.
 *
 * @param {Object}   props          - Component props.
 * @param {Object}   props.data     - Block attributes.
 * @param {Object}   props.field    - DataForm field configuration.
 * @param {Function} props.onChange - Callback for value changes.
 */
export default function MediaEdit( { data, field, onChange } ) {
	const { popoverProps } = useInspectorPopoverPlacement( {
		isControl: true,
	} );

	const { mapping, Edit: editConfig } = field;
	const allowedTypes = editConfig?.allowedTypes || [];
	const multiple = editConfig?.multiple || false;

	// Get attribute names from mapping
	const idAttr = mapping?.id;
	const srcAttr = mapping?.src;
	const captionAttr = mapping?.caption;
	const altAttr = mapping?.alt;
	const posterAttr = mapping?.poster;
	const featuredImageAttr = mapping?.featuredImage;
	const typeAttr = mapping?.type;

	// Get current values
	const id = idAttr ? data[ idAttr ] : undefined;
	const src = srcAttr ? data[ srcAttr ] : undefined;
	const caption = captionAttr ? data[ captionAttr ] : undefined;
	const alt = altAttr ? data[ altAttr ] : undefined;
	const useFeaturedImage = featuredImageAttr
		? data[ featuredImageAttr ]
		: undefined;

	// Fetch attachment metadata
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

	// Generate label based on allowed types
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
					// Reset all mapped attributes to undefined
					const updates = {};
					if ( idAttr ) {
						updates[ idAttr ] = undefined;
					}
					if ( srcAttr ) {
						updates[ srcAttr ] = undefined;
					}
					if ( captionAttr ) {
						updates[ captionAttr ] = undefined;
					}
					if ( altAttr ) {
						updates[ altAttr ] = undefined;
					}
					if ( posterAttr ) {
						updates[ posterAttr ] = undefined;
					}
					if ( featuredImageAttr ) {
						updates[ featuredImageAttr ] = undefined;
					}
					onChange( updates );
				} }
				useFeaturedImage={ !! useFeaturedImage }
				onToggleFeaturedImage={
					!! featuredImageAttr &&
					( () => {
						onChange( {
							[ featuredImageAttr ]: ! useFeaturedImage,
						} );
					} )
				}
				onSelect={ ( selectedMedia ) => {
					if ( selectedMedia.id && selectedMedia.url ) {
						const updates = {};

						if ( idAttr ) {
							updates[ idAttr ] = selectedMedia.id;
						}
						if ( srcAttr ) {
							updates[ srcAttr ] = selectedMedia.url;
						}
						if ( typeAttr && selectedMedia.type ) {
							updates[ typeAttr ] = selectedMedia.type;
						}
						if (
							captionAttr &&
							! caption &&
							selectedMedia.caption
						) {
							updates[ captionAttr ] = selectedMedia.caption;
						}
						if ( altAttr && ! alt && selectedMedia.alt ) {
							updates[ altAttr ] = selectedMedia.alt;
						}
						if ( posterAttr && selectedMedia.poster ) {
							updates[ posterAttr ] = selectedMedia.poster;
						}

						onChange( updates );
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
