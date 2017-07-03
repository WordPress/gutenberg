/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { __ } from 'i18n';

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

		if ( prevProps.attributes.content !== content ) {
			window.tinymce.get( id ).setContent( content || '' );
		}
	}

	initialize() {
		const { id } = this.props;
		const {
			plugins,
			external_plugins,
			toolbar1,
			toolbar2,
			toolbar3,
			toolbar4,
		} = window.wpEditorL10n.tinymce.settings;

		wp.oldEditor.initialize( id, {
			tinymce: {
				inline: true,
				content_css: false,
				fixed_toolbar_container: '#' + id + '-toolbar',
				plugins,
				external_plugins,
				toolbar1: toolbar1.join( ',' ),
				toolbar2: toolbar2.join( ',' ),
				toolbar3: toolbar3.join( ',' ),
				toolbar4: toolbar4.join( ',' ),
				setup: this.onSetup,
			},
		} );
	}

	onSetup( editor ) {
		const { attributes: { content }, setAttributes } = this.props;
		const { ref } = this;
		const initialContent = window.switchEditors.wpautop( content || '' );

		editor.on( 'loadContent', () => editor.setContent( initialContent ) );

		editor.on( 'blur', () => {
			setAttributes( {
				content: editor.getContent(),
			} );
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
		editor.on( 'init', () => editor.addCommand( 'WP_More', function( tag ) {
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
		} ) );

		/* eslint-enable */
	}

	render() {
		const { id } = this.props;

		return [
			<div
				key="toolbar"
				id={ id + '-toolbar' }
				ref={ ref => this.ref = ref }
				className="freeform-toolbar"
			/>,
			<div
				key="editor"
				id={ id }
				className="blocks-editable__tinymce"
			/>,
		];
	}
}
