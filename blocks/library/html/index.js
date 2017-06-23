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
	title: __( 'HTML' ),

	icon: 'editor-code',

	category: 'formatting',

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
							<button onClick={ this.edit }>HTML</button>
							<button onClick={ this.preview }>Visual</button>
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
		return <div>{ attributes.content }</div>;
	},
} );
