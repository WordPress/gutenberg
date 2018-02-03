/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId, Dashicon, Spinner, SandBox } from '@wordpress/components';
import { Component, compose } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import BlockControls from '../../block-controls';
import { getCurrentPostId } from '../../../editor/store/selectors';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import './editor.scss';
import PlainText from '../../plain-text';

export class Shortcode extends Component {
	constructor() {
		super();
		this.state = {
			html: '',
			js: '',
			style: '',
			type: '',
			preview: false,
			focus: false,
			fetching: false,
		};
		this.doServerSideRender = this.doServerSideRender.bind( this );
		this.handlePreviewClick = this.handlePreviewClick.bind( this );
	}

	doServerSideRender( event ) {
		//This function sends the shortcode content and post ID to the rest endpoint,
		//and retrieves the filtered shortcode content to be rendered in Preview

		if ( event ) {
			event.preventDefault();
		}

		//Get post ID from redux store
		const postId = this.props.postId;
		let shortcode = this.props.attributes.text;
		shortcode = ( shortcode ) ? shortcode.trim() : '';
		const apiUrl = addQueryArgs( wpApiSettings.root + 'gutenberg/v1/shortcodes', {
			shortcode: shortcode,
			postId: postId,
			_wpnonce: wpApiSettings.nonce,

		} );
		if ( 0 === postId.length || null === postId ) {
			//We don't have a post ID yet
			this.setState( { html: __( 'Something went wrong. Try saving the post and try again' ) } );
			return null;
		}
		if ( 0 === shortcode.length ) {
			this.setState( { html: __( 'Enter something to preview' ) } );
			return null;
		}
		this.setState( { fetching: true } );
		window.fetch( apiUrl, {
			credentials: 'include',
		} ).then( ( response ) => {
			response.json().then( ( { html, type, style, js } ) => {
				html = ( 0 < html.length ) ? html : __( 'Sorry, couldn\'t render a preview' );
				this.setState( { html: html, js: js, style: style, type: type, fetching: false } );
			} );
		} );
	}

	handlePreviewClick() {
		this.setState( { preview: true } );
		this.doServerSideRender();
	}

	render() {
		const { fetching, preview, html, type, js, style } = this.state;
		const { instanceId, setAttributes, attributes, focus, setFocus } = this.props;
		const inputId = `blocks-shortcode-input-${ instanceId }`;

		const controls = focus && (
			<BlockControls key="controls">
				<div className="components-toolbar">
					<button
						className={ `components-tab-button ${ ! preview ? 'is-active' : '' }` }
						onClick={ () => this.setState( { preview: false } ) }>
						<span>{ __( 'Shortcode' ) }</span>
					</button>
					<button
						className={ `components-tab-button ${ preview ? 'is-active' : '' }` }
						onClick={ this.handlePreviewClick }>
						<span>{ __( 'Preview' ) }</span>
					</button>
				</div>
			</BlockControls>
		);
		if ( ! preview ) {
			return [
				controls,
				<div className="wp-block-shortcode" key="placeholder">
					<label htmlFor={ inputId }>
						<Dashicon icon="editor-code" />
						{ __( 'Shortcode' ) }
					</label>
					<PlainText
						id={ inputId }
						value={ attributes.text }
						placeholder={ __( 'Write shortcode here…' ) }
						onChange={ ( text ) => setAttributes( { text } ) }
					/>
				</div>,
			];
		}

		if ( fetching ) {
			return [
				controls,
				<div key="loading" className="wp-block-embed is-loading">
					<Spinner />
					<p>{ __( 'Loading...' ) }</p>
				</div>,
			];
		}

		return [
			controls,
			<figure className="wp-block-embed" key="embed">
				<SandBox
					html={ html }
					title="Preview"
					type={ type }
					js={ js }
					style={ style }
					onFocus={ () => setFocus() }
				/>
			</figure>,
		];
	}
}

export const name = 'core/shortcode';

export const settings = {
	title: __( 'Shortcode' ),

	description: __( 'A shortcode is a WordPress-specific code snippet that is written between square brackets as [shortcode]. ' ),

	icon: 'marker',

	category: 'widgets',

	attributes: {
		text: {
			type: 'string',
			source: 'text',
		},
	},

	transforms: {
		from: [
			{
				type: 'shortcode',
				// Per "Shortcode names should be all lowercase and use all
				// letters, but numbers and underscores should work fine too.
				// Be wary of using hyphens (dashes), you'll be better off not
				// using them." in https://codex.wordpress.org/Shortcode_API
				// Require that the first character be a letter. This notably
				// prevents footnote markings ([1]) from being caught as
				// shortcodes.
				tag: '[a-z][a-z0-9_-]*',
				attributes: {
					text: {
						type: 'string',
						shortcode: ( attrs, { content } ) => {
							return content;
						},
					},
				},
			},
		],
	},

	supports: {

		className: false,

	},

	edit: compose( [
		connect( ( state ) => {
			return {
				postId: getCurrentPostId( state ),
			};
		} ),
		withInstanceId,
	] )( Shortcode ),
	save( { attributes } ) {
		return attributes.text;
	},
};
