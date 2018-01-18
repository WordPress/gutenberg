/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withState, SandBox, CodeEditor } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import { registerBlockType } from '../../api';
import BlockControls from '../../block-controls';

registerBlockType( 'core/html', {
	title: __( 'Custom HTML' ),

	description: __( 'Add custom HTML code and preview it right here in the editor.' ),

	icon: 'html',

	category: 'formatting',

	keywords: [ __( 'embed' ) ],

	supports: {
		customClassName: false,
		className: false,
		html: false,
	},

	attributes: {
		content: {
			type: 'string',
			source: 'html',
		},
	},

	edit: withState( {
		preview: false,
	} )( ( { attributes, setAttributes, setState, focus, setFocus, preview } ) => (
		<div className="wp-block-html">
			{ focus && (
				<BlockControls>
					<div className="components-toolbar">
						<button
							className={ `components-tab-button ${ ! preview ? 'is-active' : '' }` }
							onClick={ () => setState( { preview: false } ) }
						>
							<span>HTML</span>
						</button>
						<button
							className={ `components-tab-button ${ preview ? 'is-active' : '' }` }
							onClick={ () => setState( { preview: true } ) }
						>
							<span>{ __( 'Preview' ) }</span>
						</button>
					</div>
				</BlockControls>
			) }
			{ preview ? (
				<SandBox html={ attributes.content } />
			) : (
				<CodeEditor
					value={ attributes.content }
					focus={ !! focus }
					onFocus={ setFocus }
					onChange={ content => setAttributes( { content } ) }
				/>
			) }
		</div>
	) ),

	save( { attributes } ) {
		return attributes.content;
	},
} );
