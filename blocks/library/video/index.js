/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Placeholder, Toolbar, Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType } from '../../api';
import MediaUploadButton from '../../media-upload-button';
import Editable from '../../editable';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

registerBlockType( 'core/video', {
	title: __( 'Video' ),

	description: __( 'Video, locally hosted, locally sourced.' ),

	icon: 'format-video',

	category: 'common',

	attributes: {
		align: {
			type: 'string',
		},
		id: {
			type: 'number',
		},
		src: {
			type: 'string',
			source: 'attribute',
			selector: 'video',
			attribute: 'src',
		},
		caption: {
			type: 'array',
			source: 'children',
			selector: 'figcaption',
		},
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, className, focus, setFocus } ) {
		const { src, caption, align, id } = attributes;
		const onSelectVideo = ( media ) => {
			if ( media && media.url ) {
				setAttributes( {
					src: media.url,
					id: media.id,
				} );
			}
		};
		const focusCaption = ( focusValue ) => setFocus( { editable: 'caption', ...focusValue } );
		const updateAlignment = ( nextAlign ) => {
			setAttributes( { align: nextAlign } );
		};

		const controls = focus && [
			<BlockControls key="controls">
				<BlockAlignmentToolbar
					value={ align }
					onChange={ updateAlignment }
				/>

				<Toolbar>
					<MediaUploadButton
						buttonProps={ {
							className: 'components-icon-button components-toolbar__control',
							'aria-label': __( 'Edit video' ),
						} }
						onSelect={ onSelectVideo }
						type="video"
						value={ id }
					>
						<Dashicon icon="edit" />
					</MediaUploadButton>
				</Toolbar>
			</BlockControls>,
		];

		if ( ! src ) {
			return [
				controls,
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
			controls,
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
		const { src, caption, align } = attributes;
		return (

			<figure className={ align ? `align${ align }` : null }>
				{ src && <video controls src={ src } /> }
				{ caption && caption.length > 0 && <figcaption>{ caption }</figcaption> }
			</figure>
		);
	},
} );
