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

const { children } = query;

registerBlockType( 'core/html', {
	title: __( 'Custom HTML' ),

	icon: 'editor-code',

	category: 'formatting',

	className: false,

	attributes: {
		content: children(),
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
