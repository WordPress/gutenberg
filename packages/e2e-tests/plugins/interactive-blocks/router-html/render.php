<?php
/**
 * HTML for testing router navigation with inert and kept HTML content.
 *
 * @package gutenberg-test-interactive-blocks
 */

$attributes = get_defined_vars()['attributes'];
$scenario   = $attributes['scenario'];
$page       = $attributes['page'];
$region     = 'router-html-' . $scenario;
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

<?php if ( 'nested' === $scenario && 'one' === $page ) : ?>
	<div data-wp-interactive="router-html">
		<div data-testid="inert-html" data-wp-html="state.never">
			<div data-wp-interactive="router-html" data-wp-router-region="<?php echo esc_attr( $region ); ?>" data-wp-init="actions.mark"><p>nested</p></div>
		</div>
	</div>
<?php endif; ?>

<?php if ( 'attach' === $scenario ) : ?>
	<div data-wp-interactive="router-html">
		<?php if ( 'one' === $page ) : ?>
			<div data-testid="inert-html" data-wp-html="state.never">
		<?php endif; ?>
		<div
			data-testid="attach-region"
			data-wp-interactive="router-html"
			data-wp-router-region='{"id":"router-html-attach-body","attachTo":"body"}'
		>
			<p>attached content from <?php echo esc_html( $page ); ?></p>
		</div>
		<?php if ( 'one' === $page ) : ?>
			</div>
		<?php endif; ?>
	</div>
<?php endif; ?>

<div data-wp-interactive="router-html">
	<p data-testid="hydration" data-wp-text="state.hydration">not hydrated</p>
	<p data-testid="mark-count" data-wp-text="state.markCount">not hydrated</p>
</div>
