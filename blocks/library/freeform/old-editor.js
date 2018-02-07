/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { keycodes } from '@wordpress/utils';

const { BACKSPACE, DELETE } = keycodes;

function isTmceEmpty( editor ) {
	// When tinyMce is empty the content seems to be:
	// <p><br data-mce-bogus="1"></p>
	// avoid expensive checks for large documents
	const body = editor.getBody();
	if ( body.childNodes.length > 1 ) {
		return false;
	} else if ( body.childNodes.length === 0 ) {
		return true;
	}
	if ( body.childNodes[ 0 ].childNodes.length > 1 ) {
		return false;
	}
	return /^\n?$/.test( body.innerText || body.textContent );
}

export default class OldEditor extends Component {
	constructor( props ) {
		super( props );
		this.initialize = this.initialize.bind( this );
		this.onSetup = this.onSetup.bind( this );
	}

	componentDidMount() {
		const { baseURL, suffix } = window.wpEditorL10n.tinymce;

		window.tinymce.EditorManager.overrideDefaults( {
			base_url: baseURL,
			suffix,
		} );

		if ( document.readyState === 'complete' ) {
			this.initialize();
		} else {
			window.addEventListener( 'DOMContentLoaded', this.initialize );
		}
	}

	componentWillUnmount() {
		window.addEventListener( 'DOMContentLoaded', this.initialize );
		wp.oldEditor.remove( this.props.id );
	}

	componentDidUpdate( prevProps ) {
		const { id, attributes: { content } } = this.props;

		const editor = window.tinymce.get( id );

		if ( prevProps.attributes.content !== content ) {
			editor.setContent( content || '' );
		}
	}

	initialize() {
		const { id } = this.props;
		const { settings } = window.wpEditorL10n.tinymce;

		wp.oldEditor.initialize( id, {
			tinymce: {
				...settings,
				inline: true,
				content_css: false,
				fixed_toolbar_container: '#' + id + '-toolbar',
				setup: this.onSetup,
			},
		} );
	}

	onSetup( editor ) {
		const { attributes: { content }, setAttributes } = this.props;
		const { ref } = this;

		if ( content ) {
			editor.on( 'loadContent', () => editor.setContent( content ) );
		}

		editor.on( 'blur', () => {
			setAttributes( {
				content: editor.getContent(),
			} );
			return false;
		} );

		editor.on( 'keydown', ( event ) => {
			if ( ( event.keyCode === BACKSPACE || event.keyCode === DELETE ) && isTmceEmpty( editor ) ) {
				// delete the block
				this.props.onReplace( [] );
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		} );

		editor.addButton( 'kitchensink', {
			tooltip: __( 'More' ),
			icon: 'dashicon dashicons-editor-kitchensink',
			onClick: function() {
				const button = this;
				const active = ! button.active();

				button.active( active );
				editor.dom.toggleClass( ref, 'has-advanced-toolbar', active );
			},
		} );

		/* eslint-disable */

		// Re-register WP_More as it doesn't work with inline mode.
		// This should be fixed in core.
		// See wp-includes/js/tinymce/plugins/wordpress/plugin.js
		// Swaps node.nodeName === 'BODY' to node === editor.getBody()
		editor.on( 'init', () => {
			editor.addCommand( 'WP_More', function( tag ) {
				var parent, html, title,
					classname = 'wp-more-tag',
					dom = editor.dom,
					node = editor.selection.getNode(),
					rootNode = editor.getBody();

				tag = tag || 'more';
				classname += ' mce-wp-' + tag;
				title = tag === 'more' ? 'Read more...' : 'Next page';
				title = editor.editorManager.i18n.translate( title );
				html = '<img src="' + tinymce.Env.transparentSrc + '" alt="" title="' + title + '" class="' + classname + '" ' +
					'data-wp-more="' + tag + '" data-mce-resize="false" data-mce-placeholder="1" />';

				// Most common case
				if ( node === rootNode || ( node.nodeName === 'P' && node.parentNode == rootNode ) ) {
					editor.insertContent( html );
					return;
				}

				// Get the top level parent node
				parent = dom.getParent( node, function( found ) {
					if ( found.parentNode && found.parentNode === rootNode ) {
						return true;
					}

					return false;
				}, editor.getBody() );

				if ( parent ) {
					if ( parent.nodeName === 'P' ) {
						parent.appendChild( dom.create( 'p', null, html ).firstChild );
					} else {
						dom.insertAfter( dom.create( 'p', null, html ), parent );
					}

					editor.nodeChanged();
				}
			} );
		} );

		/* eslint-enable */
	}

	render() {
		const { isSelected, id, className } = this.props;

		return [
			<div
				key="toolbar"
				id={ id + '-toolbar' }
				ref={ ref => this.ref = ref }
				className="freeform-toolbar"
				style={ ! isSelected ? { display: 'none' } : {} }
			/>,
			<div
				key="editor"
				id={ id }
				className={ classnames( className, 'blocks-rich-text__tinymce' ) }
			/>,
		];
	}
}
