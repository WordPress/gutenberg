/**
 * External dependencies
 */
import { find, compact, get, initial, last, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createElement, Children } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import { registerBlockType, createBlock } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';

const fromBrDelimitedContent = ( content ) => {
	if ( undefined === content ) {
		// converting an empty block to a list block
		return content;
	}
	const listItems = [];
	listItems.push( createElement( 'li', [], [] ) );
	content.forEach( function( element, elementIndex, elements ) {
		// "split" the incoming content on 'br' elements
		if ( 'br' === element.type && elementIndex < elements.length - 1 ) {
			// if is br and there are more elements to come, push a new list item
			listItems.push( createElement( 'li', [], [] ) );
		} else {
			listItems[ listItems.length - 1 ].props.children.push( element );
		}
	} );
	return listItems;
};

const toBrDelimitedContent = ( values ) => {
	if ( undefined === values ) {
		// converting an empty list
		return values;
	}
	const content = [];
	values.forEach( function( li, liIndex, listItems ) {
		if ( typeof li === 'string' ) {
			content.push( li );
			return;
		}

		Children.toArray( li.props.children ).forEach( function( element, elementIndex, liChildren ) {
			if ( 'ul' === element.type || 'ol' === element.type ) { // lists within lists
				// we know we've just finished processing a list item, so break the text
				content.push( createElement( 'br' ) );
				// push each element from the child list's converted content
				content.push.apply( content, toBrDelimitedContent( Children.toArray( element.props.children ) ) );
				// add a break if there are more list items to come, because the recursive call won't
				// have added it when it finished processing the child list because it thinks the content ended
				if ( liIndex !== listItems.length - 1 ) {
					content.push( createElement( 'br' ) );
				}
			} else {
				content.push( element );
				if ( elementIndex === liChildren.length - 1 && liIndex !== listItems.length - 1 ) {
					// last element in this list item, but not last element overall
					content.push( createElement( 'br' ) );
				}
			}
		} );
	} );
	return content;
};

