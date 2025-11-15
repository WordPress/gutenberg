/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalGrid as Grid,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
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

function MediaThumbnail( { control, attributeValues, attachment } ) {
	const { allowedTypes, multiple } = control.args;
	const mapping = control.mapping;
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
		let src;
		if (
			allowedTypes[ 0 ] === 'image' &&
			mapping.src &&
			attributeValues[ mapping.src ]
		) {
			src = attributeValues[ mapping.src ];
		} else if (
			allowedTypes[ 0 ] === 'video' &&
			mapping.poster &&
			attributeValues[ mapping.poster ]
		) {
			src = attributeValues[ mapping.poster ];
		}

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

export default function Media( {
	clientId,
	control,
	blockType,
	attributeValues,
	updateAttributes,
} ) {
	const { popoverProps } = useInspectorPopoverPlacement( {
		isControl: true,
	} );
	const typeKey = control.mapping.type;
	const idKey = control.mapping.id;
	const srcKey = control.mapping.src;
	const captionKey = control.mapping.caption;
	const altKey = control.mapping.alt;
	const posterKey = control.mapping.poster;
	const featuredImageKey = control.mapping.featuredImage;

	const id = attributeValues[ idKey ];
	const src = attributeValues[ srcKey ];
	const caption = attributeValues[ captionKey ];
	const alt = attributeValues[ altKey ];
	const useFeaturedImage = attributeValues[ featuredImageKey ];

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
	if ( control.args.allowedTypes.length === 1 ) {
		const allowedType = control.args.allowedTypes[ 0 ];
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

	const defaultValues = useMemo( () => {
		return Object.fromEntries(
			Object.entries( control.mapping ).map( ( [ , attributeKey ] ) => {
				return [
					attributeKey,
					blockType.attributes[ attributeKey ]?.defaultValue ??
						undefined,
				];
			} )
		);
	}, [ blockType.attributes, control.mapping ] );

	return (
		<MediaUploadCheck>
			<ToolsPanelItem
				panelId={ clientId }
				label={ control.label }
				hasValue={ () => !! src }
				onDeselect={ () => {
					updateAttributes( defaultValues );
				} }
				isShownByDefault={ control.shownByDefault }
			>
				<MediaReplaceFlow
					className="block-editor-content-only-controls__media-replace-flow"
					allowedTypes={ control.args.allowedTypes }
					mediaId={ id }
					mediaURL={ src }
					multiple={ control.args.multiple }
					popoverProps={ popoverProps }
					onReset={ () => {
						updateAttributes( defaultValues );
					} }
					useFeaturedImage={ !! useFeaturedImage }
					onToggleFeaturedImage={
						!! featuredImageKey &&
						( () => {
							updateAttributes( {
								...defaultValues,
								[ featuredImageKey ]: ! useFeaturedImage,
							} );
						} )
					}
					onSelect={ ( selectedMedia ) => {
						if ( selectedMedia.id && selectedMedia.url ) {
							const optionalAttributes = {};

							if ( typeKey && selectedMedia.type ) {
								optionalAttributes[ typeKey ] =
									selectedMedia.type;
							}

							if (
								captionKey &&
								! caption &&
								selectedMedia.caption
							) {
								optionalAttributes[ captionKey ] =
									selectedMedia.caption;
							}
							if ( altKey && ! alt && selectedMedia.alt ) {
								optionalAttributes[ altKey ] =
									selectedMedia.alt;
							}
							if ( posterKey && selectedMedia.poster ) {
								optionalAttributes[ posterKey ] =
									selectedMedia.poster;
							}

							updateAttributes( {
								[ idKey ]: selectedMedia.id,
								[ srcKey ]: selectedMedia.url,
								...optionalAttributes,
							} );
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
											control={ control }
											attributeValues={ attributeValues }
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
			</ToolsPanelItem>
		</MediaUploadCheck>
	);
}
