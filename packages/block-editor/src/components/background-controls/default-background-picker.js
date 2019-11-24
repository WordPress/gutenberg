
/**
 * WordPress dependencies
 */
import { withNotices } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	BlockIcon,
	MediaPlaceholder,
	ColorPalette,
	__experimentalGradientPicker,
} from '../';

const DefaultBackgroundPicker = withNotices( ( {
	icon,
	label,
	onSelectMedia,
	allowedMediaTypes,
	className,
	noticeUI,
	noticeOperations,
	overlayColor,
	setOverlayColor,
	setGradient,
	setAttributes,
	gradientValue,
} ) => {
	const { removeAllNotices, createErrorNotice } = noticeOperations;

	const placeholderIcon = <BlockIcon icon={ icon } />;
	return (
		<>
			<MediaPlaceholder
				icon={ placeholderIcon }
				className={ className }
				labels={ {
					title: label,
					instructions: __( 'Upload an image or video file, or pick one from your media library.' ),
				} }
				onSelect={ onSelectMedia }
				accept="image/*,video/*"
				allowedTypes={ allowedMediaTypes }
				notices={ noticeUI }
				onError={ ( message ) => {
					removeAllNotices();
					createErrorNotice( message );
				} }
			>
				<div
					className="wp-block-cover__placeholder-background-options"
				>
					<ColorPalette
						disableCustomColors={ true }
						value={ overlayColor }
						onChange={ setOverlayColor }
						clearable={ false }
					/>
					<__experimentalGradientPicker
						onChange={
							( newGradient ) => {
								setGradient( newGradient );
								setAttributes( {
									overlayColor: undefined,
								} );
							}
						}
						value={ gradientValue }
						clearable={ false }
					/>
				</div>
			</MediaPlaceholder>
		</>
	);
} );

export default DefaultBackgroundPicker;
