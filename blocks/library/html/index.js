/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.scss';
import { registerBlockType } from '../../api';
import BlockControls from '../../block-controls';
import InspectorControls from '../../inspector-controls';
import BlockDescription from '../../block-description';

registerBlockType( 'core/html', {
	title: __( 'Custom HTML' ),

	icon: 'html',

	category: 'formatting',

	keywords: [ __( 'embed' ) ],

	supportHTML: false,

	supports: {
		customClassName: false,
		generatedClassName: false,
	},

	attributes: {
		content: {
			type: 'string',
			source: 'html',
		},
	},

	edit: class extends Component {
		constructor() {
			super( ...arguments );
			this.preview = this.preview.bind( this );
			this.edit = this.edit.bind( this );
			this.state = {
				preview: false,
			};
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
					{ preview ?
						<div dangerouslySetInnerHTML={ { __html: attributes.content } } /> :
						<TextareaAutosize
							value={ attributes.content }
							onChange={ ( event ) => setAttributes( { content: event.target.value } ) }
						/>
					}
					{ focus &&
						<InspectorControls key="inspector">
							<BlockDescription>
								<p>{ __( 'Add custom HTML code and preview it right here in the editor.' ) }</p>
							</BlockDescription>
						</InspectorControls>
					}
				</div>
			);
		}
	},

	save( { attributes } ) {
		return attributes.content;
	},
} );
