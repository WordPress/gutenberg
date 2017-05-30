/**
 * External dependencies
 */
import { isString } from 'lodash';
import { Fill } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import { Component } from 'element';
import Toolbar from 'components/toolbar';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, createBlock, query } from '../../api';
import Editable from '../../editable';
import FormatToolbar from '../../editable/format-toolbar';

const { children, prop } = query;

registerBlock( 'core/heading', {
	title: wp.i18n.__( 'Heading' ),

	icon: 'heading',

	category: 'common',

	attributes: {
		content: children( 'h1,h2,h3,h4,h5,h6' ),
		nodeName: prop( 'h1,h2,h3,h4,h5,h6', 'nodeName' ),
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { content, ...attrs } ) => {
					if ( Array.isArray( content ) ) {
						const headingContent = isString( content[ 0 ] )
							? content[ 0 ]
							: content[ 0 ].props.children;
						const heading = createBlock( 'core/heading', {
							content: headingContent,
						} );
						const blocks = [ heading ];

						const remainingContent = content.slice( 1 );
						if ( remainingContent.length ) {
							const text = createBlock( 'core/text', {
								...attrs,
								content: remainingContent,
							} );
							blocks.push( text );
						}

						return blocks;
					}
					return createBlock( 'core/heading', {
						content,
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { content } ) => {
					return createBlock( 'core/text', {
						content,
					} );
				},
			},
		],
	},

	merge( attributes, attributesToMerge ) {
		return {
			content: wp.element.concatChildren( attributes.content, attributesToMerge.content ),
		};
	},

	edit: class extends Component {
		constructor() {
			super( ...arguments );
			this.onSetup = this.onSetup.bind( this );
		}

		onSetup( editor ) {
			this.editor = editor;
		}

		render() {
			const { attributes, setAttributes, focus, setFocus, mergeBlocks } = this.props;
			const { content, nodeName = 'H2' } = attributes;

			return [
				focus && (
					<Fill name="Formatting.Toolbar">
						<Toolbar
							controls={
								'123456'.split( '' ).map( ( level ) => ( {
									icon: 'heading',
									title: wp.i18n.sprintf( wp.i18n.__( 'Heading %s' ), level ),
									isActive: 'H' + level === nodeName,
									onClick: () => setAttributes( { nodeName: 'H' + level } ),
									subscript: level,
								} ) )
							}
						/>
						{ this.editor && <FormatToolbar editor={ this.editor } /> }
					</Fill>
				),
				<Editable
					key="editable"
					tagName={ nodeName.toLowerCase() }
					value={ content }
					focus={ focus }
					onFocus={ setFocus }
					onChange={ ( value ) => setAttributes( { content: value } ) }
					onMerge={ mergeBlocks }
					onSetup={ this.onSetup }
					showFormattingToolbar={ false }
					inline
				/>,
			];
		}
	},

	save( { attributes } ) {
		const { nodeName = 'H2', content } = attributes;
		const Tag = nodeName.toLowerCase();

		return (
			<Tag>
				{ content }
			</Tag>
		);
	},
} );
