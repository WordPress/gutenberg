/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Placeholder } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { registerBlockType, query } from '../../api';
import MediaUploadButton from '../../media-upload-button';

const { attr } = query;

registerBlockType( 'core/video', {
	title: __( 'Video' ),

	icon: 'media-video',

	category: 'common',

	attributes: {
		src: attr( 'video', 'src' ),
	},

	edit( { attributes, setAttributes, className } ) {
		const { src } = attributes;
		const onSelectVideo = ( media ) => {
			if ( media && media.url ) {
				setAttributes( {
					src: media.url,
				} );
			}
		};

		if ( ! src ) {
			return [
				<Placeholder
					key="placeholder"
					icon="media-video"
					label={ __( 'Video' ) }
					instructions={ __( 'Select a video file from your library, or paste a URL below:' ) }
					className={ className }>
					<MediaUploadButton
						buttonProps={ { isLarge: true } }
						onSelect={ onSelectVideo }
						type="video"
					>
						{ __( 'Insert from Media Library' ) }
					</MediaUploadButton>
				</Placeholder>,
			];
		}

		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return [
			<div key="video">
				<video controls src={ src } />
			</div>,
		];
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	},

	save( { attributes } ) {
		const { src } = attributes;
		return (
			<video controls src={ src } />
		);
	},
} );
