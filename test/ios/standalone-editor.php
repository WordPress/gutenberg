<?php
/**
 * An admin page with a block editor that is not in an iframe, set up like
 * GutenbergKit's: `admin.php?page=standalone-editor&content=<blocks>`.
 */

add_action(
	'admin_menu',
	function () {
		add_menu_page(
			'Standalone editor',
			'Standalone editor',
			'edit_posts',
			'standalone-editor',
			function () {
				// Over the whole screen, like GutenbergKit's.
				echo '<div id="standalone-editor" style="position: fixed; inset: 0; z-index: 100000; background: #fff;"></div>';
			}
		);
	}
);

add_action(
	'admin_enqueue_scripts',
	function ( $hook_suffix ) {
		if ( 'toplevel_page_standalone-editor' !== $hook_suffix ) {
			return;
		}
		wp_enqueue_style( 'wp-components' );
		wp_enqueue_style( 'wp-block-editor' );
		wp_enqueue_style( 'wp-block-library' );
		wp_register_script(
			'standalone-editor',
			false,
			array( 'wp-block-editor', 'wp-block-library', 'wp-blocks', 'wp-element', 'wp-format-library' ),
			false,
			true
		);
		wp_add_inline_script(
			'standalone-editor',
			<<<'JS'
// TEMPORARY (debugging a flaky test): log the events of a tap to an element
// whose accessibility label the UI test reads and prints.
( () => {
	const sink = document.createElement( 'div' );
	sink.setAttribute( 'role', 'note' );
	sink.style.cssText = 'position: fixed; right: 0; bottom: 0; width: 2px; height: 2px; overflow: hidden; z-index: 100001; pointer-events: none;';
	sink.textContent = '.';
	const lines = [];
	const start = performance.now();
	function describe( node ) {
		if ( ! node ) {
			return '-';
		}
		const element = node.nodeType === 1 ? node : node.parentElement;
		if ( ! element ) {
			return node.nodeName;
		}
		const block = element.closest( '[data-type]' );
		const text = ( element.textContent || '' ).trim().slice( 0, 12 );
		const editable = element.isContentEditable ? 'ce' : '';
		return ( block ? block.dataset.type.replace( 'core/', '' ) : element.tagName.toLowerCase() ) + '[' + text + ']' + editable;
	}
	function state() {
		const selection = document.getSelection();
		const wrapper = document.querySelector( '.editor-styles-wrapper' );
		return 'active=' + describe( document.activeElement ) +
			' anchor=' + ( selection.rangeCount ? describe( selection.anchorNode ) + ':' + selection.anchorOffset : 'none' ) +
			' wrapperCE=' + ( wrapper ? wrapper.contentEditable : '?' );
	}
	window.__iosTestLog = ( type, detail ) => {
		lines.push( Math.round( performance.now() - start ) + 'ms ' + type + ( detail ? ' ' + detail : '' ) + ' ' + state() );
		sink.setAttribute( 'aria-label', 'ioslog: ' + lines.join( ' || ' ) );
	};
	for ( const type of [ 'touchstart', 'touchend', 'pointerdown', 'pointerup', 'pointercancel', 'mousedown', 'mouseup', 'click', 'focusin', 'focusout', 'keydown', 'keyup', 'selectionchange', 'beforeinput', 'input' ] ) {
		document.addEventListener(
			type,
			( event ) => {
				let detail = 'target=' + describe( event.target );
				if ( event.relatedTarget !== undefined ) {
					detail += ' related=' + describe( event.relatedTarget );
				}
				if ( event.data ) {
					detail += ' data=' + event.data;
				}
				window.__iosTestLog( type, type === 'selectionchange' ? '' : detail );
			},
			true
		);
	}
	window.__iosTestLog( 'start' );
	document.body.appendChild( sink );
} )();

const { createElement, createRoot, useState } = wp.element;
const { BlockEditorProvider, BlockList, BlockTools, WritingFlow } =
	wp.blockEditor;

wp.blockLibrary.registerCoreBlocks();

function Editor() {
	const [ blocks, setBlocks ] = useState( () =>
		wp.blocks.parse( new URLSearchParams( location.search ).get( 'content' ) ?? '' )
	);
	return createElement(
		BlockEditorProvider,
		{
			value: blocks,
			onInput: setBlocks,
			onChange: setBlocks,
			// Like GutenbergKit: no block toolbar over the blocks.
			settings: { hasFixedToolbar: true },
		},
		// What `BlockCanvas` renders with `shouldIframe: false`, which
		// only its private version takes.
		createElement(
			BlockTools,
			{ style: { height: '100%', display: 'flex' } },
			createElement(
				WritingFlow,
				{
					className: 'editor-styles-wrapper',
					tabIndex: -1,
					style: { height: '100%', width: '100%', overflow: 'auto' },
				},
				createElement( BlockList )
			)
		)
	);
}

createRoot( document.getElementById( 'standalone-editor' ) ).render(
	createElement( Editor )
);
JS
		);
		wp_enqueue_script( 'standalone-editor' );
	}
);
