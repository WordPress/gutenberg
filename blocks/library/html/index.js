/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query } from '../../api';
import BlockControls from '../../block-controls';
import InspectorControls from '../../inspector-controls';
import BlockDescription from '../../block-description';

const { html } = query;

registerBlockType( 'core/html', {
	title: __( 'Custom HTML' ),

	icon: 'html',

	category: 'formatting',

	className: false,

	attributes: {
		content: html(),
	},

	edit: class extends Component {
		constructor() {
			super( ...arguments );
			this.preview = this.preview.bind( this );
			this.edit = this.edit.bind( this );
			this.state = {
				preview: false,
			};
			const allowedHtmlTags = new Set( Object.keys( wp.editor.allowedPostHtml ) );
			const unsafeHtmlTags = [ 'script', 'iframe', 'form', 'input', 'style' ];
			this.disallowedHtmlTags = unsafeHtmlTags.filter( tag => ! allowedHtmlTags.has( tag ) );
		}

		preview() {
			this.setState( { preview: true } );
		}

		edit() {
			this.setState( { preview: false } );
		}

		render() {
			const { preview } = this.state;
			const { attributes, setAttributes, focus } = this.props;

			return (
				<div>
					{ focus &&
						<BlockControls key="controls">
							<ul className="components-toolbar">
								<li>
									<button className={ `components-tab-button ${ ! preview ? 'is-active' : '' }` } onClick={ this.edit }>
										<span>HTML</span>
									</button>
								</li>
								<li>
									<button className={ `components-tab-button ${ preview ? 'is-active' : '' }` } onClick={ this.preview }>
										<span>{ __( 'Preview' ) }</span>
									</button>
								</li>
							</ul>
						</BlockControls>
					}
					{ focus &&
						<InspectorControls key="inspector">
							<BlockDescription>
								<p>{ __( 'Arbitrary HTML code.' ) }</p>
								{ ! wp.editor.canUnfilteredHtml && this.disallowedHtmlTags.length > 0 &&
									<p>
										<span>{ __( 'Some HTML tags are not permitted, including:' ) }</span>
										{ ' ' }
										{ this.disallowedHtmlTags.map( ( tag, i ) => <span key={ i }>
											{ 0 !== i && ', ' }
											<code>{ tag }</code>
										</span> ) }
										{ '.' }
									</p>
								}
							</BlockDescription>
						</InspectorControls>
					}
					{ preview
						? <div dangerouslySetInnerHTML={ { __html: attributes.content } } />
						: <TextareaAutosize
							value={ attributes.content }
							onChange={ ( event ) => setAttributes( { content: event.target.value } ) }
						/>
					}
				</div>
			);
		}
	},

	save( { attributes } ) {
		return attributes.content;
	},
} );
