<?php
/**
 * Dialog Block
 *
 * @package PRC\Platform\Blocks
 */

namespace PRC\Platform\Blocks;

/**
 * Block Name:        Dialog
 * Version:           1.0.0
 * Requires at least: 6.7
 * Requires PHP:      8.2
 * Author:            Seth Rubenstein
 *
 * @package           prc-block
 */
class Dialog {
	/**
	 * Constructor
	 *
	 * @param mixed $loader Loader.
	 */
	public function __construct( $loader ) {
		$this->init( $loader );
	}

	/**
	 * Initialize the block
	 *
	 * @param mixed $loader Loader.
	 */
	public function init( $loader = null ) {
		if ( null !== $loader ) {
			$loader->add_action( 'init', $this, 'block_init' );
			$loader->add_filter( 'render_block_data', $this, 'dialog_id_fallback', 100, 1 );
		}
	}

	/**
	 * Fallback to dialogID if not set by the block
	 *
	 * @hook render_block_data
	 * @param mixed $block Block.
	 * @return mixed
	 */
	public function dialog_id_fallback( $block ) {
		if ( 'prc-block/dialog' === $block['blockName'] ) {
			if ( ! isset( $block['attrs']['dialogId'] ) || empty( $block['attrs']['dialogId'] ) ) {
				$block['attrs']['dialogId'] = wp_unique_id( 'dialog-' );
			}
		}
		return $block;
	}

	/**
	 * Block init
	 *
	 * @hook init
	 * @return void
	 */
	public function block_init() {
		register_block_type_from_metadata(
			PRC_BLOCK_LIBRARY_DIR . '/build/dialog'
		);
	}
}
