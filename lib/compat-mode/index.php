<?php
/**
 * Compat mode for blocks that need isolation from the main editor iframe.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Intercepts the compat mode editor request and renders the page.
 */
function gutenberg_handle_compat_mode_request() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Nonce verified below.
	if ( ! isset( $_GET['gutenberg-compat-mode'] ) ) {
		return;
	}

	// Verify user has permission.
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( esc_html__( 'You do not have permission to access this page.', 'gutenberg' ) );
	}

	// Verify nonce.
	if ( ! isset( $_GET['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ), 'gutenberg_compat_mode' ) ) {
		wp_die( esc_html__( 'Security check failed.', 'gutenberg' ) );
	}

	// Get the block name.
	$block_name = isset( $_GET['block_name'] ) ? sanitize_text_field( wp_unslash( $_GET['block_name'] ) ) : '';
	if ( empty( $block_name ) ) {
		wp_die( esc_html__( 'Block name is required.', 'gutenberg' ) );
	}

	// Verify the block type exists.
	$block_registry = WP_Block_Type_Registry::get_instance();
	$block_type     = $block_registry->get_registered( $block_name );
	if ( ! $block_type ) {
		wp_die( esc_html__( 'Block type not found.', 'gutenberg' ) );
	}

	// Set up required globals for admin-header.php.
	global $title, $hook_suffix, $current_screen, $pagenow;
	$title       = __( 'Block Compat Mode Editor', 'gutenberg' );
	$hook_suffix = 'gutenberg-compat-mode';
	$pagenow     = 'admin.php';

	// Set up screen.
	set_current_screen( 'gutenberg-compat-mode' );
	$current_screen = get_current_screen();
	if ( $current_screen ) {
		$current_screen->is_block_editor( true );
	}

	// Disable emoji - same as core block editor.
	remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );

	// Enqueue assets.
	gutenberg_enqueue_compat_mode_assets();

	// Get editor settings.
	$editor_settings = get_block_editor_settings(
		array(),
		new WP_Block_Editor_Context( array( 'name' => 'core/compat-mode' ) )
	);

	// Mark that we're inside the compat mode editor to prevent recursive iframe rendering.
	$editor_settings['isCompatModeEditor'] = true;

	// Add initialization script.
	$init_script = sprintf(
		'window.compatModeConfig = { blockName: %s, editorSettings: %s };',
		wp_json_encode( $block_name ),
		wp_json_encode( $editor_settings )
	);
	wp_add_inline_script( 'wp-blocks', $init_script, 'before' );

	// Include admin header.
	require_once ABSPATH . 'wp-admin/admin-header.php';

	// Render the editor container.
	?>
	<style>
		html, body, #wpwrap, #wpcontent, #wpbody, #wpbody-content {
			height: 100%;
			margin: 0;
			padding: 0;
			overflow: hidden;
		}
		#wpadminbar, #adminmenumain, #wpfooter, .notice, .update-nag {
			display: none !important;
		}
		#wpcontent {
			margin-left: 0 !important;
		}
		#wpbody-content {
			padding-bottom: 0;
			float: none;
		}
		#compat-mode-editor {
			width: 100%;
			height: 100%;
		}
		.compat-mode-block-wrapper {
			width: 100%;
		}
	</style>

	<div id="compat-mode-editor"></div>

	<script>
	( function() {
		const config = window.compatModeConfig;
		const parentOrigin = window.location.origin;

		console.log( '[Compat Mode] Script starting, config:', config );

		wp.domReady( function() {
			console.log( '[Compat Mode] DOM ready' );

			// Send COMPAT_READY multiple times to handle race conditions where the
			// parent's listener might not be set up yet when the iframe loads quickly.
			function sendReadyWithRetry( attempts ) {
				console.log( '[Compat Mode] Sending COMPAT_READY (attempt ' + ( 4 - attempts ) + ')' );
				window.parent.postMessage( { type: 'COMPAT_READY' }, parentOrigin );
				if ( attempts > 1 ) {
					setTimeout( function() { sendReadyWithRetry( attempts - 1 ); }, 100 );
				}
			}
			sendReadyWithRetry( 3 ); // Send 3 times: immediately, +100ms, +200ms

			try {
				console.log( '[Compat Mode] wp object:', {
					element: typeof wp.element,
					blocks: typeof wp.blocks,
					blockLibrary: typeof wp.blockLibrary
				} );

				const { createElement, createRoot, useState, useEffect, useCallback, useRef } = wp.element;
				const { getBlockType, getBlockTypes } = wp.blocks;

				// Register core blocks.
				if ( wp.blockLibrary && wp.blockLibrary.registerCoreBlocks ) {
					console.log( '[Compat Mode] Registering core blocks...' );
					wp.blockLibrary.registerCoreBlocks();
				}

				const allBlocks = getBlockTypes();
				console.log( '[Compat Mode] All registered blocks (' + allBlocks.length + '):', allBlocks.map( b => b.name ) );

				function waitForBlock( blockName, maxAttempts, attempt ) {
					attempt = attempt || 1;
					const blockType = getBlockType( blockName );

					console.log( '[Compat Mode] Attempt ' + attempt + '/' + maxAttempts + ' looking for: ' + blockName, blockType ? 'FOUND' : 'not found' );

					if ( blockType ) {
						console.log( '[Compat Mode] Block found:', {
							name: blockType.name,
							title: blockType.title,
							hasEdit: typeof blockType.edit,
							hasSave: typeof blockType.save,
							apiVersion: blockType.apiVersion
						} );
						initializeEditor( blockType );
						return;
					}

					if ( attempt >= maxAttempts ) {
						console.error( '[Compat Mode] Block NOT FOUND after ' + maxAttempts + ' attempts: ' + blockName );
						console.log( '[Compat Mode] Available blocks:', getBlockTypes().map( b => b.name ) );
						document.getElementById( 'compat-mode-editor' ).innerHTML =
							'<div style="padding: 20px; color: red;">Block not found: ' + blockName + '</div>';
						window.parent.postMessage( { type: 'COMPAT_READY' }, parentOrigin );
						return;
					}

					setTimeout( function() {
						waitForBlock( blockName, maxAttempts, attempt + 1 );
					}, 100 );
				}

				function initializeEditor( blockType ) {
					console.log( '[Compat Mode] Initializing editor for:', blockType.name );

					// Get BlockEditorProvider and other components from wp.blockEditor
					var BlockEditorProvider = wp.blockEditor.BlockEditorProvider;
					var BlockList = wp.blockEditor.BlockList;
					var createBlock = wp.blocks.createBlock;
					var useDispatch = wp.data.useDispatch;
					var useSelect = wp.data.useSelect;

					// Add mediaUpload function to settings so MediaUploadCheck renders content.
					// This is a minimal implementation - we proxy uploads through the parent window.
					var editorSettings = Object.assign( {}, config.editorSettings, {
						mediaUpload: function( options ) {
							// Basic media upload - use the existing WordPress upload mechanism
							var files = options.filesList;
							var onFileChange = options.onFileChange;
							var onError = options.onError;

							if ( ! files || ! files.length ) {
								return;
							}

							// For now, show error since we can't easily upload from iframe
							// In the future, we could post message to parent to handle upload
							console.log( '[Compat Mode] Media upload requested', files );
							if ( onError ) {
								onError( 'Media upload from compat mode is not yet supported.' );
							}
						}
					} );
					console.log( '[Compat Mode] Editor settings with mediaUpload:', !!editorSettings.mediaUpload );

					console.log( '[Compat Mode] BlockEditorProvider:', BlockEditorProvider ? 'exists' : 'MISSING' );
					console.log( '[Compat Mode] BlockList:', BlockList ? 'exists' : 'MISSING' );

					function CompatModeBlockEditor( { blockName } ) {
						console.log( '[Compat Mode] CompatModeBlockEditor rendering, blockName:', blockName );

						// Create initial block
						var initialBlock = createBlock( blockName, {} );
						var [ blocks, setBlocks ] = useState( [ initialBlock ] );
						var resizeObserverRef = useRef( null );
						var lastAttributesJson = useRef( '' );

						var reportHeight = useCallback( function() {
							var editor = document.getElementById( 'compat-mode-editor' );
							if ( editor ) {
								window.parent.postMessage( { type: 'COMPAT_RESIZE', height: editor.scrollHeight }, parentOrigin );
							}
						}, [] );

						// Handle block changes - report to parent
						var handleBlocksChange = useCallback( function( newBlocks ) {
							console.log( '[Compat Mode] Blocks changed:', newBlocks.length );
							setBlocks( newBlocks );

							// Report attribute changes to parent
							if ( newBlocks[ 0 ] ) {
								var currentJson = JSON.stringify( newBlocks[ 0 ].attributes );
								if ( currentJson !== lastAttributesJson.current ) {
									lastAttributesJson.current = currentJson;
									window.parent.postMessage( { type: 'COMPAT_ATTRS_CHANGED', attributes: newBlocks[ 0 ].attributes }, parentOrigin );
									setTimeout( reportHeight, 50 );
								}
							}
						}, [ reportHeight ] );

						// Set up resize observer
						useEffect( function() {
							var editor = document.getElementById( 'compat-mode-editor' );
							if ( editor && window.ResizeObserver ) {
								resizeObserverRef.current = new ResizeObserver( reportHeight );
								resizeObserverRef.current.observe( editor );
							}
							setTimeout( reportHeight, 100 );
							return function() {
								if ( resizeObserverRef.current ) resizeObserverRef.current.disconnect();
							};
						}, [ reportHeight ] );

						// Listen for messages from parent
						useEffect( function() {
							function handleMessage( event ) {
								if ( event.origin !== parentOrigin ) return;
								var data = event.data || {};
								console.log( '[Compat Mode] Received message:', data.type );
								switch ( data.type ) {
									case 'COMPAT_INIT':
										console.log( '[Compat Mode] COMPAT_INIT received, attributes:', data.attributes );
										if ( data.attributes ) {
											var block = createBlock( blockName, data.attributes );
											setBlocks( [ block ] );
										}
										setTimeout( reportHeight, 100 );
										break;
									case 'COMPAT_UPDATE_ATTRS':
										console.log( '[Compat Mode] COMPAT_UPDATE_ATTRS, attributes:', data.attributes );
										if ( data.attributes && blocks[ 0 ] ) {
											// Create new block with updated attributes (immutable update)
											var updatedBlock = createBlock( blockName, Object.assign( {}, blocks[ 0 ].attributes, data.attributes ) );
											setBlocks( [ updatedBlock ] );
										}
										setTimeout( reportHeight, 50 );
										break;
								}
							}
							window.addEventListener( 'message', handleMessage );
							return function() { window.removeEventListener( 'message', handleMessage ); };
						}, [ reportHeight, blockName, blocks ] );

						console.log( '[Compat Mode] Rendering with blocks:', blocks.length, blocks[ 0 ]?.name );

						return createElement( 'div', { className: 'compat-mode-block-wrapper' },
							createElement( BlockEditorProvider, {
								value: blocks,
								onInput: handleBlocksChange,
								onChange: handleBlocksChange,
								settings: editorSettings
							},
								createElement( BlockList, null )
							)
						);
					}

					// Create proper React class component for error boundary
					class ErrorBoundary extends wp.element.Component {
						constructor( props ) {
							super( props );
							this.state = { hasError: false, error: null };
						}
						static getDerivedStateFromError( error ) {
							return { hasError: true, error: error };
						}
						componentDidCatch( error, errorInfo ) {
							console.error( '[Compat Mode] Block error:', error, errorInfo );
						}
						componentDidMount() {
							console.log( '[Compat Mode] ErrorBoundary mounted' );
						}
						render() {
							if ( this.state.hasError ) {
								return createElement( 'div', {
									className: 'compat-mode-block-wrapper',
									style: { padding: '20px', color: '#cc1818', backgroundColor: '#fce4e4', borderRadius: '4px' }
								},
									createElement( 'strong', null, 'Block Error' ),
									createElement( 'p', null, this.state.error?.message || 'An error occurred.' )
								);
							}
							return this.props.children;
						}
					}

					var container = document.getElementById( 'compat-mode-editor' );
					var root = createRoot( container );

					root.render(
						createElement( ErrorBoundary, null,
							createElement( CompatModeBlockEditor, { blockName: config.blockName } )
						)
					);
				}

				waitForBlock( config.blockName, 50, 1 );

			} catch ( error ) {
				console.error( '[Compat Mode] Error:', error );
				document.getElementById( 'compat-mode-editor' ).innerHTML =
					'<div style="padding: 20px; color: red;">Error: ' + error.message + '</div>';
				window.parent.postMessage( { type: 'COMPAT_READY' }, parentOrigin );
			}
		} );
	} )();
	</script>
	<?php

	// Don't include admin footer - exit here.
	exit;
}
// Use default priority so admin colors and other globals are set up first.
add_action( 'admin_init', 'gutenberg_handle_compat_mode_request' );

