<?php
/**
 * HTML for testing HTML elements kept across router navigation.
 *
 * @package gutenberg-test-interactive-blocks
 */

$attributes = get_defined_vars()['attributes'];
$scenario   = $attributes['scenario'];
$page       = $attributes['page'];
$region     = 'router-html-' . $scenario;

if ( 'pending' === $attributes['value'] ) {
	wp_interactivity_state(
		'router-html',
		array(
			/**
			 * Supplies the server-only derived HTML placeholder.
			 *
			 * @return null The client implementation is deferred.
			 */
			'late' => function () {
				return null;
			},
		)
	);
	add_filter(
		'script_module_data_@wordpress/interactivity',
		/**
		 * Declares a derived value whose client implementation loads later.
		 *
		 * @param array|null $data Serialized Interactivity API server data.
		 * @return array Server data with the pending HTML getter declaration.
		 */
		function ( $data ) {
			$data = $data ?? array();
			$data['derivedStateClosures']['router-html'][] = 'state.late';
			return $data;
		}
	);
}
?>

<div data-wp-interactive="router-html">
	<div
		data-testid="main-region"
		data-wp-interactive="router-html"
		data-wp-router-region="<?php echo esc_attr( $region ); ?>"
		<?php
		echo wp_interactivity_data_wp_context(
			array(
				'value'    => $attributes['value'],
				'resolved' => false,
			)
		);
		?>
	>
		<p data-testid="page-content">content from <?php echo esc_html( $page ); ?></p>
		<?php if ( 'kept' === $scenario ) : ?>
			<div data-testid="kept-html" data-wp-html="state.html"><i><?php echo 'one' === $page ? 'one' : 'two'; ?></i></div>
			<div data-testid="never-html" data-wp-html="state.never"><i><?php echo 'one' === $page ? 'never one' : 'never two'; ?></i></div>
			<p data-testid="value" data-wp-text="state.value">not hydrated</p>
			<button data-wp-on--click="actions.resolve">Resolve HTML</button>
		<?php endif; ?>
		<?php if ( ! empty( $attributes['next'] ) ) : ?>
			<a href="<?php echo esc_url( $attributes['next'] ); ?>" data-wp-on--click="actions.navigate">Next</a>
		<?php endif; ?>
	</div>
</div>

<div data-wp-interactive="router-html">
	<p data-testid="hydration" data-wp-text="state.hydration">not hydrated</p>
</div>
