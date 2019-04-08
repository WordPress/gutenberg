/**
 * Internal dependencies
 */
import { isFromWordPress, createUpgradedEmbedBlock, getClassNames, fallback } from './util';
import EmbedControls from './embed-controls';
import EmbedLoading from './embed-loading';
import EmbedPlaceholder from './embed-placeholder';
import EmbedPreview from './embed-preview';

/**
 * External dependencies
 */
import { kebabCase, toLower } from 'lodash';

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
				this.getAttributesFromPreview( this.props.preview, allowResponsive )
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

		/***
		 * Gets block attributes based on the preview and responsive state.
		 *
		 * @param {string} preview The preview data.
		 * @param {boolean} allowResponsive Apply responsive classes to fixed size content.
		 * @return {Object} Attributes and values.
		 */
		getAttributesFromPreview( preview, allowResponsive = true ) {
			const attributes = {};
			// Some plugins only return HTML with no type info, so default this to 'rich'.
			let { type = 'rich' } = preview;
			// If we got a provider name from the API, use it for the slug, otherwise we use the title,
			// because not all embed code gives us a provider name.
			const { html, provider_name: providerName } = preview;
			const providerNameSlug = kebabCase( toLower( '' !== providerName ? providerName : title ) );

			if ( isFromWordPress( html ) ) {
				type = 'wp-embed';
			}

			if ( html || 'photo' === type ) {
				attributes.type = type;
				attributes.providerNameSlug = providerNameSlug;
			}

			attributes.className = getClassNames( html, this.props.attributes.className, responsive && allowResponsive );

			return attributes;
		}

		/***
		 * Sets block attributes based on the preview data.
		 */
		setAttributesFromPreview() {
			const { setAttributes, preview } = this.props;
			const { allowResponsive } = this.props.attributes;
			setAttributes( this.getAttributesFromPreview( preview, allowResponsive ) );
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
			const { caption, type, allowResponsive } = this.props.attributes;
			const { fetching, setAttributes, isSelected, className, preview, cannotEmbed, themeSupportsResponsive, tryAgain } = this.props;

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
