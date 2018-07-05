/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	IconButton,
	PanelBody,
	Toolbar,
	ToggleControl,
	withNotices,
} from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import {
	BlockControls,
	InspectorControls,
	MediaPlaceholder,
	RichText,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './editor.scss';

class AudioEdit extends Component {
	constructor() {
		super( ...arguments );
		this.onFocusCaption = this.onFocusCaption.bind( this );
		this.onAudioClick = this.onAudioClick.bind( this );
		// edit component has its own src in the state so it can be edited
		// without setting the actual value outside of the edit UI
		this.state = {
			editing: ! this.props.attributes.src,
			captionFocused: false,
		};

		this.toggleAttribute = this.toggleAttribute.bind( this );
	}

	toggleAttribute( attribute ) {
		return ( newValue ) => {
			this.props.setAttributes( { [ attribute ]: newValue } );
		};
	}

	componentWillReceiveProps( { isSelected } ) {
		if ( ! isSelected && this.props.isSelected && this.state.captionFocused ) {
			this.setState( {
				captionFocused: false,
			} );
		}
	}

	onFocusCaption() {
		if ( ! this.state.captionFocused ) {
			this.setState( {
				captionFocused: true,
			} );
		}
	}

	onAudioClick() {
		if ( this.state.captionFocused ) {
			this.setState( {
				captionFocused: false,
			} );
		}
	}

	render() {
		const { autoplay, caption, loop, src } = this.props.attributes;
		const { setAttributes, isSelected, className, noticeOperations, noticeUI } = this.props;
		const { editing } = this.state;
		const switchToEditing = () => {
			this.setState( { editing: true } );
		};
		const onSelectAudio = ( media ) => {
			if ( ! media || ! media.url ) {
				// in this case there was an error and we should continue in the editing state
				// previous attributes should be removed because they may be temporary blob urls
				setAttributes( { src: undefined, id: undefined } );
				switchToEditing();
				return;
			}
			// sets the block's attribute and updates the edit component from the
			// selected media, then switches off the editing UI
			setAttributes( { src: media.url, id: media.id } );
			this.setState( { src: media.url, editing: false } );
		};
		const onSelectUrl = ( newSrc ) => {
			// set the block's src from the edit component's state, and switch off the editing UI
			if ( newSrc !== src ) {
				setAttributes( { src: newSrc, id: undefined } );
			}
			this.setState( { editing: false } );
		};

		if ( editing ) {
			return (
				<MediaPlaceholder
					icon="media-audio"
					labels={ {
						title: __( 'Audio' ),
						name: __( 'an audio' ),
					} }
					className={ className }
					onSelect={ onSelectAudio }
					onSelectUrl={ onSelectUrl }
					accept="audio/*"
					type="audio"
					value={ this.props.attributes }
					notices={ noticeUI }
					onError={ noticeOperations.createErrorNotice }
				/>
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
				<InspectorControls>
					<PanelBody title={ __( 'Playback Controls' ) }>
						<ToggleControl
							label={ __( 'Autoplay' ) }
							onChange={ this.toggleAttribute( 'autoplay' ) }
							checked={ autoplay }
						/>
						<ToggleControl
							label={ __( 'Loop' ) }
							onChange={ this.toggleAttribute( 'loop' ) }
							checked={ loop }
						/>
					</PanelBody>
				</InspectorControls>
				<figure className={ className }>
					<audio controls="controls" src={ src } onClick={ this.onAudioClick } />
					{ ( ( caption && caption.length ) || !! isSelected ) && (
						<RichText
							tagName="figcaption"
							placeholder={ __( 'Write caption…' ) }
							value={ caption }
							onFocus={ this.onFocusCaption }
							onChange={ ( value ) => setAttributes( { caption: value } ) }
							isSelected={ this.state.captionFocused }
							inlineToolbar
						/>
					) }
				</figure>
			</Fragment>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default withNotices( AudioEdit );
