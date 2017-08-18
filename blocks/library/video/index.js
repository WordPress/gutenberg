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
import { registerBlockType, source } from '../../api';
import MediaUploadButton from '../../media-upload-button';
import Editable from '../../editable';

const { attr, children } = source;

registerBlockType( 'core/video', {
	title: __( 'Video' ),

	icon: 'format-video',

	category: 'common',

	attributes: {
		src: {
			type: 'string',
			source: attr( 'video', 'src' ),
		},
		caption: {
			type: 'array',
			source: children( 'figcaption' ),
		},
	},

	edit( { attributes, setAttributes, className, focus, setFocus } ) {
		const { src, caption } = attributes;
		const onSelectVideo = ( media ) => {
			if ( media && media.url ) {
				setAttributes( {
					src: media.url,
				} );
			}
		};
		const focusCaption = ( focusValue ) => setFocus( { editable: 'caption', ...focusValue } );

		if ( ! src ) {
			return [
				<Placeholder
					key="placeholder"
					icon="media-video"
					label={ __( 'Video' ) }
					instructions={ __( 'Select a video file from your library:' ) }
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
			<figure key="video" className={ className }>
				<video controls src={ src } onClick={ setFocus } />
				{ ( caption && caption.length > 0 ) || !! focus ? (
					<Editable
						tagName="figcaption"
						placeholder={ __( 'Write caption…' ) }
						value={ caption }
						focus={ focus && focus.editable === 'caption' ? focus : undefined }
						onFocus={ focusCaption }
						onChange={ ( value ) => setAttributes( { caption: value } ) }
						inlineToolbar
					/>
				) : null }
			</figure>,
		];
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	},

	save( { attributes } ) {
		const { src, caption } = attributes;
		return (

			<figure>
				{ src && <video controls src={ src } /> }
				{ caption && caption.length > 0 && <figcaption>{ caption }</figcaption> }
			</figure>
		);
	},
} );
