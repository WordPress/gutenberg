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
import { Component } from '@wordpress/element';

export function getEmbedEditComponent( title, icon, responsive = true ) {
	return class extends Component {
		constructor() {
			super( ...arguments );
			this.switchBackToURLInput = this.switchBackToURLInput.bind( this );
			this.setUrl = this.setUrl.bind( this );
			this.getMergedAttributes = this.getMergedAttributes.bind( this );
			this.setMergedAttributes = this.setMergedAttributes.bind( this );
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
			this.setMergedAttributes();
			if ( this.props.onReplace ) {
				const upgradedBlock = createUpgradedEmbedBlock(
					this.props,
					this.getMergedAttributes()
				);
				if ( upgradedBlock ) {
					this.props.onReplace( upgradedBlock );
				}
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
		 * @return {Object} Attributes derived from the preview, merged with the current attributes.
		 */
		getMergedAttributes() {
			const { preview } = this.props;
			const { className, allowResponsive } = this.props.attributes;
			return { ...this.props.attributes, ...getAttributesFromPreview( preview, title, className, responsive, allowResponsive ) };
		}

		/***
		 * Sets block attributes based on the current attributes and preview data.
		 */
		setMergedAttributes() {
			const { setAttributes } = this.props;
			setAttributes( this.getMergedAttributes() );
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

			// Even though we set attributes that get derived from the preview,
			// we don't access them directly because for the initial render,
			// the `setAttributes` call will not have taken effect. If we're
			// rendering responsive content, setting the responsive classes
			// after the preview has been rendered can result in unwanted
			// clipping or scrollbars. The `getAttributesFromPreview` function
			// that `getMergedAttributes` uses is memoized so that we're not
			// calculating them on every render.
			const previewAttributes = this.getMergedAttributes();
			const { caption, type, allowResponsive } = previewAttributes;
			const className = classnames( previewAttributes.className, this.props.className );

			return (
				<>
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
				</>
			);
		}
	};
}
