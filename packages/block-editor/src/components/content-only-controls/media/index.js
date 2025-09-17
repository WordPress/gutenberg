/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalGrid as Grid,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	audio as audioIcon,
	image as imageIcon,
	media as mediaIcon,
	video as videoIcon,
	lineSolid,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MediaUpload from '../../media-upload';
import MediaUploadCheck from '../../media-upload/check';

function MediaThumbnail( { control, attributeValues } ) {
	const { allowedTypes, multiple } = control.args;
	const mapping = control.mapping;
	if ( multiple ) {
		return 'todo multiple';
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
	const typeKey = control.mapping.type;
	const idKey = control.mapping.id;
	const srcKey = control.mapping.src;
	const captionKey = control.mapping.caption;
	const altKey = control.mapping.alt;
	const posterKey = control.mapping.poster;

	const src = attributeValues[ srcKey ];
	const caption = attributeValues[ captionKey ];
	const alt = attributeValues[ altKey ];

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
				<MediaUpload
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
					allowedTypes={ control.args.allowedTypes }
					multiple={ control.args.multiple }
					render={ ( { open } ) => {
						return (
							<div className="block-editor-content-only-controls__media">
								<div
									role="button"
									tabIndex={ -1 }
									onClick={ () => {
										open();
									} }
									onKeyDown={ open }
								>
									<Grid
										rowGap={ 0 }
										columnGap={ 8 }
										templateColumns="24px 1fr 24px"
										className="block-editor-content-only-controls__media-row"
									>
										{ src && (
											<>
												<MediaThumbnail
													control={ control }
													attributeValues={
														attributeValues
													}
												/>
												<span className="block-editor-content-only-controls__media-title">
													{
														// TODO - use media title instead of src.
														// TODO - truncate to show filename when there's no title.
														src
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
										{ src && (
											<>
												<Button
													size="small"
													className="block-editor-content-only-controls__remove-button"
													icon={ lineSolid }
													onClick={ ( event ) => {
														event.stopPropagation();
														updateAttributes(
															defaultValues
														);
													} }
												/>
											</>
										) }
									</Grid>
								</div>
							</div>
						);
					} }
				/>
			</ToolsPanelItem>
		</MediaUploadCheck>
	);
}
