/**
 * Internal dependencies
 */
import { findBlock, isFromWordPress } from './util';
import { HOSTS_NO_PREVIEWS, ASPECT_RATIOS, DEFAULT_EMBED_BLOCK, WORDPRESS_EMBED_BLOCK } from './constants';
/**
 * External dependencies
 */
import { parse } from 'url';
import { includes, kebabCase, toLower } from 'lodash';
import classnames from 'classnames/dedupe';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component, renderToString, Fragment } from '@wordpress/element';
import {
	Button,
	Placeholder,
	Spinner,
	SandBox,
	IconButton,
	Toolbar,
	PanelBody,
	ToggleControl,
} from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { RichText, BlockControls, BlockIcon, InspectorControls } from '@wordpress/editor';

export function getEmbedEditComponent( title, icon ) {
	return class extends Component {
		constructor() {
			super( ...arguments );
			this.switchBackToURLInput = this.switchBackToURLInput.bind( this );
			this.setUrl = this.setUrl.bind( this );
			this.maybeSwitchBlock = this.maybeSwitchBlock.bind( this );
			this.getAttributesFromPreview = this.getAttributesFromPreview.bind( this );
			this.setAttributesFromPreview = this.setAttributesFromPreview.bind( this );
			this.setAspectRatioClassNames = this.setAspectRatioClassNames.bind( this );
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
			this.setAttributesFromPreview();
			this.maybeSwitchBlock();
		}

		componentDidUpdate( prevProps ) {
			const hasPreview = undefined !== this.props.preview;
			const hadPreview = undefined !== prevProps.preview;
			const switchedPreview = this.props.preview && this.props.attributes.url !== prevProps.attributes.url;
			const switchedURL = this.props.attributes.url !== prevProps.attributes.url;

			if ( ( switchedURL || ( hasPreview && ! hadPreview ) ) && this.maybeSwitchBlock() ) {
				// Dont do anything if we are going to switch to a different block,
				// and we've just changed the URL, or we've just received a preview.
				return;
			}

			if ( ( hasPreview && ! hadPreview ) || switchedPreview ) {
				if ( this.props.cannotEmbed ) {
					// Can't embed this URL, and we've just received or switched the preview.
					this.setState( { editingURL: true } );
					return;
				}
				this.handleIncomingPreview();
			}
		}

		getPhotoHtml( photo ) {
			// 100% width for the preview so it fits nicely into the document, some "thumbnails" are
			// acually the full size photo.
			const photoPreview = <p><img src={ photo.thumbnail_url } alt={ photo.title } width="100%" /></p>;
			return renderToString( photoPreview );
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
		 * Switches to a different embed block type, based on the URL
		 * and the HTML in the preview, if the preview or URL match a different block.
		 *
		 * @return {boolean} Whether the block was switched.
		 */
		maybeSwitchBlock() {
			const { preview } = this.props;
			const { url } = this.props.attributes;

			if ( ! url ) {
				return false;
			}

			const matchingBlock = findBlock( url );

			// WordPress blocks can work on multiple sites, and so don't have patterns,
			// so if we're in a WordPress block, assume the user has chosen it for a WordPress URL.
			if ( WORDPRESS_EMBED_BLOCK !== this.props.name && DEFAULT_EMBED_BLOCK !== matchingBlock ) {
				// At this point, we have discovered a more suitable block for this url, so transform it.
				if ( this.props.name !== matchingBlock ) {
					this.props.onReplace( createBlock( matchingBlock, { url } ) );
					return true;
				}
			}

			if ( preview ) {
				const { html } = preview;

				// We can't match the URL for WordPress embeds, we have to check the HTML instead.
				if ( isFromWordPress( html ) ) {
					// If this is not the WordPress embed block, transform it into one.
					if ( WORDPRESS_EMBED_BLOCK !== this.props.name ) {
						this.props.onReplace(
							createBlock(
								WORDPRESS_EMBED_BLOCK,
								{
									url,
									// By now we have the preview, but when the new block first renders, it
									// won't have had all the attributes set, and so won't get the correct
									// type and it won't render correctly. So, we work out the attributes
									// here so that the initial render works when we switch to the WordPress
									// block. This only affects the WordPress block because it can't be
									// rendered in the usual Sandbox (it has a sandbox of its own) and it
									// relies on the preview to set the correct render type.
									...this.getAttributesFromPreview(
										this.props.preview, this.props.attributes.allowResponsive
									),
								}
							)
						);
						return true;
					}
				}
			}

			return false;
		}

		/**
		 * Gets the appropriate CSS class names to enforce an aspect ratio when the embed is resized
		 * if the HTML has an iframe with width and height set.
		 *
		 * @param {string} html The preview HTML that possibly contains an iframe with width and height set.
		 * @param {boolean} allowResponsive If the classes should be added, or removed.
		 * @return {Object} Object with classnames set for use with `classnames`.
		 */
		getAspectRatioClassNames( html, allowResponsive = true ) {
			const previewDocument = document.implementation.createHTMLDocument( '' );
			previewDocument.body.innerHTML = html;
			const iframe = previewDocument.body.querySelector( 'iframe' );

			if ( iframe && iframe.height && iframe.width ) {
				const aspectRatio = ( iframe.width / iframe.height ).toFixed( 2 );
				// Given the actual aspect ratio, find the widest ratio to support it.
				for ( let ratioIndex = 0; ratioIndex < ASPECT_RATIOS.length; ratioIndex++ ) {
					const potentialRatio = ASPECT_RATIOS[ ratioIndex ];
					if ( aspectRatio >= potentialRatio.ratio ) {
						return {
							[ potentialRatio.className ]: allowResponsive,
							'wp-has-aspect-ratio': allowResponsive,
						};
					}
				}
			}

			return this.props.attributes.className;
		}

		/**
		 * Sets the aspect ratio related class names returned by `getAspectRatioClassNames`
		 * if `allowResponsive` is truthy.
		 *
		 * @param {string} html The preview HTML.
		 */
		setAspectRatioClassNames( html ) {
			const { allowResponsive } = this.props.attributes;
			if ( ! allowResponsive ) {
				return;
			}
			const className = classnames(
				this.props.attributes.className,
				this.getAspectRatioClassNames( html )
			);
			this.props.setAttributes( { className } );
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

			attributes.className = classnames(
				this.props.attributes.className,
				this.getAspectRatioClassNames( html, allowResponsive )
			);

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
			const responsiveClassNames = this.getAspectRatioClassNames( html, ! allowResponsive );

			this.props.setAttributes(
				{
					allowResponsive: ! allowResponsive,
					className: classnames( className, responsiveClassNames ),
				}
			);
		}

		render() {
			const { url, editingURL } = this.state;
			const { caption, type, allowResponsive } = this.props.attributes;
			const { fetching, setAttributes, isSelected, className, preview, cannotEmbed, supportsResponsive } = this.props;
			const controls = (
				<Fragment>
					<BlockControls>
						<Toolbar>
							{ preview && ! cannotEmbed && (
								<IconButton
									className="components-toolbar__control"
									label={ __( 'Edit URL' ) }
									icon="edit"
									onClick={ this.switchBackToURLInput }
								/>
							) }
						</Toolbar>
					</BlockControls>
					{ supportsResponsive && (
						<InspectorControls>
							<PanelBody title={ __( 'Media Settings' ) } className="blocks-responsive">
								<ToggleControl
									label={ __( 'Resize for smaller devices' ) }
									checked={ allowResponsive }
									help={ this.getResponsiveHelp }
									onChange={ this.toggleResponsive }
								/>
							</PanelBody>
						</InspectorControls>
					) }
				</Fragment>
			);

			if ( fetching ) {
				return (
					<div className="wp-block-embed is-loading">
						<Spinner />
						<p>{ __( 'Embedding…' ) }</p>
					</div>
				);
			}

			// translators: %s: type of embed e.g: "YouTube", "Twitter", etc. "Embed" is used when no specific type exists
			const label = sprintf( __( '%s URL' ), title );

			// No preview, or we can't embed the current URL, or we've clicked the edit button.
			if ( ! preview || cannotEmbed || editingURL ) {
				return (
					<Placeholder icon={ <BlockIcon icon={ icon } showColors /> } label={ label } className="wp-block-embed">
						<form onSubmit={ this.setUrl }>
							<input
								type="url"
								value={ url || '' }
								className="components-placeholder__input"
								aria-label={ label }
								placeholder={ __( 'Enter URL to embed here…' ) }
								onChange={ ( event ) => this.setState( { url: event.target.value } ) } />
							<Button
								isLarge
								type="submit">
								{ __( 'Embed' ) }
							</Button>
							{ cannotEmbed && <p className="components-placeholder__error">{ __( 'Sorry, we could not embed that content.' ) }</p> }
						</form>
					</Placeholder>
				);
			}

			const html = 'photo' === type ? this.getPhotoHtml( preview ) : preview.html;
			const { scripts } = preview;
			const parsedUrl = parse( url );
			const cannotPreview = includes( HOSTS_NO_PREVIEWS, parsedUrl.host.replace( /^www\./, '' ) );
			// translators: %s: host providing embed content e.g: www.youtube.com
			const iframeTitle = sprintf( __( 'Embedded content from %s' ), parsedUrl.host );
			const sandboxClassnames = classnames( type, className );
			const embedWrapper = 'wp-embed' === type ? (
				<div
					className="wp-block-embed__wrapper"
					dangerouslySetInnerHTML={ { __html: html } }
				/>
			) : (
				<div className="wp-block-embed__wrapper">
					<SandBox
						html={ html }
						scripts={ scripts }
						title={ iframeTitle }
						type={ sandboxClassnames }
					/>
				</div>
			);

			return (
				<figure className={ classnames( className, 'wp-block-embed', { 'is-type-video': 'video' === type } ) }>
					{ controls }
					{ ( cannotPreview ) ? (
						<Placeholder icon={ <BlockIcon icon={ icon } showColors /> } label={ label }>
							<p className="components-placeholder__error"><a href={ url }>{ url }</a></p>
							<p className="components-placeholder__error">{ __( 'Previews for this are unavailable in the editor, sorry!' ) }</p>
						</Placeholder>
					) : embedWrapper }
					{ ( ! RichText.isEmpty( caption ) || isSelected ) && (
						<RichText
							tagName="figcaption"
							placeholder={ __( 'Write caption…' ) }
							value={ caption }
							onChange={ ( value ) => setAttributes( { caption: value } ) }
							inlineToolbar
						/>
					) }
				</figure>
			);
		}
	};
}
