/**
 * Internal dependencies
 */
import { createUpgradedEmbedBlock, getClassNames, fallback, getAttributesFromPreview } from './util';
import EmbedControls from './embed-controls';
import EmbedLoading from './embed-loading';
import EmbedPlaceholder from './embed-placeholder';
import EmbedPreview from './embed-preview';

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

export function getEmbedEditComponent( title, icon, responsive = true ) {
	return class extends Component {
		constructor() {
			super( ...arguments );
			this.switchBackToURLInput = this.switchBackToURLInput.bind( this );
			this.setUrl = this.setUrl.bind( this );
			this.getAttributesFromPreview = this.getAttributesFromPreview.bind( this );
			this.setAttributesFromPreview = this.setAttributesFromPreview.bind( this );
			this.getResponsiveHelp = this.getResponsiveHelp.bind( this );
			this.toggleResponsive = this.toggleResponsive.bind( this );
			this.handleIncomingPreview = this.handleIncomingPreview.bind( this );

			this.state = {
				editingURL: false,
				url: this.props.attributes.url,
			};

			if ( this.props.preview ) {
				this.handleIncomingPreview();
			}
		}

		handleIncomingPreview() {
			const { allowResponsive } = this.props.attributes;
			this.setAttributesFromPreview();
			const upgradedBlock = createUpgradedEmbedBlock(
				this.props,
				getAttributesFromPreview( this.props.preview, this.props.attributes.className, responsive, allowResponsive )
			);
			if ( upgradedBlock ) {
				this.props.onReplace( upgradedBlock );
			}
		}

		componentDidUpdate( prevProps ) {
			const hasPreview = undefined !== this.props.preview;
			const hadPreview = undefined !== prevProps.preview;
			const previewChanged = prevProps.preview && this.props.preview && this.props.preview.html !== prevProps.preview.html;
			const switchedPreview = previewChanged || ( hasPreview && ! hadPreview );
			const switchedURL = this.props.attributes.url !== prevProps.attributes.url;

			if ( switchedPreview || switchedURL ) {
				if ( this.props.cannotEmbed ) {
					// We either have a new preview or a new URL, but we can't embed it.
					if ( ! this.props.fetching ) {
						// If we're not fetching the preview, then we know it can't be embedded, so try
						// removing any trailing slash, and resubmit.
						this.resubmitWithoutTrailingSlash();
					}
					return;
				}
				this.handleIncomingPreview();
			}
		}

		resubmitWithoutTrailingSlash() {
			this.setState( ( prevState ) => ( {
				url: prevState.url.replace( /\/$/, '' ),
			} ), this.setUrl );
		}

		setUrl( event ) {
			if ( event ) {
				event.preventDefault();
			}
			const { url } = this.state;
			const { setAttributes } = this.props;
			this.setState( { editingURL: false } );
			setAttributes( { url } );
		}

		getAttributesFromPreview() {
			const { preview } = this.props;
			const { className, allowResponsive } = this.props.attributes;
			return { ...this.props.attributes, ...getAttributesFromPreview( preview, title, className, responsive, allowResponsive ) };
		}

		/***
		 * Sets block attributes based on the preview data.
		 */
		setAttributesFromPreview() {
			const { setAttributes } = this.props;
			setAttributes( this.getAttributesFromPreview() );
		}

		switchBackToURLInput() {
			this.setState( { editingURL: true } );
		}

		getResponsiveHelp( checked ) {
			return checked ? __( 'This embed will preserve its aspect ratio when the browser is resized.' ) : __( 'This embed may not preserve its aspect ratio when the browser is resized.' );
		}

		toggleResponsive() {
			const { allowResponsive, className } = this.props.attributes;
			const { html } = this.props.preview;
			const newAllowResponsive = ! allowResponsive;

			this.props.setAttributes(
				{
					allowResponsive: newAllowResponsive,
					className: getClassNames( html, className, responsive && newAllowResponsive ),
				}
			);
		}

		render() {
			const { url, editingURL } = this.state;
			const { fetching, setAttributes, isSelected, preview, cannotEmbed, themeSupportsResponsive, tryAgain } = this.props;

			if ( fetching ) {
				return (
					<EmbedLoading />
				);
			}

			// translators: %s: type of embed e.g: "YouTube", "Twitter", etc. "Embed" is used when no specific type exists
			const label = sprintf( __( '%s URL' ), title );

			// No preview, or we can't embed the current URL, or we've clicked the edit button.
			if ( ! preview || cannotEmbed || editingURL ) {
				return (
					<EmbedPlaceholder
						icon={ icon }
						label={ label }
						onSubmit={ this.setUrl }
						value={ url }
						cannotEmbed={ cannotEmbed }
						onChange={ ( event ) => this.setState( { url: event.target.value } ) }
						fallback={ () => fallback( url, this.props.onReplace ) }
						tryAgain={ tryAgain }
					/>
				);
			}

			// To render the preview, we must have the attributes determined by the preview.
			// The higher order `withSelect` component supplies the preview, but cannot
			// compute the attributes as it does not have access to the internal state of
			// the edit component. If we wait for `getAttributesFromPreview` to complete
			// when the component updates with a preview, we will render an `EmbedPreview`
			// with incorrect props, and this results in a rendering glitch for responsive
			// embeds. The glitch happens when the content is made responsive by applying
			// the responsive styles, but the underlying iframe does not get new HTML
			// for the sandbox to resize, and so it gets the wrong margins and either
			// gains a lot of unwanted whitespace, or a scrollbar, depending on the size
			// and shape of the content. So, we get the attributes from the preview here,
			// and `getAttributesFromPreview` is memoized in `util` so we're not doing
			// the computation on every render.
			const previewAttributes = this.getAttributesFromPreview();
			const { caption, type, allowResponsive } = previewAttributes;
			const className = classnames( previewAttributes.className, this.props.className );

			return (
				<Fragment>
					<EmbedControls
						showEditButton={ preview && ! cannotEmbed }
						themeSupportsResponsive={ themeSupportsResponsive }
						blockSupportsResponsive={ responsive }
						allowResponsive={ allowResponsive }
						getResponsiveHelp={ this.getResponsiveHelp }
						toggleResponsive={ this.toggleResponsive }
						switchBackToURLInput={ this.switchBackToURLInput }
					/>
					<EmbedPreview
						preview={ preview }
						className={ className }
						url={ url }
						type={ type }
						caption={ caption }
						onCaptionChange={ ( value ) => setAttributes( { caption: value } ) }
						isSelected={ isSelected }
						icon={ icon }
						label={ label }
					/>
				</Fragment>
			);
		}
	};
}