registerBlockType( 'core/list', {
	title: __( 'List' ),
	description: __( 'List. Numbered or bulleted.' ),
	icon: 'editor-ul',
	category: 'common',
	keywords: [ __( 'bullet list' ), __( 'ordered list' ), __( 'numbered list' ) ],

	attributes: {
		nodeName: {
			type: 'string',
			source: 'property',
			selector: 'ol,ul',
			property: 'nodeName',
			default: 'UL',
		},
		values: {
			type: 'array',
			source: 'children',
			selector: 'ol,ul',
			default: [],
		},
	},

	supports: {
		className: false,
	},

	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: true,
				blocks: [ 'core/paragraph' ],
				transform: ( blockAttributes ) => {
					const items = blockAttributes.map( ( { content } ) => content );
					const hasItems = ! items.every( isEmpty );
					return createBlock( 'core/list', {
						nodeName: 'UL',
						values: hasItems ? items.map( ( content, index ) => <li key={ index }>{ content }</li> ) : [],
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/quote' ],
				transform: ( { value, citation } ) => {
					const items = value.map( p => get( p, 'children.props.children' ) );
					if ( ! isEmpty( citation ) ) {
						items.push( citation );
					}
					const hasItems = ! items.every( isEmpty );
					return createBlock( 'core/list', {
						nodeName: 'UL',
						values: hasItems ? items.map( ( content, index ) => <li key={ index }>{ content }</li> ) : [],
					} );
				},
			},
			{
				type: 'raw',
				isMatch: ( node ) => node.nodeName === 'OL' || node.nodeName === 'UL',
			},
			{
				type: 'pattern',
				regExp: /^[*-]\s/,
				transform: ( { content } ) => {
					return createBlock( 'core/list', {
						nodeName: 'UL',
						values: fromBrDelimitedContent( content ),
					} );
				},
			},
			{
				type: 'pattern',
				regExp: /^1[.)]\s/,
				transform: ( { content } ) => {
					return createBlock( 'core/list', {
						nodeName: 'OL',
						values: fromBrDelimitedContent( content ),
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { values } ) =>
					compact( values.map( ( value ) => get( value, 'props.children', null ) ) )
						.map( ( content ) => createBlock( 'core/paragraph', {
							content: [ content ],
						} ) ),
			},
			{
				type: 'block',
				blocks: [ 'core/quote' ],
				transform: ( { values } ) => {
					return createBlock( 'core/quote', {
						value: compact( ( values.length === 1 ? values : initial( values ) )
							.map( ( value ) => get( value, 'props.children', null ) ) )
							.map( ( children ) => ( { children: <p>{ children }</p> } ) ),
						citation: ( values.length === 1 ? undefined : [ get( last( values ), 'props.children' ) ] ),
					} );
				},
			},
		],
	},

	merge( attributes, attributesToMerge ) {
		const valuesToMerge = attributesToMerge.values || [];

		// Standard text-like block attribute.
		if ( attributesToMerge.content ) {
			valuesToMerge.push( attributesToMerge.content );
		}

		return {
			...attributes,
			values: [
				...attributes.values,
				...valuesToMerge,
			],
		};
	},

	edit: class extends Component {
		constructor() {
			super( ...arguments );

			this.setupEditor = this.setupEditor.bind( this );
			this.getEditorSettings = this.getEditorSettings.bind( this );
			this.setNextValues = this.setNextValues.bind( this );

			this.state = {
				internalListType: null,
			};
		}

		isListActive( listType ) {
			const { internalListType } = this.state;
			const { nodeName } = this.props.attributes;

			return listType === ( internalListType ? internalListType : nodeName );
		}

		findInternalListType( { parents } ) {
			const list = find( parents, ( node ) => node.nodeName === 'UL' || node.nodeName === 'OL' );
			return list ? list.nodeName : null;
		}

		setupEditor( editor ) {
			editor.on( 'nodeChange', ( nodeInfo ) => {
				this.setState( {
					internalListType: this.findInternalListType( nodeInfo ),
				} );
			} );

			// this checks for languages that do not typically have square brackets on their keyboards
			const lang = window.navigator.browserLanguage || window.navigator.language;
			const keyboardHasSqBracket = ! /^(?:fr|nl|sv|ru|de|es|it)/.test( lang );

			if ( keyboardHasSqBracket ) {
				// keycode 219 = '[' and keycode 221 = ']'
				editor.shortcuts.add( 'meta+219', 'Decrease indent', 'Outdent' );
				editor.shortcuts.add( 'meta+221', 'Increase indent', 'Indent' );
			} else {
				editor.shortcuts.add( 'meta+shift+m', 'Decrease indent', 'Outdent' );
				editor.shortcuts.add( 'meta+m', 'Increase indent', 'Indent' );
			}

			this.editor = editor;
		}

		createSetListType( type, command ) {
			return () => {
				const { setAttributes } = this.props;
				const { internalListType } = this.state;
				if ( internalListType ) {
					// only change list types, don't toggle off internal lists
					if ( internalListType !== type && this.editor ) {
						this.editor.execCommand( command );
					}
				} else {
					setAttributes( { nodeName: type } );
				}
			};
		}

		createExecCommand( command ) {
			return () => {
				if ( this.editor ) {
					this.editor.execCommand( command );
				}
			};
		}

		getEditorSettings( settings ) {
			return {
				...settings,
				plugins: ( settings.plugins || [] ).concat( 'lists' ),
				lists_indent_on_tab: false,
			};
		}

		setNextValues( nextValues ) {
			this.props.setAttributes( { values: nextValues } );
		}

		render() {
			const {
				attributes,
				focus,
				setFocus,
				insertBlocksAfter,
				setAttributes,
				mergeBlocks,
				onReplace,
			} = this.props;
			const { nodeName, values } = attributes;

			return [
				focus && (
					<BlockControls
						key="controls"
						controls={ [
							{
								icon: 'editor-ul',
								title: __( 'Convert to unordered list' ),
								isActive: this.isListActive( 'UL' ),
								onClick: this.createSetListType( 'UL', 'InsertUnorderedList' ),
							},
							{
								icon: 'editor-ol',
								title: __( 'Convert to ordered list' ),
								isActive: this.isListActive( 'OL' ),
								onClick: this.createSetListType( 'OL', 'InsertOrderedList' ),
							},
							{
								icon: 'editor-outdent',
								title: __( 'Outdent list item' ),
								onClick: this.createExecCommand( 'Outdent' ),
							},
							{
								icon: 'editor-indent',
								title: __( 'Indent list item' ),
								onClick: this.createExecCommand( 'Indent' ),
							},
						] }
					/>
				),
				<Editable
					multiline="li"
					key="editable"
					tagName={ nodeName.toLowerCase() }
					getSettings={ this.getEditorSettings }
					onSetup={ this.setupEditor }
					onChange={ this.setNextValues }
					value={ values }
					focus={ focus }
					onFocus={ setFocus }
					wrapperClassName="blocks-list"
					placeholder={ __( 'Write list…' ) }
					onMerge={ mergeBlocks }
					onSplit={
						insertBlocksAfter ?
							( before, after, ...blocks ) => {
								if ( ! blocks.length ) {
									blocks.push( createBlock( 'core/paragraph' ) );
								}

								if ( after.length ) {
									blocks.push( createBlock( 'core/list', {
										nodeName,
										values: after,
									} ) );
								}

								setAttributes( { values: before } );
								insertBlocksAfter( blocks );
							} :
							undefined
					}
					onRemove={ () => onReplace( [] ) }
				/>,
			];
		}
	},

	save( { attributes } ) {
		const { nodeName, values } = attributes;

		return createElement(
			nodeName.toLowerCase(),
			null,
			values
		);
	},
} );
