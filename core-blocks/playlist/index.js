/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	FormFileUpload,
	IconButton,
	Placeholder,
	Toolbar,
	MediaElement,
} from '@wordpress/components';
import { pick } from 'lodash';
import { Component, Fragment } from '@wordpress/element';
import {
	editorMediaUpload,
	MediaUpload,
	RichText,
	BlockControls,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';

export const name = 'core/playlist';

export const settings = {
	title: __( 'Playlist' ),

	description: __( 'The Playlist block allows you to embed playlist files and play them back using the mediaElement player component.' ),

	icon: 'format-audio',

	category: 'common',

	attributes: {
		tracks: {
		type: 'array',
		},
		ids: {
			type: 'array',
		},
		src: {
			type: 'string',
			source: 'attribute',
			selector: 'audio',
			attribute: 'src',
		},
		caption: {
			type: 'array',
			source: 'children',
			selector: 'figcaption',
		},
		id: {
			type: 'number',
		},
	},

	supports: {
		align: true,
	},

	edit: class extends Component {
		constructor() {
			super( ...arguments );
			// edit component has its own src in the state so it can be edited
			// without setting the actual value outside of the edit UI
			this.state = {
				editing: ! this.props.attributes.src,
				src: this.props.attributes.src,
			};
		}

		render() {
			const { caption, id, tracks } = this.props.attributes;
			const { setAttributes, isSelected, className} = this.props;
			const { editing, src } = this.state;
			const switchToEditing = () => {
				this.setState( { editing: true } );
			};
			const onSelectAudio = ( media ) => {
				if ( media && media[0].url ) {
					media = ( 1 < media.length ) ? media : [ media ];
					// console.log( media );
					// setAttributes( { ids: media.map( ( item ) => pick( item, 'id' ) ) } );
					setAttributes( { ids: media.map( ( item ) => item.id ) } );
					this.setState( { src: media.url, editing: false } );
				}
			};
			const onSelectUrl = ( event ) => {
				event.preventDefault();
				if ( src ) {
					// set the block's src from the edit component's state, and switch off the editing UI
					setAttributes( { src } );
					this.setState( { editing: false } );
				}
				return false;
			};
			const setAudio = ( [ audio ] ) => onSelectAudio( audio );
			const uploadFromFiles = ( event ) => editorMediaUpload( event.target.files, setAudio, 'audio' );
			const config = {};

			if ( editing ) {
				return (
					<Placeholder
						icon="media-audio"
						label={ __( 'Audio' ) }
						instructions={ __( 'Select an audio file from your library, or upload a new one' ) }
						className={ className }>
						<form onSubmit={ onSelectUrl }>
							<input
								type="url"
								className="components-placeholder__input"
								placeholder={ __( 'Enter URL of audio file here…' ) }
								onChange={ ( event ) => this.setState( { src: event.target.value } ) }
								value={ src || '' } />
							<Button
								isLarge
								type="submit">
								{ __( 'Use URL' ) }
							</Button>
						</form>
						<FormFileUpload
							isLarge
							className="wp-block-audio__upload-button"
							onChange={ uploadFromFiles }
							accept="audio/*"
						>
							{ __( 'Upload' ) }
						</FormFileUpload>
						<MediaUpload
							onSelect={ onSelectAudio }
							type="audio"
							multiple
							playlist
							value={ id }
							render={ ( { open } ) => (
								<Button isLarge onClick={ open }>
									{ __( 'Media Library' ) }
								</Button>
							) }
						/>
					</Placeholder>
				);
			}

			/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
			return (
				<Fragment>
					<BlockControls>
						<Toolbar>
							<IconButton
								className="components-icon-button components-toolbar__control"
								label={ __( 'Edit audio' ) }
								onClick={ switchToEditing }
								icon="edit"
							/>
						</Toolbar>
					</BlockControls>
					<figure className={ className }>
					/* <MediaElement
					 id="player1"
					 mediaType="audio"
					 preload="auto"
					 controls
					 width="640"
					 height="360"
					 poster=""
					 sources={JSON.stringify(tracks)}
					 options={JSON.stringify(config)}
					 tracks={JSON.stringify(tracks)}
					/>
						{ console.log( tracks ) }
						*/
					</figure>
				</Fragment>
			);
			/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		}
	},

	save( { attributes } ) {
/*		const { src, caption, tracks, className } = attributes;
		const config = {};
		// console.log( tracks, config );
		return (
			<figure className={ className }>
			<MediaElement
			 id="player1"
			 mediaType="audio"
			 preload="auto"
			 controls
			 width="640"
			 height="360"
			 poster=""
			 sources={JSON.stringify(tracks)}
			 options={JSON.stringify(config)}
			 tracks={JSON.stringify(tracks)}
			/>

			</figure>
*/
		return null;
	},
};
