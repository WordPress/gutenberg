/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId, Dashicon, Button, Spinner, SandBox } from '@wordpress/components';
import { Component, renderToString } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import BlockControls from '../../block-controls';
import Editable from '../../editable';
import { getCurrentPostId } from '../../../editor/store/selectors';

/**
 * Internal dependencies
 */
import './editor.scss';
import { registerBlockType } from '../../api';

registerBlockType('core/shortcode', {
	title: __('Shortcode'),

	description: __('A shortcode is a WordPress-specific code snippet that is written between square brackets as [shortcode]. '),

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
						shortcode: (attrs, { content }) => {
							return content;
						},
					},
				},
			},
		],
	},

	supports: {

		className: false

	},

	edit: withInstanceId(
		class extends Component {
			constructor() {
				super()
				this.state = {
					html: '',
					preview: false,
					focus: false,
					isFetching: false
				}
				this.doServerSideRender = this.doServerSideRender.bind( this );
				this.handlePreviewClick = this.handlePreviewClick.bind( this )
				this.getUriParameters = this.getUriParameters.bind( this )
				this.convertToJSON = this.convertToJSON.bind( this )
			}

		getUriParameters() {
				//Function to parse the GET params to obtain the post ID
				var paramString = window.location.search.substr( 1 );
				return paramString != null && paramString != "" ? this.convertToJSON( paramString ) : {};
		  }
		  
		  convertToJSON ( paramString ) {
			  var params = {};
			  var paramsArr = paramString.split( "&" );
			  for ( var i = 0; i < paramsArr.length; i++ ) {
				  let tmpArr = paramsArr[i].split( "=" );
				  params[tmpArr[0]] = tmpArr[1];
			  }
			  return params;
		  }
		  
			doServerSideRender( event ) {
				//This function sends the shortcode content and post ID to the rest endpoint, 
				//and retrieves the filtered shortcode content to be rendered in Preview

				//Get post ID from GET params 
				var params = this.getUriParameters();
				if ( 0 === params.length || !( "post" in params ) ) {
					//We don't have a post ID yet
					this.setState( { html: __( 'Something went wrong. Try saving the post and try again' ) } )
					return null
				}
				let shortcode = this.props.attributes.text
				shortcode = ( shortcode ) ? shortcode.trim() : ""
 				if ( 0 === shortcode.length ) {
					this.setState( { html: __( 'Enter something to preview' ) } )
					return null
				}
				this.setState( { isFetching: true } )
				const apiUrl = addQueryArgs( wpApiSettings.root + 'gutenberg/v1/shortcodes', {
					shortcode: shortcode,
					postId : params["post"],
					_wpnonce: wpApiSettings.nonce

				} );
				window.fetch( apiUrl, {
					credentials: 'include',
				} ).then(
					( response ) => {

						response.json().then( ( obj ) => {
							obj = ( 0 < obj.length ) ? obj : __( "Sorry, couldn't render a preview" )
							this.setState( { html: obj, isFetching: false } )

						} )

					}
					);

			}

			handlePreviewClick() {
				this.setState( { preview: true } )
				this.doServerSideRender()
			}

			render() {
				const { instanceId, setAttributes, attributes, focus, setFocus } = this.props
				const inputId = `blocks-shortcode-input-${instanceId}`;
				
				return (
					<div>
						<div>
							{
								focus ?
									<BlockControls key="controls">
										<div className="components-toolbar">
											<button
												className={ `components-tab-button ${ !this.state.preview ? 'is-active' : '' }` }
												onClick={ () => this.setState( { preview: false } ) }>
												<span>Shortcode</span>
											</button>
											<button
												className={ `components-tab-button ${ this.state.preview ? 'is-active' : '' }` }
												onClick={ this.handlePreviewClick }>
												<span>{ __( 'Preview' ) }</span>
											</button>
										</div>
									</BlockControls>

									:
									null
							}
						</div>
						<div>
							{ this.state.preview ?
								this.state.isFetching ?
									<div key="loading" className="wp-block-embed is-loading">
										<Spinner />
										<p>{ __( 'Loading...' ) }</p>
									</div>
									:

									<div>
										<figure className="wp-block-embed" key="embed">
											<SandBox
												html={ this.state.html }
												title="Preview"
												type="video"
												onFocus={ () => setFocus() }
											/> 
										</figure>
									</div>
								:
								<div className="wp-block-shortcode">
									<label htmlFor={ inputId }>
										<Dashicon icon="editor-code" />
										{ __( 'Shortcode' ) }
									</label>
									<TextareaAutosize
										id={ inputId }
										autoComplete="off"
										value={ attributes.text }
										placeholder={ __( 'Write shortcode here…' ) }
										onFocus={ setFocus }
										onChange={ (event) => setAttributes( {
											text: event.target.value,
										} ) }
									/>
								</div>
							}
						</div>

					</div>
				);
			}
		}
	),
	save({ attributes }) {
		return attributes.text;
	},
});