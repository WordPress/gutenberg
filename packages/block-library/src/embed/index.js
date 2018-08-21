/**
 * External dependencies
 */
import { parse } from 'url';
import { includes, kebabCase, toLower } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { Component, renderToString } from '@wordpress/element';
import { Button, Placeholder, Spinner, SandBox, IconButton, Toolbar } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { RichText, BlockControls, BlockIcon } from '@wordpress/editor';
import { withSelect } from '@wordpress/data';

// These embeds do not work in sandboxes
const HOSTS_NO_PREVIEWS = [ 'facebook.com' ];

const matchesPatterns = ( url, patterns = [] ) => {
	return patterns.some( ( pattern ) => {
		return url.match( pattern );
	} );
};

const findBlock = ( url ) => {
	for ( const block of [ ...common, ...others ] ) {
		if ( matchesPatterns( url, block.patterns ) ) {
			return block.name;
		}
	}
	return 'core/embed';
};

export function getEmbedEdit( title, icon ) {
	return class extends Component {
		constructor() {
			super( ...arguments );

			this.switchBackToURLInput = this.switchBackToURLInput.bind( this );
			this.setUrl = this.setUrl.bind( this );
			this.maybeSwitchBlock = this.maybeSwitchBlock.bind( this );
			this.setAttributesFromPreview = this.setAttributesFromPreview.bind( this );

			this.state = {
				editingURL: false,
				url: this.props.attributes.url,
			};

			this.maybeSwitchBlock();
		}

		componentWillUnmount() {
			// can't abort the fetch promise, so let it know we will unmount
			this.unmounting = true;
		}

		componentDidUpdate( prevProps ) {
			const hasPreview = undefined !== this.props.preview;
			const hadPreview = undefined !== prevProps.preview;
			// We had a preview, and the URL was edited, and the new URL already has a preview fetched.
			const switchedPreview = this.props.preview && this.props.attributes.url !== prevProps.attributes.url;
			const switchedURL = this.props.attributes.url !== prevProps.attributes.url;

			if ( switchedURL && this.maybeSwitchBlock() ) {
				return;
			}

			if ( ( hasPreview && ! hadPreview ) || switchedPreview ) {
				if ( this.props.previewIsFallback ) {
					this.setState( { editingURL: true } );
					return;
				}
				this.setAttributesFromPreview();
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
		 * Maybe switches to a different embed block type, based on the URL
		 * and the HTML in the preview.
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
			if ( 'core-embed/wordpress' !== this.props.name && 'core/embed' !== matchingBlock ) {
				// At this point, we have discovered a more suitable block for this url, so transform it.
				if ( this.props.name !== matchingBlock ) {
					this.props.onReplace( createBlock( matchingBlock, { url } ) );
					return true;
				}
			}

			if ( preview ) {
				const { html } = preview;

				// This indicates it's a WordPress embed, there aren't a set of URL patterns we can use to match WordPress URLs.
				if ( includes( html, 'class="wp-embedded-content" data-secret' ) ) {
					// If this is not the WordPress embed block, transform it into one.
					if ( this.props.name !== 'core-embed/wordpress' ) {
						this.props.onReplace( createBlock( 'core-embed/wordpress', { url } ) );
						return true;
					}
				}
			}

			return false;
		}

		/***
		 * Sets block attributes based on the preview data.
		 */
		setAttributesFromPreview() {
			const { setAttributes, preview } = this.props;

			// Some plugins only return HTML with no type info, so default this to 'rich'.
			let { type = 'rich' } = preview;
			// If we got a provider name from the API, use it for the slug, otherwise we use the title,
			// because not all embed code gives us a provider name.
			const { html, provider_name: providerName } = preview;
			const providerNameSlug = kebabCase( toLower( '' !== providerName ? providerName : title ) );

			if ( includes( html, 'class="wp-embedded-content" data-secret' ) ) {
				type = 'wp-embed';
			}

			if ( html || 'photo' === type ) {
				setAttributes( { type, providerNameSlug } );
			}
		}

		switchBackToURLInput() {
			this.setState( { editingURL: true } );
		}

		render() {
			const { url, editingURL } = this.state;
			const { caption, type } = this.props.attributes;
			const { fetching, setAttributes, isSelected, className, preview, previewIsFallback } = this.props;
			const controls = (
				<BlockControls>
					<Toolbar>
						{ ( preview && ! previewIsFallback && <IconButton
							className="components-toolbar__control"
							label={ __( 'Edit URL' ) }
							icon="edit"
							onClick={ this.switchBackToURLInput }
						/> ) }
					</Toolbar>
				</BlockControls>
			);

			if ( fetching ) {
				return (
					<div className="wp-block-embed is-loading">
						<Spinner />
						<p>{ __( 'Embedding…' ) }</p>
					</div>
				);
			}

			if ( ! preview || previewIsFallback || editingURL ) {
				// translators: %s: type of embed e.g: "YouTube", "Twitter", etc. "Embed" is used when no specific type exists
				const label = sprintf( __( '%s URL' ), title );

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
							{ previewIsFallback && <p className="components-placeholder__error">{ __( 'Sorry, we could not embed that content.' ) }</p> }
						</form>
					</Placeholder>
				);
			}

			const html = 'photo' === type ? this.getPhotoHtml( preview ) : preview.html;
			const parsedUrl = parse( url );
			const cannotPreview = includes( HOSTS_NO_PREVIEWS, parsedUrl.host.replace( /^www\./, '' ) );
			// translators: %s: host providing embed content e.g: www.youtube.com
			const iframeTitle = sprintf( __( 'Embedded content from %s' ), parsedUrl.host );
			const embedWrapper = 'wp-embed' === type ? (
				<div
					className="wp-block-embed__wrapper"
					dangerouslySetInnerHTML={ { __html: html } }
				/>
			) : (
				<div className="wp-block-embed__wrapper">
					<SandBox
						html={ html }
						title={ iframeTitle }
						type={ type }
					/>
				</div>
			);

			return (
				<figure className={ classnames( className, 'wp-block-embed', { 'is-video': 'video' === type } ) }>
					{ controls }
					{ ( cannotPreview ) ? (
						<Placeholder icon={ icon } label={ __( 'Embed URL' ) }>
							<p className="components-placeholder__error"><a href={ url }>{ url }</a></p>
							<p className="components-placeholder__error">{ __( 'Previews for this are unavailable in the editor, sorry!' ) }</p>
						</Placeholder>
					) : embedWrapper }
					{ ( caption && caption.length > 0 ) || isSelected ? (
						<RichText
							tagName="figcaption"
							placeholder={ __( 'Write caption…' ) }
							value={ caption }
							onChange={ ( value ) => setAttributes( { caption: value } ) }
							inlineToolbar
						/>
					) : null }
				</figure>
			);
		}
	};
}

