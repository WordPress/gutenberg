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
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

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
		align: {
			type: 'string',
		},
	},

	getEditWrapperProps( attributes ) {
		const { align, width } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align, 'data-resized': !! width };
		}
	},

	edit( { attributes, setAttributes, className, focus } ) {
		const { align, src } = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
		const onSelectAudio = ( media ) => {
			if ( media && media.url ) {
				setAttributes( { src: media.url } );
			}
		};
		const controls = (
			focus && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ updateAlignment }
					/>
				</BlockControls>
			)
		);

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
			controls,
			<div key="audio">
				<audio controls="controls" src={ src } />
			</div>,
		];
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	},

	save( { attributes } ) {
		const { align, src } = attributes;
		return (
			<div className={ align ? `align${ align }` : null }>
				<audio controls="controls" src={ src } />
			</div>
		);
	},
} );
