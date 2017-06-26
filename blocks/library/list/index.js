/**
 * WordPress dependencies
 */
import { Component, createElement, Children, concatChildren } from 'element';
import { find } from 'lodash';
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query as hpq, createBlock } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';

const { children, prop } = hpq;

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
	icon: 'editor-ul',
	category: 'common',

	attributes: {
		nodeName: prop( 'ol,ul', 'nodeName' ),
		values: children( 'ol,ul' ),
	},

	className: false,

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { content } ) => {
					return createBlock( 'core/list', {
						nodeName: 'ul',
						values: fromBrDelimitedContent( content ),
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/quote' ],
				transform: ( { value, citation } ) => {
					const listItems = fromBrDelimitedContent( value );
					const values = citation
						? concatChildren( listItems, <li>{ citation }</li> )
						: listItems;
					return createBlock( 'core/list', {
						nodeName: 'ul',
						values,
					} );
				},
			},

		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { values } ) => {
					return createBlock( 'core/text', {
						content: toBrDelimitedContent( values ),
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/quote' ],
				transform: ( { values } ) => {
					return createBlock( 'core/quote', {
						value: toBrDelimitedContent( values ),
					} );
				},
			},
		],
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
			const { nodeName = 'OL' } = this.props.attributes;

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
			const { attributes, focus, setFocus } = this.props;
			const { nodeName = 'OL', values = [] } = attributes;

			return [
				focus && (
					<BlockControls
						key="controls"
						controls={ [
							{
								icon: 'editor-ul',
								title: __( 'Convert to unordered' ),
								isActive: this.isListActive( 'UL' ),
								onClick: this.createSetListType( 'UL', 'InsertUnorderedList' ),
							},
							{
								icon: 'editor-ol',
								title: __( 'Convert to ordered' ),
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
					key="editable"
					tagName={ nodeName.toLowerCase() }
					getSettings={ this.getEditorSettings }
					onSetup={ this.setupEditor }
					onChange={ this.setNextValues }
					value={ values }
					focus={ focus }
					onFocus={ setFocus }
					className="blocks-list"
				/>,
			];
		}
	},

	save( { attributes } ) {
		const { nodeName = 'OL', values = [] } = attributes;

		return createElement(
			nodeName.toLowerCase(),
			null,
			values
		);
	},
} );
