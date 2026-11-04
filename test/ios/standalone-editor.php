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
