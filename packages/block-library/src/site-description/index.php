<?php
/**
 * Server-side rendering of the `core/site-description` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/site-description` block on the server.
 *
 * @return string The render.
 */
function render_block_core_site_description( $attributes ) {
	$styles = '';

	$class = 'wp-block-site-description';
	if ( isset( $attributes['className'] ) ) {
		$class .= ' ' . $attributes['className'];
	}

	if ( isset( $attributes['align'] ) ) {
		$class .= ' align' . $attributes['align'];
	}

	if ( isset( $attributes['textAlign'] ) ) {
		$class .= ' has-text-align-' . $attributes['textAlign'];
	}

	if ( isset( $attributes['textColor'] ) ) {
		$class .= ' has-text-color';
		$class .= ' has-' . $attributes['textColor'] . '-color';
	} elseif ( isset( $attributes['customTextColor'] ) ) {
		$class  .= ' has-text-color';
		$styles .= ' color: ' . $attributes['customTextColor'] . ';';
	}

	if ( isset( $attributes['backgroundColor'] ) ) {
		$class .= ' has-background';
		$class .= ' has-' . $attributes['backgroundColor'] . '-background-color';
	} elseif ( isset( $attributes['customBackgroundColor'] ) ) {
		$class  .= ' has-background';
		$styles .= ' background-color: ' . $attributes['customBackgroundColor'] . ';';
	}

	if ( isset( $attributes['fontSize'] ) ) {
		$class .= ' has-' . $attributes['fontSize'] . '-font-size';
	} elseif ( isset( $attributes['customFontSize'] ) ) {
		$styles .= ' font-size: ' . $attributes['customFontSize'] . 'px;';
	}

	ob_start();
	?>
	<p class="<?php echo esc_attr( $class ); ?>" style="<?php echo esc_attr( $styles ); ?>">
		<?php bloginfo( 'description' ); ?>
	</p>
	<?php
	return ob_get_clean();
}

/**
 * Registers the `core/site-description` block on the server.
 */
function register_block_core_site_description() {
	register_block_type(
		'core/site-description',
		array(
			'render_callback' => 'render_block_core_site_description',
		)
	);
}
add_action( 'init', 'register_block_core_site_description' );
