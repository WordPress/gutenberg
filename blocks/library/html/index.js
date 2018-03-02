/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withState, SandBox, CodeEditor } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import BlockControls from '../../block-controls';

export const name = 'core/html';

export const settings = {
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

	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: ( node ) => node.nodeName === 'IFRAME',
			},
		],
	},

	edit: withState( {
		preview: false,
	} )( ( { attributes, setAttributes, setState, isSelected, toggleSelection, preview } ) => (
		<div className="wp-block-html">
			{ isSelected && (
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
					focus={ isSelected }
					onFocus={ toggleSelection }
					onChange={ content => setAttributes( { content } ) }
				/>
			) }
		</div>
	) ),

	save( { attributes } ) {
		return <RawHTML>{ attributes.content }</RawHTML>;
	},
};
