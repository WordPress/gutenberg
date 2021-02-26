<?php
/**
 * Server-side rendering of the `core/group` block.
 *
 * @package WordPress
 */

/**
 * Supports `layoutt` attribute server side for `core/group`.
 *
 * @param array  $attributes The block attributes.
 * @param string $content HTML content of the block.
 *
 * @return string Rendered HTML of the referenced block.
 */
function render_block_core_group( $attributes, $content ) {
	if ( ! isset( $attributes['layout'] ) ) {
		return $content;
	}

	$id           = uniqid();
	$content_size = isset( $attributes['layout']['contentSize'] ) ? $attributes['layout']['contentSize'] : null;
	$wide_size    = isset( $attributes['layout']['wideSize'] ) ? $attributes['layout']['wideSize'] : null;
	if ( ! $content_size && ! $wide_size ) {
		return $content;
	}
	ob_start();
	?>
		<style>
			<?php echo '.wp-container-' . $id; ?> > * {
				max-width: <?php echo $content_size ? $content_size : $wide_size; ?>;
				margin-left: auto;
				margin-right: auto;
			}

			<?php echo '.wp-container-' . $id; ?> > .alignwide {
				max-width: <?php echo $wide_size ? $wide_size : $content_size; ?>;
			}

			<?php echo '.wp-container-' . $id; ?> .alignfull {
				max-width: none;
			}
		</style>
	<?php
	$style   = ob_get_clean();
	$content = preg_replace(
		'/' . preg_quote( 'class="', '/' ) . '/',
		'class="wp-container-' . $id . ' ',
		$content,
		1
	);

	return $content . $style;
}

/**
 * Registers the `core/group` block.
 */
function register_block_core_group() {
	register_block_type_from_metadata(
		__DIR__ . '/group',
		array(
			'render_callback' => 'render_block_core_group',
		)
	);
}
add_action( 'init', 'register_block_core_group' );
