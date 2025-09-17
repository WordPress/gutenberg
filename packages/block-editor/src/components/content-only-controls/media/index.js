/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalGrid as Grid,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { lineSolid } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MediaUpload from '../../media-upload';
import MediaUploadCheck from '../../media-upload/check';

export default function Media( {
	clientId,
	control,
	blockType,
	attributeValues,
	updateAttributes,
} ) {
	const idKey = control.mapping.id;
	const srcKey = control.mapping.src;
	const captionKey = control.mapping.caption;
	const altKey = control.mapping.alt;

	const src = attributeValues[ srcKey ];
	const caption = attributeValues[ captionKey ];
	const alt = attributeValues[ altKey ];

	const idDefaultValue =
		blockType.attributes[ idKey ]?.defaultValue ?? undefined;
	const srcDefaultValue =
		blockType.attributes[ srcKey ]?.defaultValue ?? undefined;
	const captionDefaultValue =
		blockType.attributes[ captionKey ]?.defaultValue ?? undefined;
	const altDefaultValue =
		blockType.attributes[ altKey ]?.defaultValue ?? undefined;

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

	return (
		<MediaUploadCheck>
			<ToolsPanelItem
				panelId={ clientId }
				label={ control.label }
				hasValue={ () => !! src }
				onDeselect={ () => {
					updateAttributes( {
						[ idKey ]: idDefaultValue,
						[ srcKey ]: srcDefaultValue,
						[ captionKey ]: captionDefaultValue,
						[ altKey ]: altDefaultValue,
					} );
				} }
				isShownByDefault={ control.shownByDefault }
			>
				<MediaUpload
					onSelect={ ( selectedMedia ) => {
						if ( selectedMedia.id && selectedMedia.url ) {
							const optionalAttributes = {};

							if ( ! caption && selectedMedia.caption ) {
								optionalAttributes[ captionKey ] =
									selectedMedia.caption;
							}
							if ( ! alt && selectedMedia.alt ) {
								optionalAttributes[ altKey ] =
									selectedMedia.alt;
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
												<img
													className="block-editor-content-only-controls__media-thumbnail"
													alt=""
													width={ 24 }
													height={ 24 }
													src={ src }
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
														updateAttributes( {
															[ idKey ]:
																idDefaultValue,
															[ srcKey ]:
																srcDefaultValue,
															[ captionKey ]:
																captionDefaultValue,
															[ altKey ]:
																altDefaultValue,
														} );
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
