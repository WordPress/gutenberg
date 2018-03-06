/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Placeholder, Toolbar, IconButton, Button, withState } from '@wordpress/components';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';
import { createBlock } from '../../api';
import MediaUpload from '../../media-upload';
import RichText from '../../rich-text';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

const enhance = withState( ( props ) => ( {
	editing: ! props.attributes.src,
	src: props.attributes.src,
	className: props.className,
	hasError: false,
	hasDismissedError: false,
} ) );

export const name = 'core/video';

export const settings = {
	title: __( 'Video' ),

	description: __( 'The Video block allows you to embed video files and play them back using a simple player.' ),

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

	edit: enhance( ( {
		// Provided by `withState`:
		editing,
		src,
		className,
		hasError,
		hasDismissedError,
		setState,
		// Provided by editor:
		...props
	} ) => {
		console.log( 'Rendering' );

		const { align, caption, id } = props.attributes;
		const { setAttributes, isSelected } = props;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
		const switchToEditing = () => {
			setState( { editing: true } );
		};
		const onSelectVideo = ( media ) => {
			if ( media && media.url ) {
				// sets the block's attribute and updates the edit component from the
				// selected media, then switches off the editing UI
				setAttributes( { src: media.url, id: media.id } );
				setState( { src: media.url, editing: false } );
			}
		};
		const onSelectUrl = ( event ) => {
			event.preventDefault();
			if ( src ) {
				// set the block's src from the edit component's state, and switch off the editing UI
				setAttributes( { src } );
				setState( { editing: false } );
			}
			return false;
		};

		const convertToEmbed = () => {
			const { onReplace } = props;
			if ( ! src ) {
				return;
			}
			onReplace( createBlock( 'core/embed', { url: src } ) );
		};

		const tryEmbed = () => {
			if ( ! src ) {
				return;
			}

			const apiURL = addQueryArgs( wpApiSettings.root + 'oembed/1.0/proxy', {
				url: src,
				_wpnonce: wpApiSettings.nonce,
			} );

			console.log( 'tryEmbed; querying' );
			window.fetch( apiURL, { credentials: 'include' } ).then(
				( response ) => {
					response.json().then( ( obj ) => {
						if ( obj.type ) {
							console.log( 'Embed found!' );
							convertToEmbed();
						} else {
							console.log( 'No embed…' );
							setState( { hasError } );
						}
					} );
				}
			);
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
						label={ __( 'Edit video' ) }
						onClick={ switchToEditing }
						icon="edit"
					/>
				</Toolbar>
			</BlockControls>
		);

		if ( hasError && ! hasDismissedError ) {
			return [
				controls,
				<Placeholder
					key="placeholder"
					icon="media-video"
					label={ __( 'Error' ) }
					instructions={ __( 'Fix it?' ) }
					className={ className }>
					<Button
						isLarge
						onClick={ convertToEmbed }>
						{ __( 'Fix it' ) }
					</Button>
					<Button
						isLarge
						onClick={ () => setState( { hasDismissedError: true } ) }>
						{ __( 'Ignore' ) }
					</Button>
				</Placeholder>,
			];
		}

		if ( editing ) {
			return [
				controls,
				<Placeholder
					key="placeholder"
					icon="media-video"
					label={ __( 'Video' ) }
					instructions={ __( 'Select a video file from your library, or upload a new one' ) }
					className={ className }>
					<form onSubmit={ onSelectUrl }>
						<input
							type="url"
							className="components-placeholder__input"
							placeholder={ __( 'Enter URL of video file here…' ) }
							onChange={ event => setState( { src: event.target.value } ) }
							value={ src || '' } />
						<Button
							isLarge
							type="submit">
							{ __( 'Use URL' ) }
						</Button>
					</form>
					<MediaUpload
						onSelect={ onSelectVideo }
						type="video"
						id={ id }
						render={ ( { open } ) => (
							<Button isLarge onClick={ open } >
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
			<figure key="video" className={ className }>
				<video controls src={ src } onError={ tryEmbed } />
				{ ( ( caption && caption.length ) || isSelected ) && (
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
	} ),

	save( { attributes } ) {
		const { src, caption, align } = attributes;
		return (

			<figure className={ align ? `align${ align }` : null }>
				{ src && <video controls src={ src } /> }
				{ caption && caption.length > 0 && <figcaption>{ caption }</figcaption> }
			</figure>
		);
	},
};
