/**
 * External dependencies
 */
import { find, compact, get, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	createBlock,
	BlockControls,
	RichText,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './editor.scss';

export const name = 'core/list';

export const settings = {
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
				type: 'raw',
				isMatch: ( node ) => node.nodeName === 'OL' || node.nodeName === 'UL',
			},
			{
				type: 'pattern',
				regExp: /^[*-]\s/,
				transform: ( { content } ) => {
					return createBlock( 'core/list', {
						nodeName: 'UL',
						values: [ <li key="1">{ content }</li> ],
					} );
				},
			},
			{
				type: 'pattern',
				regExp: /^1[.)]\s/,
				transform: ( { content } ) => {
					return createBlock( 'core/list', {
						nodeName: 'OL',
						values: [ <li key="1">{ content }</li> ],
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

		getEditorSettings( editorSettings ) {
			return {
				...editorSettings,
				plugins: ( editorSettings.plugins || [] ).concat( 'lists' ),
				lists_indent_on_tab: false,
			};
		}

		setNextValues( nextValues ) {
			this.props.setAttributes( { values: nextValues } );
		}

		render() {
			const {
				attributes,
				insertBlocksAfter,
				mergeBlocks,
				onReplace,
				className,
			} = this.props;
			const { nodeName, values } = attributes;

			return (
				<Fragment>
					<BlockControls
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
					<RichText
						multiline="li"
						tagName={ nodeName.toLowerCase() }
						getSettings={ this.getEditorSettings }
						onSetup={ this.setupEditor }
						onChange={ this.setNextValues }
						value={ values }
						wrapperClassName="blocks-list"
						className={ className }
						placeholder={ __( 'Write list…' ) }
						onMerge={ mergeBlocks }
						onSplit={
							insertBlocksAfter ?
								( unused, after, ...blocks ) => {
									if ( ! blocks.length ) {
										blocks.push( createBlock( 'core/paragraph' ) );
									}

									if ( after.length ) {
										blocks.push( createBlock( 'core/list', {
											nodeName,
											values: after,
										} ) );
									}

									insertBlocksAfter( blocks );
								} :
								undefined
						}
						onRemove={ () => onReplace( [] ) }
					/>
				</Fragment>
			);
		}
	},

	save( { attributes } ) {
		const { nodeName, values } = attributes;

		return (
			<RichText.Content tagName={ nodeName.toLowerCase() } value={ values } />
		);
	},
};