function getEmbedBlockSettings( { title, description, icon, category = 'embed', transforms, keywords = [] } ) {
	// translators: %s: Name of service (e.g. VideoPress, YouTube)
	const blockDescription = description || sprintf( __( 'Add a block that displays content pulled from other sites, like Twitter, Instagram or YouTube.' ), title );
	return {
		title,
		description: blockDescription,
		icon,
		category,
		keywords,
		attributes: {
			url: {
				type: 'string',
			},
			caption: {
				type: 'array',
				source: 'children',
				selector: 'figcaption',
				default: [],
			},
			type: {
				type: 'string',
			},
			providerNameSlug: {
				type: 'string',
			},
		},

		supports: {
			align: true,
		},

		transforms,

		edit: compose(
			withSelect( ( select, ownProps ) => {
				const { url } = ownProps.attributes;
				const core = select( 'core' );
				const { getEmbedPreview, isPreviewEmbedFallback, isRequestingEmbedPreview } = core;
				const preview = getEmbedPreview( url );
				const previewIsFallback = isPreviewEmbedFallback( url );
				const fetching = undefined !== url && isRequestingEmbedPreview( url );
				return {
					preview,
					previewIsFallback,
					fetching,
				};
			} )
		)( getEmbedEdit( title, icon ) ),

		save( { attributes } ) {
			const { url, caption, type, providerNameSlug } = attributes;

			if ( ! url ) {
				return null;
			}

			const embedClassName = classnames( 'wp-block-embed', {
				[ `is-type-${ type }` ]: type,
				[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
			} );

			return (
				<figure className={ embedClassName }>
					{ `\n${ url }\n` /* URL needs to be on its own line. */ }
					{ caption && caption.length > 0 && <RichText.Content tagName="figcaption" value={ caption } /> }
				</figure>
			);
		},
	};
}

export const name = 'core/embed';
const embedContentIcon = <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0,0h24v24H0V0z" fill="none" /><path d="M19,4H5C3.89,4,3,4.9,3,6v12c0,1.1,0.89,2,2,2h14c1.1,0,2-0.9,2-2V6C21,4.9,20.11,4,19,4z M19,18H5V8h14V18z" /></svg>;
const embedAudioIcon = <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z" /><path d="M21 3H3L1 5v14l2 2h18l2-2V5l-2-2zm0 16H3V5h18v14zM8 15a3 3 0 0 1 4-3V6h5v2h-3v7a3 3 0 0 1-6 0z" /></svg>;
const embedPhotoIcon = <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0,0h24v24H0V0z" fill="none" /><path d="M21,4H3C1.9,4,1,4.9,1,6v12c0,1.1,0.9,2,2,2h18c1.1,0,2-0.9,2-2V6C23,4.9,22.1,4,21,4z M21,18H3V6h18V18z" /><polygon points="14.5 11 11 15.51 8.5 12.5 5 17 19 17" /></svg>;
const embedVideoIcon = <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0,0h24v24H0V0z" fill="none" /><path d="m10 8v8l5-4-5-4zm9-5h-14c-1.1 0-2 0.9-2 2v14c0 1.1 0.9 2 2 2h14c1.1 0 2-0.9 2-2v-14c0-1.1-0.9-2-2-2zm0 16h-14v-14h14v14z" /></svg>;

export const settings = getEmbedBlockSettings( {
	title: __( 'Embed' ),
	description: __( 'The Embed block allows you to easily add videos, images, tweets, audio, and other content to your post or page.' ),
	icon: embedContentIcon,
	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: ( node ) => node.nodeName === 'P' && /^\s*(https?:\/\/\S+)\s*$/i.test( node.textContent ),
				transform: ( node ) => {
					return createBlock( 'core/embed', {
						url: node.textContent.trim(),
					} );
				},
			},
		],
	},
} );

