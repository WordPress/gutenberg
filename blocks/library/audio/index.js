/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, IconButton, Placeholder, Toolbar } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';
import MediaUpload from '../../media-upload';
import RichText from '../../rich-text';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

export const name = 'core/audio';

export const settings = {
	title: __( 'Audio' ),

	description: __( 'The Audio block allows you to embed audio files and play them back using a simple player.' ),

	icon: 'format-audio',

	category: 'common',

	attributes: {
		src: {
			type: 'string',
			source: 'attribute',
			selector: 'audio',
			attribute: 'src',
		},
		align: {
			type: 'string',
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

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit: class extends Component {
		constructor( { className } ) {
			super( ...arguments );
			// edit component has its own src in the state so it can be edited
			// without setting the actual value outside of the edit UI
			this.state = {
				editing: ! this.props.attributes.src,
				src: this.props.attributes.src,
				className,
			};
		}
		render() {
			const { align, caption, id } = this.props.attributes;
			const { setAttributes, isSelected } = this.props;
			const { editing, className, src } = this.state;
			const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
			const switchToEditing = () => {
				this.setState( { editing: true } );
			};
			const onSelectAudio = ( media ) => {
				if ( media && media.url ) {
					// sets the block's attribute and updates the edit component from the
					// selected media, then switches off the editing UI
					setAttributes( { src: media.url, id: media.id } );
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
			const controls = isSelected && (
				<BlockControls key="controls">
					<BlockAlignmentToolbar
						value={ align }
						onChange={ updateAlignment }
					/>
					<Toolbar>
						<IconButton
							className="components-icon-button components-toolbar__control"
							label={ __( 'Edit audio' ) }
							onClick={ switchToEditing }
							icon="edit"
						/>
					</Toolbar>
				</BlockControls>
			);

			if ( editing ) {
				return [
					controls,
					<Placeholder
						key="placeholder"
						icon="media-audio"
						label={ __( 'Audio' ) }
						instructions={ __( 'Select an audio file from your library, or upload a new one' ) }
						className={ className }>
						<form onSubmit={ onSelectUrl }>
							<input
								type="url"
								className="components-placeholder__input"
								placeholder={ __( 'Enter URL of audio file here…' ) }
								onChange={ event => this.setState( { src: event.target.value } ) }
								value={ src || '' } />
							<Button
								isLarge
								type="submit">
								{ __( 'Use URL' ) }
							</Button>
						</form>
						<MediaUpload
							onSelect={ onSelectAudio }
							type="audio"
							value={ id }
							render={ ( { open } ) => (
								<Button isLarge onClick={ open }>
									{ __( 'Add from Media Library' ) }
								</Button>
							) }
						/>
					</Placeholder>,
				];
			}

			/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
			return [
				controls,
				<figure key="audio" className={ className }>
					<audio controls="controls" src={ src } />
					{ ( ( caption && caption.length ) || !! isSelected ) && (
						<RichText
							tagName="figcaption"
							placeholder={ __( 'Write caption…' ) }
							value={ caption }
							onChange={ ( value ) => setAttributes( { caption: value } ) }
							isSelected={ isSelected }
							inlineToolbar
						/>
					) }
				</figure>,
			];
			/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		}
	},

	save( { attributes } ) {
		const { align, src, caption } = attributes;
		return (
			<figure className={ align ? `align${ align }` : null }>
				<audio controls="controls" src={ src } />
				{ caption && caption.length > 0 && <figcaption>{ caption }</figcaption> }
			</figure>
		);
	},
};
