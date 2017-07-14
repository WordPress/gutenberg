/**
 * WordPress dependencies
 */
import { Component, createElement } from 'element';
import { find } from 'lodash';
import { __ } from 'i18n';
import { parse } from 'hpq';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query as matchers, createBlock } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';

const { query, html, prop } = matchers;

const fromBrDelimitedContent = ( content ) => {
	if ( undefined === content ) {
		// converting an empty block to a list block
		return content;
	}

	return content.split( /<br\s*\/?>/ );
};

const toBrDelimitedContent = ( items ) => {
	if ( undefined === items ) {
		// converting an empty list
		return items;
	}

	return items.join( '<br>' );
};

registerBlockType( 'core/list', {
	title: __( 'List' ),
	icon: 'editor-ul',
	category: 'common',

	attributes: {
		nodeName: prop( 'ol,ul', 'nodeName' ),
		items: query( 'li', html() ),
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
						items: fromBrDelimitedContent( content ),
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/quote' ],
				transform: ( { value, citation } ) => {
					const items = fromBrDelimitedContent( value );
					if ( citation ) {
						items.push( `<li>${ citation }</li>` );
					}

					return createBlock( 'core/list', {
						nodeName: 'ul',
						items,
					} );
				},
			},
			{
				type: 'raw',
				matcher: ( node ) => node.nodeName === 'OL' || node.nodeName === 'UL',
				attributes: {
					nodeName: prop( 'ol,ul', 'nodeName' ),
					items: query( 'li', html() ),
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { items } ) => {
					return createBlock( 'core/text', {
						content: toBrDelimitedContent( items ),
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/quote' ],
				transform: ( { items } ) => {
					return createBlock( 'core/quote', {
						value: toBrDelimitedContent( items ),
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
			this.setNextItems = this.setNextItems.bind( this );

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

		setNextItems( nextContent ) {
			const nextItems = parse( nextContent, query( 'li', html() ) );
			this.props.setAttributes( { items: nextItems } );
		}

		render() {
			const { attributes, focus, setFocus } = this.props;
			const { nodeName = 'OL', items = [] } = attributes;
			const value = items.reduce( ( result, item ) => (
				result + `<li>${ item }</li>`
			), '' );

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
					onChange={ this.setNextItems }
					value={ value }
					focus={ focus }
					onFocus={ setFocus }
					className="blocks-list"
					placeholder={ __( 'Write list…' ) }
				/>,
			];
		}
	},

	save( { attributes } ) {
		const { nodeName = 'OL', items = [] } = attributes;
		const value = items.reduce( ( result, item ) => (
			result + `<li>${ item }</li>`
		), '' );

		return createElement(
			nodeName.toLowerCase(),
			null,
			value
		);
	},
} );
