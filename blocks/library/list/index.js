/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import { registerBlockType, source, createBlock } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';
import InspectorControls from '../../inspector-controls';
import BlockDescription from '../../block-description';

const { html, prop } = source;

const fromBrDelimitedContent = ( content = '' ) => {
	const decu = document.implementation.createHTMLDocument( '' );
	const accu = document.implementation.createHTMLDocument( '' );

	decu.body.innerHTML = content;
	accu.body.innerHTML = '<li></li>';

	let node;

	while ( ( node = decu.body.firstChild ) ) {
		if ( node.nodeName === 'BR' && node.nextSibling ) {
			accu.body.appendChild( document.createElement( 'LI' ) );
			decu.body.removeChild( node );
		} else {
			accu.body.lastChild.appendChild( node );
		}
	}

	return accu.body.innerHTML;
};

const toBrDelimitedContent = ( values = '' ) => {
	const decu = document.implementation.createHTMLDocument( '' );
	const accu = document.implementation.createHTMLDocument( '' );

	decu.body.innerHTML = `<ul>${ values }</ul>`;

	Array.from( decu.querySelectorAll( 'li' ) ).forEach( ( node, i ) => {
		if ( i !== 0 ) {
			accu.body.appendChild( document.createElement( 'BR' ) );
		}

		while ( node.firstChild ) {
			accu.body.appendChild( node.firstChild );
		}
	} );

	return accu.body.innerHTML;
};

registerBlockType( 'core/list', {
	title: __( 'List' ),
	icon: 'editor-ul',
	category: 'common',
	keywords: [ __( 'bullet list' ), __( 'ordered list' ), __( 'numbered list' ) ],

	attributes: {
		nodeName: {
			type: 'string',
			source: prop( 'ol,ul', 'nodeName' ),
			default: 'UL',
		},
		values: {
			type: 'string',
			source: html( 'ol,ul' ),
			default: '',
		},
	},

	className: false,

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) => {
					return createBlock( 'core/list', {
						nodeName: 'UL',
						values: fromBrDelimitedContent( content ),
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/quote' ],
				transform: ( { value, citation } ) => {
					const values =
						value.map( ( subValue ) => `<li>${ subValue }</li>` )
						+ ( citation ? `<li>${ citation }</li>` : '' );
					return createBlock( 'core/list', {
						nodeName: 'UL',
						values,
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
				transform: ( { values } ) => {
					return createBlock( 'core/paragraph', {
						content: toBrDelimitedContent( values ),
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/quote' ],
				transform: ( { values } ) => {
					return createBlock( 'core/quote', {
						value: [ toBrDelimitedContent( values ) ],
					} );
				},
			},
		],
	},

	merge( attributes, attributesToMerge ) {
		let valuesToMerge = attributesToMerge.values || '';

		// Standard text-like block attribute.
		if ( attributesToMerge.content ) {
			valuesToMerge += attributesToMerge.content;
		}

		return {
			...attributes,
			values: attributes.values + valuesToMerge,
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
				focus && (
					<InspectorControls key="inspector">
						<BlockDescription>
							<p>{ __( 'List. Numbered or bulleted.' ) }</p>
						</BlockDescription>
						<p>{ __( 'No advanced options.' ) }</p>
					</InspectorControls>
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
					wrapperClassname="blocks-list"
					placeholder={ __( 'Write list…' ) }
					onMerge={ mergeBlocks }
					onSplit={ ( before, after, ...blocks ) => {
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
					} }
				/>,
			];
		}
	},

	save( { attributes } ) {
		const { nodeName, values } = attributes;

		return <Editable.Value tagName={ nodeName.toLowerCase() }>{ values }</Editable.Value>;
	},
} );