/**
 * Enqueues assets for the compat mode editor.
 */
function gutenberg_enqueue_compat_mode_assets() {
	wp_enqueue_script( 'wp-block-editor' );
	wp_enqueue_script( 'wp-blocks' );
	wp_enqueue_script( 'wp-components' );
	wp_enqueue_script( 'wp-data' );
	wp_enqueue_script( 'wp-element' );
	wp_enqueue_script( 'wp-i18n' );
	wp_enqueue_script( 'wp-hooks' );
	wp_enqueue_script( 'wp-dom-ready' );
	wp_enqueue_script( 'wp-block-library' );

	wp_enqueue_style( 'wp-block-editor' );
	wp_enqueue_style( 'wp-components' );
	wp_enqueue_style( 'wp-edit-blocks' );
	wp_enqueue_style( 'wp-block-library' );

	// Enqueue all registered block editor scripts.
	$block_registry = WP_Block_Type_Registry::get_instance();
	foreach ( $block_registry->get_all_registered() as $block_type ) {
		if ( ! empty( $block_type->editor_script_handles ) ) {
			foreach ( $block_type->editor_script_handles as $handle ) {
				wp_enqueue_script( $handle );
			}
		}
		if ( ! empty( $block_type->editor_script ) ) {
			wp_enqueue_script( $block_type->editor_script );
		}
		if ( ! empty( $block_type->editor_style_handles ) ) {
			foreach ( $block_type->editor_style_handles as $handle ) {
				wp_enqueue_style( $handle );
			}
		}
		if ( ! empty( $block_type->editor_style ) ) {
			wp_enqueue_style( $block_type->editor_style );
		}
	}

	do_action( 'enqueue_block_editor_assets' );

	// Bootstrap server-side block definitions.
	require_once ABSPATH . 'wp-admin/includes/post.php';
	$block_definitions = get_block_editor_server_block_settings();
	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( $block_definitions, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ) . ');'
	);
}

/**
 * Adds the compat mode editor URL to block editor settings.
 *
 * @param array $settings The block editor settings.
 * @return array Modified settings.
 */
function gutenberg_add_compat_mode_settings( $settings ) {
	$settings['compatModeEditorUrl'] = admin_url( 'admin.php?gutenberg-compat-mode=1' );
	$settings['compatModeNonce']     = wp_create_nonce( 'gutenberg_compat_mode' );
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_compat_mode_settings' );
