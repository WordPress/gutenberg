/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { Toolbar } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { BACKSPACE, DELETE, F10, isKeyboardEvent } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import ConvertToBlocksButton from './convert-to-blocks-button';

const { wp } = window;

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

export default class ClassicEdit extends Component {
	constructor( props ) {
		super( props );
		this.initialize = this.initialize.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.focus = this.focus.bind( this );
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
		wp.oldEditor.remove( `editor-${ this.props.clientId }` );
	}

	componentDidUpdate( prevProps ) {
		const {
			clientId,
			attributes: { content },
		} = this.props;

		const editor = window.tinymce.get( `editor-${ clientId }` );
		const currentContent = editor.getContent();

		if (
			prevProps.attributes.content !== content &&
			currentContent !== content
		) {
			editor.setContent( content || '' );
		}
	}

	initialize() {
		const { clientId } = this.props;
		const { settings } = window.wpEditorL10n.tinymce;
		wp.oldEditor.initialize( `editor-${ clientId }`, {
			tinymce: {
				...settings,
				inline: true,
				content_css: false,
				fixed_toolbar_container: `#toolbar-${ clientId }`,
				setup: this.onSetup,
			},
		} );
	}

	onSetup( editor ) {
		const {
			attributes: { content },
			setAttributes,
		} = this.props;
		const { ref } = this;
		let bookmark;

		this.editor = editor;

		if ( content ) {
			editor.on( 'loadContent', () => editor.setContent( content ) );
		}

		editor.on( 'blur', () => {
			bookmark = editor.selection.getBookmark( 2, true );
			// There is an issue with Chrome and the editor.focus call in core at https://core.trac.wordpress.org/browser/trunk/src/js/_enqueues/lib/link.js#L451.
			// This causes a scroll to the top of editor content on return from some content updating dialogs so tracking
			// scroll position until this is fixed in core.
			const scrollContainer = document.querySelector(
				'.interface-interface-skeleton__content'
			);
			const scrollPosition = scrollContainer.scrollTop;

			setAttributes( {
				content: editor.getContent(),
			} );

			editor.once( 'focus', () => {
				if ( bookmark ) {
					editor.selection.moveToBookmark( bookmark );
					if ( scrollContainer.scrollTop !== scrollPosition ) {
						scrollContainer.scrollTop = scrollPosition;
					}
				}
			} );

			return false;
		} );

		editor.on( 'mousedown touchstart', () => {
			bookmark = null;
		} );

		editor.on( 'Paste Change input Undo Redo', () => {
			const value = editor.getContent();

			if ( value !== editor._lastChange ) {
				editor._lastChange = value;
				setAttributes( {
					content: value,
				} );
			}
		} );

		editor.on( 'keydown', ( event ) => {
			if ( isKeyboardEvent.primary( event, 'z' ) ) {
				// Prevent the gutenberg undo kicking in so TinyMCE undo stack works as expected
				event.stopPropagation();
			}

			if (
				( event.keyCode === BACKSPACE || event.keyCode === DELETE ) &&
				isTmceEmpty( editor )
			) {
				// delete the block
				this.props.onReplace( [] );
				event.preventDefault();
				event.stopImmediatePropagation();
			}

			const { altKey } = event;
			/*
			 * Prevent Mousetrap from kicking in: TinyMCE already uses its own
			 * `alt+f10` shortcut to focus its toolbar.
			 */
			if ( altKey && event.keyCode === F10 ) {
				event.stopPropagation();
			}
		} );

		// TODO: the following is for back-compat with WP 4.9, not needed in WP 5.0. Remove it after the release.
		editor.addButton( 'kitchensink', {
			tooltip: _x( 'More', 'button to expand options' ),
			icon: 'dashicon dashicons-editor-kitchensink',
			onClick() {
				const button = this;
				const active = ! button.active();

				button.active( active );
				editor.dom.toggleClass( ref, 'has-advanced-toolbar', active );
			},
		} );

		// Show the second, third, etc. toolbars when the `kitchensink` button is removed by a plugin.
		editor.on( 'init', () => {
			if (
				editor.settings.toolbar1 &&
				editor.settings.toolbar1.indexOf( 'kitchensink' ) === -1
			) {
				editor.dom.addClass( ref, 'has-advanced-toolbar' );
			}
		} );

		editor.addButton( 'wp_add_media', {
			tooltip: __( 'Insert Media' ),
			icon: 'dashicon dashicons-admin-media',
			cmd: 'WP_Medialib',
		} );
		// End TODO.

		editor.on( 'init', () => {
			const rootNode = this.editor.getBody();

			// Create the toolbar by refocussing the editor.
			if ( document.activeElement === rootNode ) {
				rootNode.blur();
				this.editor.focus();
			}
		} );
	}

	focus() {
		if ( this.editor ) {
			this.editor.focus();
		}
	}

	onToolbarKeyDown( event ) {
		// Prevent WritingFlow from kicking in and allow arrows navigation on the toolbar.
		event.stopPropagation();
		// Prevent Mousetrap from moving focus to the top toolbar when pressing `alt+f10` on this block toolbar.
		event.nativeEvent.stopImmediatePropagation();
	}

	render() {
		const { clientId } = this.props;

		// Disable reasons:
		//
		// jsx-a11y/no-static-element-interactions
		//  - the toolbar itself is non-interactive, but must capture events
		//    from the KeyboardShortcuts component to stop their propagation.

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<>
				<BlockControls>
					<Toolbar>
						<ConvertToBlocksButton clientId={ clientId } />
					</Toolbar>
				</BlockControls>
				<div
					key="toolbar"
					id={ `toolbar-${ clientId }` }
					ref={ ( ref ) => ( this.ref = ref ) }
					className="block-library-classic__toolbar"
					onClick={ this.focus }
					data-placeholder={ __( 'Classic' ) }
					onKeyDown={ this.onToolbarKeyDown }
				/>
				<div
					key="editor"
					id={ `editor-${ clientId }` }
					className="wp-block-freeform block-library-rich-text__tinymce"
				/>
			</>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}