export const common = [
	{
		name: 'core-embed/twitter',
		settings: getEmbedBlockSettings( {
			title: 'Twitter',
			icon: {
				foreground: '#1da1f2',
				src: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M22.23 5.924c-.736.326-1.527.547-2.357.646.847-.508 1.498-1.312 1.804-2.27-.793.47-1.67.812-2.606.996C18.325 4.498 17.258 4 16.078 4c-2.266 0-4.103 1.837-4.103 4.103 0 .322.036.635.106.935-3.41-.17-6.433-1.804-8.457-4.287-.353.607-.556 1.312-.556 2.064 0 1.424.724 2.68 1.825 3.415-.673-.022-1.305-.207-1.86-.514v.052c0 1.988 1.415 3.647 3.293 4.023-.344.095-.707.145-1.08.145-.265 0-.522-.026-.773-.074.522 1.63 2.038 2.817 3.833 2.85-1.404 1.1-3.174 1.757-5.096 1.757-.332 0-.66-.02-.98-.057 1.816 1.164 3.973 1.843 6.29 1.843 7.547 0 11.675-6.252 11.675-11.675 0-.178-.004-.355-.012-.53.802-.578 1.497-1.3 2.047-2.124z"></path></g></svg>,
			},
			keywords: [ 'tweet' ],
		} ),
		patterns: [ /^https?:\/\/(www\.)?twitter\.com\/.+/i ],
	},
	{
		name: 'core-embed/youtube',
		settings: getEmbedBlockSettings( {
			title: 'YouTube',
			icon: {
				foreground: '#ff0000',
				src: <svg viewBox="0 0 24 24"><path d="M21.8 8s-.195-1.377-.795-1.984c-.76-.797-1.613-.8-2.004-.847-2.798-.203-6.996-.203-6.996-.203h-.01s-4.197 0-6.996.202c-.39.046-1.242.05-2.003.846C2.395 6.623 2.2 8 2.2 8S2 9.62 2 11.24v1.517c0 1.618.2 3.237.2 3.237s.195 1.378.795 1.985c.76.797 1.76.77 2.205.855 1.6.153 6.8.2 6.8.2s4.203-.005 7-.208c.392-.047 1.244-.05 2.005-.847.6-.607.795-1.985.795-1.985s.2-1.618.2-3.237v-1.517C22 9.62 21.8 8 21.8 8zM9.935 14.595v-5.62l5.403 2.82-5.403 2.8z" /></svg>,
			},
			keywords: [ __( 'music' ), __( 'video' ) ],
		} ),
		patterns: [ /^https?:\/\/((m|www)\.)?youtube\.com\/.+/i, /^https?:\/\/youtu\.be\/.+/i ],
	},
	{
		name: 'core-embed/facebook',
		settings: getEmbedBlockSettings( {
			title: 'Facebook',
			icon: {
				foreground: '#3b5998',
				src: <svg viewBox="0 0 24 24"><path d="M20 3H4c-.6 0-1 .4-1 1v16c0 .5.4 1 1 1h8.6v-7h-2.3v-2.7h2.3v-2c0-2.3 1.4-3.6 3.5-3.6 1 0 1.8.1 2.1.1v2.4h-1.4c-1.1 0-1.3.5-1.3 1.3v1.7h2.7l-.4 2.8h-2.3v7H20c.5 0 1-.4 1-1V4c0-.6-.4-1-1-1z" /></svg>,
			},
		} ),
		patterns: [ /^https?:\/\/www\.facebook.com\/.+/i ],
	},
	{
		name: 'core-embed/instagram',
		settings: getEmbedBlockSettings( {
			title: 'Instagram',
			icon: <svg viewBox="0 0 24 24"><g><path d="M12 4.622c2.403 0 2.688.01 3.637.052.877.04 1.354.187 1.67.31.42.163.72.358 1.036.673.315.315.51.615.673 1.035.123.317.27.794.31 1.67.043.95.052 1.235.052 3.638s-.01 2.688-.052 3.637c-.04.877-.187 1.354-.31 1.67-.163.42-.358.72-.673 1.036-.315.315-.615.51-1.035.673-.317.123-.794.27-1.67.31-.95.043-1.234.052-3.638.052s-2.688-.01-3.637-.052c-.877-.04-1.354-.187-1.67-.31-.42-.163-.72-.358-1.036-.673-.315-.315-.51-.615-.673-1.035-.123-.317-.27-.794-.31-1.67-.043-.95-.052-1.235-.052-3.638s.01-2.688.052-3.637c.04-.877.187-1.354.31-1.67.163-.42.358-.72.673-1.036.315-.315.615-.51 1.035-.673.317-.123.794-.27 1.67-.31.95-.043 1.235-.052 3.638-.052M12 3c-2.444 0-2.75.01-3.71.054s-1.613.196-2.185.418c-.592.23-1.094.538-1.594 1.04-.5.5-.807 1-1.037 1.593-.223.572-.375 1.226-.42 2.184C3.01 9.25 3 9.555 3 12s.01 2.75.054 3.71.196 1.613.418 2.186c.23.592.538 1.094 1.038 1.594s1.002.808 1.594 1.038c.572.222 1.227.375 2.185.418.96.044 1.266.054 3.71.054s2.75-.01 3.71-.054 1.613-.196 2.186-.418c.592-.23 1.094-.538 1.594-1.038s.808-1.002 1.038-1.594c.222-.572.375-1.227.418-2.185.044-.96.054-1.266.054-3.71s-.01-2.75-.054-3.71-.196-1.613-.418-2.186c-.23-.592-.538-1.094-1.038-1.594s-1.002-.808-1.594-1.038c-.572-.222-1.227-.375-2.185-.418C14.75 3.01 14.445 3 12 3zm0 4.378c-2.552 0-4.622 2.07-4.622 4.622s2.07 4.622 4.622 4.622 4.622-2.07 4.622-4.622S14.552 7.378 12 7.378zM12 15c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3zm4.804-8.884c-.596 0-1.08.484-1.08 1.08s.484 1.08 1.08 1.08c.596 0 1.08-.484 1.08-1.08s-.483-1.08-1.08-1.08z"></path></g></svg>,
			keywords: [ __( 'image' ) ],
		} ),
		patterns: [ /^https?:\/\/(www\.)?instagr(\.am|am\.com)\/.+/i ],
	},
	{
		name: 'core-embed/wordpress',
		settings: getEmbedBlockSettings( {
			title: 'WordPress',
			icon: {
				foreground: '#0073AA',
				src: <svg viewBox="0 0 24 24"><g><path d="M12.158 12.786l-2.698 7.84c.806.236 1.657.365 2.54.365 1.047 0 2.05-.18 2.986-.51-.024-.037-.046-.078-.065-.123l-2.762-7.57zM3.008 12c0 3.56 2.07 6.634 5.068 8.092L3.788 8.342c-.5 1.117-.78 2.354-.78 3.658zm15.06-.454c0-1.112-.398-1.88-.74-2.48-.456-.74-.883-1.368-.883-2.11 0-.825.627-1.595 1.51-1.595.04 0 .078.006.116.008-1.598-1.464-3.73-2.36-6.07-2.36-3.14 0-5.904 1.613-7.512 4.053.21.008.41.012.58.012.94 0 2.395-.114 2.395-.114.484-.028.54.684.057.74 0 0-.487.058-1.03.086l3.275 9.74 1.968-5.902-1.4-3.838c-.485-.028-.944-.085-.944-.085-.486-.03-.43-.77.056-.742 0 0 1.484.114 2.368.114.94 0 2.397-.114 2.397-.114.486-.028.543.684.058.74 0 0-.488.058-1.03.086l3.25 9.665.897-2.997c.456-1.17.684-2.137.684-2.907zm1.82-3.86c.04.286.06.593.06.924 0 .912-.17 1.938-.683 3.22l-2.746 7.94c2.672-1.558 4.47-4.454 4.47-7.77 0-1.564-.4-3.033-1.1-4.314zM12 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"></path></g></svg>,
			},
			keywords: [ __( 'post' ), __( 'blog' ) ],
		} ),
	},
	{
		name: 'core-embed/soundcloud',
		settings: getEmbedBlockSettings( {
			title: 'SoundCloud',
			icon: embedAudioIcon,
			keywords: [ __( 'music' ), __( 'audio' ) ],
		} ),
		patterns: [ /^https?:\/\/(www\.)?soundcloud\.com\/.+/i ],
	},
	{
		name: 'core-embed/spotify',
		settings: getEmbedBlockSettings( {
			title: 'Spotify',
			icon: {
				foreground: '#1db954',
				src: <svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2m4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.47-.077-.334.132-.67.47-.745 3.808-.87 7.076-.496 9.712 1.115.293.18.386.563.206.857M17.81 13.7c-.226.367-.706.482-1.072.257-2.687-1.652-6.785-2.13-9.965-1.166-.413.127-.848-.106-.973-.517-.125-.413.108-.848.52-.973 3.632-1.102 8.147-.568 11.234 1.328.366.226.48.707.256 1.072m.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.493.15-1.016-.13-1.166-.624-.148-.495.13-1.017.625-1.167 3.532-1.073 9.404-.866 13.115 1.337.445.264.59.838.327 1.282-.264.443-.838.59-1.282.325" /></svg>,
			},
			keywords: [ __( 'music' ), __( 'audio' ) ],
		} ),
		patterns: [ /^https?:\/\/(open|play)\.spotify\.com\/.+/i ],
	},
	{
		name: 'core-embed/flickr',
		settings: getEmbedBlockSettings( {
			title: 'Flickr',
			icon: <svg viewBox="0 0 24 24"><path d="m6.5 7c-2.75 0-5 2.25-5 5s2.25 5 5 5 5-2.25 5-5-2.25-5-5-5zm11 0c-2.75 0-5 2.25-5 5s2.25 5 5 5 5-2.25 5-5-2.25-5-5-5z" /></svg>,
			keywords: [ __( 'image' ) ],
		} ),
		patterns: [ /^https?:\/\/(www\.)?flickr\.com\/.+/i, /^https?:\/\/flic\.kr\/.+/i ],
	},
	{
		name: 'core-embed/vimeo',
		settings: getEmbedBlockSettings( {
			title: 'Vimeo',
			icon: {
				foreground: '#1ab7ea',
				src: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M22.396 7.164c-.093 2.026-1.507 4.8-4.245 8.32C15.323 19.16 12.93 21 10.97 21c-1.214 0-2.24-1.12-3.08-3.36-.56-2.052-1.118-4.105-1.68-6.158-.622-2.24-1.29-3.36-2.004-3.36-.156 0-.7.328-1.634.98l-.978-1.26c1.027-.903 2.04-1.806 3.037-2.71C6 3.95 7.03 3.328 7.716 3.265c1.62-.156 2.616.95 2.99 3.32.404 2.558.685 4.148.84 4.77.468 2.12.982 3.18 1.543 3.18.435 0 1.09-.687 1.963-2.064.872-1.376 1.34-2.422 1.402-3.142.125-1.187-.343-1.782-1.4-1.782-.5 0-1.013.115-1.542.34 1.023-3.35 2.977-4.976 5.862-4.883 2.14.063 3.148 1.45 3.024 4.16z"></path></g></svg>,
			},
			keywords: [ __( 'video' ) ],
		} ),
		patterns: [ /^https?:\/\/(www\.)?vimeo\.com\/.+/i ],
	},
];

