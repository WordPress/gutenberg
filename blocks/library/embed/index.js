/**
 * WordPress dependencies
 */
import { Button, Placeholder, HtmlEmbed, Spinner } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query } from '../../api';
import Editable from '../../editable';

/**
 * External dependencies
 */
import { parse } from 'url';

const { attr, children } = query;

/**
 * Returns an attribute setter with behavior that if the target value is
 * already the assigned attribute value, it will be set to undefined.
 *
 * @param  {string}   align Alignment value
 * @return {Function}       Attribute setter
 */
function toggleAlignment( align ) {
	return ( attributes, setAttributes ) => {
		const nextAlign = attributes.align === align ? undefined : align;
		setAttributes( { align: nextAlign } );
	};
}

registerBlockType( 'core/embed', {
	title: wp.i18n.__( 'Embed' ),

	icon: 'video-alt3',

	category: 'embed',

	attributes: {
		title: attr( 'iframe', 'title' ),
		caption: children( 'figcaption' ),
	},

	controls: [
		{
			icon: 'align-left',
			title: wp.i18n.__( 'Align left' ),
			isActive: ( { align } ) => 'left' === align,
			onClick: toggleAlignment( 'left' ),
		},
		{
			icon: 'align-center',
			title: wp.i18n.__( 'Align center' ),
			isActive: ( { align } ) => ! align || 'center' === align,
			onClick: toggleAlignment( 'center' ),
		},
		{
			icon: 'align-right',
			title: wp.i18n.__( 'Align right' ),
			isActive: ( { align } ) => 'right' === align,
			onClick: toggleAlignment( 'right' ),
		},
		{
			icon: 'align-full-width',
			title: wp.i18n.__( 'Wide width' ),
			isActive: ( { align } ) => 'wide' === align,
			onClick: toggleAlignment( 'wide' ),
		},
	],

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align ) {
			return { 'data-align': align };
		}
	},

	edit: class extends wp.element.Component {
		constructor() {
			super( ...arguments );
			this.doServerSideRender = this.doServerSideRender.bind( this );
			this.isPreviewBlacklisted = this.isPreviewBlacklisted.bind( this );
			this.state = {
				html: '',
				type: '',
				error: false,
				fetching: false,
			};
			this.noPreview = [
				'facebook.com',
			];
		}

		componentWillMount() {
			if ( this.props.attributes.url ) {
				// if the url is already there, we're loading a saved block, so we need to render
				// a different thing, which is why this doesn't use 'fetching', as that
				// is for when the user is putting in a new url on the placeholder form
				this.setState( { fetching: true } );
				this.doServerSideRender();
			}
		}

		componentWillUnmount() {
			// can't abort the fetch promise, so let it know we will unmount
			this.unmounting = true;
		}

		isPreviewBlacklisted( host ) {
			if ( ! host ) {
				return false;
			}
			host = host.replace( 'www.', '' );
			for ( let i = 0; i < this.noPreview.length; i++ ) {
				if ( host === this.noPreview[ i ] ) {
					return true;
				}
			}
			return false;
		}

		doServerSideRender( event ) {
			if ( event ) {
				event.preventDefault();
			}
			const { url } = this.props.attributes;
			const api_url = wpApiSettings.root + 'oembed/1.0/proxy?url=' + encodeURIComponent( url ) + '&_wpnonce=' + wpApiSettings.nonce;

			this.setState( { error: false, fetching: true } );
			fetch( api_url, {
				credentials: 'include',
			} ).then(
				( response ) => {
					if ( this.unmounting ) {
						return;
					}
					response.json().then( ( obj ) => {
						const { html, type } = obj;
						if ( html ) {
							this.setState( { html, type } );
						} else {
							this.setState( { error: true } );
						}
						this.setState( { fetching: false } );
					} );
				}
			);
		}

		render() {
			const { html, type, error, fetching } = this.state;
			const { url, caption } = this.props.attributes;
			const { setAttributes, focus, setFocus } = this.props;

			if ( fetching ) {
				return (
					<div className="blocks-embed__loading">
						<Spinner />
						<p className="blocks-embed__loading-text">{ wp.i18n.__( 'Embedding...' ) }</p>
					</div>
				);
			}

			if ( ! html ) {
				return (
					<Placeholder icon="cloud" label={ wp.i18n.__( 'Embed URL' ) } className="blocks-embed">
						<form onSubmit={ this.doServerSideRender }>
							<input
								type="url"
								value={ url || '' }
								className="components-placeholder__input"
								placeholder={ wp.i18n.__( 'Enter URL to embed here...' ) }
								onChange={ ( event ) => setAttributes( { url: event.target.value } ) } />
							<Button
								isLarge
								type="submit">
								{ wp.i18n.__( 'Embed' ) }
							</Button>
							{ error && <p className="components-placeholder__error">{ wp.i18n.__( 'Sorry, we could not embed that content.' ) }</p> }
						</form>
					</Placeholder>
				);
			}

			const urlBits = parse( url );
			const cannotPreview = this.isPreviewBlacklisted( urlBits.host );
			let typeClassName = 'blocks-embed';

			if ( 'video' === type ) {
				typeClassName = 'blocks-embed-video';
			}

			return (
				<figure className={ typeClassName }>
					{ ( cannotPreview ) ? (
						<Placeholder icon="cloud" label={ wp.i18n.__( 'Embed URL' ) }>
							<p className="components-placeholder__error"><a href={ url }>{ url }</a></p>
							<p className="components-placeholder__error">{ wp.i18n.__( 'Previews for this are unavailable in the editor, sorry!' ) }</p>
						</Placeholder>
					) : (
						<HtmlEmbed html={ html } />
					) }
					{ ( caption && caption.length > 0 ) || !! focus ? (
						<Editable
							tagName="figcaption"
							placeholder={ wp.i18n.__( 'Write caption…' ) }
							value={ caption }
							focus={ focus }
							onFocus={ setFocus }
							onChange={ ( value ) => setAttributes( { caption: value } ) }
							inline
							inlineToolbar
						/>
					) : null }
				</figure>
			);
		}
	},

	save( { attributes } ) {
		const { url, caption } = attributes;
		if ( ! caption || ! caption.length ) {
			return url;
		}

		return (
			<figure>
				{ url }
				<figcaption>{ caption }</figcaption>
			</figure>
		);
	},
} );
