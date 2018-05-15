/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withState, SandBox, CodeEditor } from '@wordpress/components';
import { getPhrasingContentSchema } from '@wordpress/blocks';
import { BlockControls } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './editor.scss';

export const name = 'core/html';

export const settings = {
	title: __( 'Custom HTML' ),

	description: __( 'Add your own HTML (and view it right here as you edit!).' ),

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
				isMatch: ( node ) => node.nodeName === 'FIGURE' && !! node.querySelector( 'iframe' ),
				schema: {
					figure: {
						require: [ 'iframe' ],
						children: {
							iframe: {
								attributes: [ 'src', 'allowfullscreen', 'height', 'width' ],
							},
							figcaption: {
								children: getPhrasingContentSchema(),
							},
						},
					},
				},
			},
		],
	},

	edit: withState( {
		preview: false,
	} )( ( { attributes, setAttributes, setState, isSelected, toggleSelection, preview } ) => (
		<div className="wp-block-html">
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
			{ preview ? (
				<SandBox html={ attributes.content } />
			) : (
				<CodeEditor
					value={ attributes.content }
					focus={ isSelected }
					onFocus={ toggleSelection }
					onChange={ ( content ) => setAttributes( { content } ) }
				/>
			) }
		</div>
	) ),

	save( { attributes } ) {
		return <RawHTML>{ attributes.content }</RawHTML>;
	},
};