export const others = [
	{
		name: 'core-embed/animoto',
		settings: getEmbedBlockSettings( {
			title: 'Animoto',
			icon: embedVideoIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?(animoto|video214)\.com\/.+/i ],
	},
	{
		name: 'core-embed/cloudup',
		settings: getEmbedBlockSettings( {
			title: 'Cloudup',
			icon: embedContentIcon,
		} ),
		patterns: [ /^https?:\/\/cloudup\.com\/.+/i ],
	},
	{
		name: 'core-embed/collegehumor',
		settings: getEmbedBlockSettings( {
			title: 'CollegeHumor',
			icon: embedVideoIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?collegehumor\.com\/.+/i ],
	},
	{
		name: 'core-embed/dailymotion',
		settings: getEmbedBlockSettings( {
			title: 'Dailymotion',
			icon: {
				foreground: '#0066DC',
				src: <svg viewBox="0 0 24 24"><path d="M13.723 11.426a2.588 2.588 0 0 0-2.586 2.594c0 1.46 1.125 2.57 2.71 2.57h-.011c1.324 0 2.437-1.09 2.437-2.531 0-1.5-1.113-2.633-2.55-2.633z" /><path d="M2 2v20h20V2H2zm17.246 17.34h-2.98v-1.176c-.918.898-1.856 1.227-3.098 1.227-1.27 0-2.36-.414-3.273-1.239-1.207-1.062-1.832-2.476-1.832-4.113 0-1.5.582-2.848 1.675-3.894.973-.957 2.16-1.442 3.485-1.442 1.27 0 2.242.426 2.941 1.324V5.465l3.078-.637v-.004l.004.004h-.004V19.34h.004z" /></svg>,
			},
		} ),
		patterns: [ /^https?:\/\/(www\.)?dailymotion\.com\/.+/i ],
	},
	{
		name: 'core-embed/funnyordie',
		settings: getEmbedBlockSettings( {
			title: 'Funny or Die',
			icon: embedVideoIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?funnyordie\.com\/.+/i ],
	},
	{
		name: 'core-embed/hulu',
		settings: getEmbedBlockSettings( {
			title: 'Hulu',
			icon: {
				foreground: '#3DBB3D',
				src: <svg viewBox="0 0 24 24"><path d="M14 8.129h-3.004a5.003 5.003 0 0 0-1.723.336V1.977H4.45v20.046h4.836v-7.921a1.337 1.337 0 0 1 1.297-1.418h2.828c.719 0 1.309.578 1.324 1.3v7.993h4.817v-8.692c0-3.676-1.875-5.137-4.918-5.137" /></svg>,
			},
		} ),
		patterns: [ /^https?:\/\/(www\.)?hulu\.com\/.+/i ],
	},
	{
		name: 'core-embed/imgur',
		settings: getEmbedBlockSettings( {
			title: 'Imgur',
			icon: embedPhotoIcon,
		} ),
		patterns: [ /^https?:\/\/(.+\.)?imgur\.com\/.+/i ],
	},
	{
		name: 'core-embed/issuu',
		settings: getEmbedBlockSettings( {
			title: 'Issuu',
			icon: embedContentIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?issuu\.com\/.+/i ],
	},
	{
		name: 'core-embed/kickstarter',
		settings: getEmbedBlockSettings( {
			title: 'Kickstarter',
			icon: {
				foreground: '#2BDE73',
				src: <svg viewBox="0 0 24 24"><path d="M10.004 8.816L13.672 3.5c.691-1 1.586-1.5 2.687-1.5.895 0 1.668.316 2.325.953.652.637.98 1.395.98 2.281 0 .653-.172 1.235-.52 1.735l-3.308 4.804 4.047 5.13c.402.511.605 1.109.605 1.792 0 .903-.316 1.68-.953 2.332a3.12 3.12 0 0 1-2.312.973c-.989 0-1.746-.324-2.266-.965l-4.953-6.183v3.41c0 .972-.168 1.726-.504 2.265C8.883 21.507 7.996 22 6.82 22c-1.066 0-1.894-.363-2.48-1.082-.55-.668-.828-1.547-.828-2.645V5.637c0-1.035.281-1.895.84-2.57C4.934 2.354 5.738 2 6.773 2c.98 0 1.797.355 2.454 1.066.363.399.597.797.691 1.204.059.25.09.714.09 1.398v3.148h-.004z" /></svg>,
			},
		} ),
		patterns: [ /^https?:\/\/(www\.)?kickstarter\.com\/.+/i, /^https?:\/\/kck\.st\/.+/i ],
	},
	{
		name: 'core-embed/meetup-com',
		settings: getEmbedBlockSettings( {
			title: 'Meetup.com',
			icon: {
				foreground: '#ED1C40',
				src: <svg viewBox="0 0 24 24"><path d="M21.98 18.863c-.253-1.61-3.226-.367-3.414-2.129-.257-2.5 3.461-7.882 3.168-9.98-.261-1.879-1.535-2.274-2.64-2.293-1.07-.02-1.352.148-1.715.36-.211.12-.508.363-.926-.032-.277-.266-.465-.45-.754-.684a1.598 1.598 0 0 0-.789-.328c-.394-.062-.914 0-1.242.137-.328.145-.586.39-.855.625-.27.234-.954 1-1.59.715-.282-.121-1.22-.586-1.895-.879-1.305-.563-3.187.352-3.863 1.555-1.012 1.793-3 8.836-3.305 9.761-.672 2.086.86 3.786 2.926 3.688.875-.043 1.457-.356 2.008-1.363.32-.578 3.316-8.407 3.543-8.786.164-.27.703-.628 1.156-.398.46.238.55.727.484 1.184-.113.746-2.222 5.527-2.308 6.062-.137.922.297 1.43 1.254 1.48.656.036 1.308-.199 1.82-1.175.293-.543 3.625-7.223 3.918-7.668.328-.488.586-.649.922-.633.258.016.664.082.562.848-.101.754-2.785 5.648-3.062 6.851-.38 1.606.504 3.227 1.953 3.942.926.453 4.973 1.226 4.644-.86z" /></svg>,
			},
		} ),
		patterns: [ /^https?:\/\/(www\.)?meetu(\.ps|p\.com)\/.+/i ],
	},
	{
		name: 'core-embed/mixcloud',
		settings: getEmbedBlockSettings( {
			title: 'Mixcloud',
			icon: {
				foreground: '#314359',
				src: <svg viewBox="0 0 24 24"><path d="M20.293 17.887a.678.678 0 0 1-.59-.356.662.662 0 0 1 .031-.683c.614-.91.938-1.985.938-3.098a5.54 5.54 0 0 0-.938-3.102.669.669 0 0 1-.101-.5.644.644 0 0 1 .281-.421.64.64 0 0 1 .496-.102.651.651 0 0 1 .426.277A6.9 6.9 0 0 1 22 13.754a6.877 6.877 0 0 1-1.164 3.848.603.603 0 0 1-.535.3l-.008-.015z" /><path d="M18.383 16.809a.695.695 0 0 1-.371-.118.656.656 0 0 1-.18-.914c.41-.593.625-1.3.625-2.023 0-.711-.215-1.414-.625-2.027a.645.645 0 0 1 .18-.91.66.66 0 0 1 .922.187c.554.816.851 1.777.851 2.762 0 1-.293 1.949-.851 2.761a.633.633 0 0 1-.551.301v-.02zm-3.11-5.961a5.273 5.273 0 0 0-5.25-4.75 5.292 5.292 0 0 0-4.996 3.566C3.324 9.918 2 11.391 2 13.168a3.552 3.552 0 0 0 3.55 3.543h9.09a2.972 2.972 0 0 0 2.973-2.965c0-1.422-1-2.605-2.34-2.898zm-.632 4.535H5.55a2.222 2.222 0 0 1-2.223-2.215 2.225 2.225 0 0 1 2.223-2.215c.594 0 1.152.238 1.574.652a.662.662 0 0 0 .938 0 .68.68 0 0 0 0-.937 3.573 3.573 0 0 0-1.637-.926 3.937 3.937 0 0 1 3.586-2.312 3.956 3.956 0 0 1 3.949 3.949c0 .426-.063.836-.2 1.238a.677.677 0 0 0 .094.598c.122.176.32.281.532.289.285 0 .535-.18.625-.45.086-.261.148-.527.187-.8a1.651 1.651 0 0 1 1.051 1.523c0 .91-.73 1.649-1.637 1.653l.028-.047z" /></svg>,
			},
			keywords: [ __( 'music' ), __( 'audio' ) ],
		} ),
		patterns: [ /^https?:\/\/(www\.)?mixcloud\.com\/.+/i ],
	},
	{
		name: 'core-embed/photobucket',
		settings: getEmbedBlockSettings( {
			title: 'Photobucket',
			icon: embedPhotoIcon,
		} ),
		patterns: [ /^http:\/\/g?i*\.photobucket\.com\/.+/i ],
	},
	{
		name: 'core-embed/polldaddy',
		settings: getEmbedBlockSettings( {
			title: 'Polldaddy',
			icon: embedContentIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?mixcloud\.com\/.+/i ],
	},
	{
		name: 'core-embed/reddit',
		settings: getEmbedBlockSettings( {
			title: 'Reddit',
			icon: <svg viewBox="0 0 24 24"><path d="M22 11.816c0-1.256-1.02-2.277-2.277-2.277-.593 0-1.122.24-1.526.613-1.48-.965-3.455-1.594-5.647-1.69l1.17-3.702 3.18.75c.01 1.027.847 1.86 1.877 1.86 1.035 0 1.877-.84 1.877-1.877 0-1.035-.842-1.877-1.877-1.877-.77 0-1.43.466-1.72 1.13L13.55 3.92c-.204-.047-.4.067-.46.26l-1.35 4.27c-2.317.037-4.412.67-5.97 1.67-.402-.355-.917-.58-1.493-.58C3.02 9.54 2 10.56 2 11.815c0 .814.433 1.523 1.078 1.925-.037.222-.06.445-.06.673 0 3.292 4.01 5.97 8.94 5.97s8.94-2.678 8.94-5.97c0-.214-.02-.424-.052-.632.687-.39 1.154-1.12 1.154-1.964zm-3.224-7.422c.606 0 1.1.493 1.1 1.1s-.493 1.1-1.1 1.1-1.1-.494-1.1-1.1.493-1.1 1.1-1.1zm-16 7.422c0-.827.673-1.5 1.5-1.5.313 0 .598.103.838.27-.85.675-1.477 1.478-1.812 2.36-.32-.274-.525-.676-.525-1.13zm9.183 7.79c-4.502 0-8.165-2.33-8.165-5.193S7.457 9.22 11.96 9.22s8.163 2.33 8.163 5.193-3.663 5.193-8.164 5.193zM20.635 13c-.326-.89-.948-1.7-1.797-2.383.247-.186.55-.3.882-.3.827 0 1.5.672 1.5 1.5 0 .482-.23.91-.586 1.184zm-11.64 1.704c-.76 0-1.397-.616-1.397-1.376 0-.76.636-1.397 1.396-1.397.76 0 1.376.638 1.376 1.398 0 .76-.616 1.376-1.376 1.376zm7.405-1.376c0 .76-.615 1.376-1.375 1.376s-1.4-.616-1.4-1.376c0-.76.64-1.397 1.4-1.397.76 0 1.376.638 1.376 1.398zm-1.17 3.38c.15.152.15.398 0 .55-.675.674-1.728 1.002-3.22 1.002l-.01-.002-.012.002c-1.492 0-2.544-.328-3.218-1.002-.152-.152-.152-.398 0-.55.152-.152.4-.15.55 0 .52.52 1.394.775 2.67.775l.01.002.01-.002c1.276 0 2.15-.253 2.67-.775.15-.152.398-.152.55 0z" /></svg>,
		} ),
		patterns: [ /^https?:\/\/(www\.)?reddit\.com\/.+/i ],
	},
	{
		name: 'core-embed/reverbnation',
		settings: getEmbedBlockSettings( {
			title: 'ReverbNation',
			icon: {
				foreground: '#E43526',
				src: <svg viewBox="0 0 24 24"><path d="M22 9.77l-7.621-.024-2.402-7.27-2.356 7.27L2 9.77h.027l6.137 4.464-2.379 7.29h.024l6.218-4.489 6.16 4.488-2.378-7.273L22 9.762" /></svg>,
			},
		} ),
		patterns: [ /^https?:\/\/(www\.)?reverbnation\.com\/.+/i ],
	},
	{
		name: 'core-embed/screencast',
		settings: getEmbedBlockSettings( {
			title: 'Screencast',
			icon: embedVideoIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?screencast\.com\/.+/i ],
	},
	{
		name: 'core-embed/scribd',
		settings: getEmbedBlockSettings( {
			title: 'Scribd',
			icon: {
				foreground: '#1A7BBA',
				src: <svg viewBox="0 0 24 24"><path d="M15.367 19.55c0-1.769 1.309-3.284 2.95-3.59-.079-1.644-.77-2.773-1.848-3.62-1.086-.844-2.602-1.488-4.239-2.13-1.777-.694-3.101-1.308-3.101-2.644 0-1.125.973-1.972 2.613-1.972 1 0 1.645.152 1.977.332 0 .09-.028.18-.074.258a.9.9 0 0 0-.079.41c0 1.129.82 2.129 2.286 2.129 1.332 0 2.128-1 2.128-2.465 0-1.23-.695-2.309-1.824-3.051C15.008 2.461 13.406 2 11.594 2c-1.88.129-3.492.82-4.617 1.848-1.13 1.023-1.797 2.41-1.797 4.05 0 1.825.64 3.004 1.691 3.903 1.05.898 2.567 1.539 4.387 2.183 1.976.637 3.133 1.301 3.133 2.614 0 1.324-1.157 2.125-2.977 2.125-.953 0-1.77-.16-2.465-.637.184-.34.184-.676.184-1 0-.953-.84-2.14-2.305-2.14-1.3 0-2.273 1-2.273 2.464 0 1.227.773 2.387 2.035 3.203C7.828 21.461 9.566 22 11.44 22c1.653 0 3.141-.313 4.293-1.137a3.024 3.024 0 0 1-.324-1.34l-.043.028zm6.082 0c0 .614-.242 1.2-.68 1.634a2.299 2.299 0 0 1-1.636.675 2.281 2.281 0 0 1-2.285-2.309 2.284 2.284 0 0 1 2.273-2.277c1.25 0 2.305 1.028 2.305 2.29l.023-.012z" /></svg>,
			},
		} ),
		patterns: [ /^https?:\/\/(www\.)?scribd\.com\/.+/i ],
	},
	{
		name: 'core-embed/slideshare',
		settings: getEmbedBlockSettings( {
			title: 'Slideshare',
			icon: embedContentIcon,
		} ),
		patterns: [ /^https?:\/\/(.+?\.)?slideshare\.net\/.+/i ],
	},
	{
		name: 'core-embed/smugmug',
		settings: getEmbedBlockSettings( {
			title: 'SmugMug',
			icon: embedPhotoIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?smugmug\.com\/.+/i ],
	},
	{
		name: 'core-embed/speaker',
		settings: getEmbedBlockSettings( {
			title: 'SpeakerDeck',
			icon: {
				foreground: '#009287',
				src: <svg viewBox="0 0 24 24"><path d="M10.354 13.813H5.906a3.906 3.906 0 1 1 0-7.813h5.19a1.562 1.562 0 1 1 0 3.125h-5.27a.781.781 0 1 0 0 1.563h4.448a3.906 3.906 0 0 1 0 7.812H3.563a1.563 1.563 0 0 1 0-3.125h6.791a.781.781 0 0 0 0-1.563zm3.288 4.687a4.696 4.696 0 0 0 1.996-3.125h2.522c.424 0 .768-.35.768-.781V9.906a.775.775 0 0 0-.768-.781h-4.581c.365-.415.587-.962.587-1.563 0-.6-.222-1.147-.587-1.562h5.349C20.624 6 22 7.4 22 9.125v6.25c0 1.726-1.376 3.125-3.072 3.125h-5.286z" /></svg>,
			},
		} ),
		patterns: [ /^https?:\/\/(www\.)?speakerdeck\.com\/.+/i ],
	},
	{
		name: 'core-embed/ted',
		settings: getEmbedBlockSettings( {
			title: 'TED',
			icon: {
				foreground: '#E62B1E',
				src: <svg viewBox="0 0 24 24"><path d="M4.027 10.238H2V8.387h6.273v1.851H6.25v5.375H4.027v-5.375zm4.594-1.851h6.09v1.851h-3.863v.903h3.863v1.718h-3.863v.903h3.863v1.851H8.62V8.387zm8.691 5.375h.872c1.386 0 1.59-1.125 1.59-1.805 0-.453-.149-1.719-1.762-1.719H17.3v3.528l.012-.004zm-2.226-5.375h3.656c2.406 0 3.258 1.781 3.258 3.601 0 2.215-1.176 3.625-3.695 3.625h-3.22V8.387z" /></svg>,
			},
		} ),
		patterns: [ /^https?:\/\/(www\.|embed\.)?ted\.com\/.+/i ],
	},
	{
		name: 'core-embed/tumblr',
		settings: getEmbedBlockSettings( {
			title: 'Tumblr',
			icon: {
				foreground: '#35465c',
				src: <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.105 0-2 .895-2 2v14c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V5c0-1.105-.895-2-2-2zm-5.57 14.265c-2.445.042-3.37-1.742-3.37-2.998V10.6H8.922V9.15c1.703-.615 2.113-2.15 2.21-3.026.006-.06.053-.084.08-.084h1.645V8.9h2.246v1.7H12.85v3.495c.008.476.182 1.13 1.08 1.107.3-.008.698-.094.907-.194l.54 1.6c-.205.297-1.12.642-1.946.657z" /></svg>,
			},
		} ),
		patterns: [ /^https?:\/\/(www\.)?tumblr\.com\/.+/i ],
	},
	{
		name: 'core-embed/videopress',
		settings: getEmbedBlockSettings( {
			title: 'VideoPress',
			icon: embedVideoIcon,
			keywords: [ __( 'video' ) ],
		} ),
		patterns: [ /^https?:\/\/videopress\.com\/.+/i ],
	},
	{
		name: 'core-embed/wordpress-tv',
		settings: getEmbedBlockSettings( {
			title: 'WordPress.tv',
			icon: embedVideoIcon,
		} ),
		patterns: [ /^https?:\/\/wordpress\.tv\/.+/i ],
	},
];
