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
import './style.scss';
import { registerBlockType, source } from '../../api';
import MediaUploadButton from '../../media-upload-button';

const { attr } = source;

registerBlockType( 'core/audio', {
	title: __( 'Audio' ),

	icon: 'format-audio',

	category: 'common',

	attributes: {
		src: {
			type: 'string',
			source: attr( 'audio', 'src' ),
		},
	},

	edit( { attributes, setAttributes, className } ) {
		const { src } = attributes;
		const onSelectAudio = ( media ) => {
			if ( media && media.url ) {
				setAttributes( { src: media.url } );
			}
		};

		if ( ! src ) {
			return [
				<Placeholder
					key="placeholder"
					icon="media-audio"
					label={ __( 'Audio' ) }
					instructions={ __( 'Select an audio file from your library, or upload a new one:' ) }
					className={ className }>
					<MediaUploadButton
						buttonProps={ { isLarge: true } }
						onSelect={ onSelectAudio }
						type="audio"
					>
						{ __( 'Insert from Media Library' ) }
					</MediaUploadButton>
				</Placeholder>,
			];
		}

		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return [
			<div key="audio">
				<audio controls="controls" src={ src } />
			</div>,
		];
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	},

	save( { attributes } ) {
		const { src } = attributes;
		return (
			<audio controls="controls" src={ src } />
		);
	},
} );
