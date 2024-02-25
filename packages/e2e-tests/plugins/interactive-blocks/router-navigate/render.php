<?php
/**
 * HTML for testing the router navigate function.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */

wp_enqueue_script_module( 'router-navigate-view' );

if ( $attributes['disableNavigation'] ) {
	wp_interactivity_config(
		'core/router',
		array( 'clientNavigationDisabled' => true )
	);
}

if ( isset( $attributes['data'] ) ) {
	$initial_state = array(
		'state' => array(
			'router' => array( 'data' => $attributes['data'] ),
		),
	);
}
?>

<div
	data-wp-interactive="router"
	data-wp-router-region="region-1"
>
	<h2 data-testid="title"><?php echo $attributes['title']; ?></h2>

	<output
		data-testid="router navigations"
		data-wp-text="state.navigations"
	>NaN</output>
	<output
		data-testid="router status"
		data-wp-text="state.status"
	>undefined</output>

	<button
		data-wp-on--click="actions.toggleTimeout"
		data-testid="toggle timeout"
	>
		Timeout <span data-wp-text="state.timeout">NaN</span>
	</button>

	<nav>
		<?php
		if ( isset( $attributes['links'] ) ) {
			foreach ( $attributes['links'] as $key => $link ) {
				$i = $key += 1;
				echo <<<HTML
				<a
					data-testid="link $i"
					data-wp-on--click="actions.navigate"
					href="$link"
				>link $i</a>
				<a
					data-testid="link $i with hash"
					data-wp-on--click="actions.navigate"
					data-force-navigation="true"
					href="$link#link-$i-with-hash"
				>link $i with hash</a>
HTML;
			}
		}
		?>
	</nav>
	<div data-testid="getterProp" data-wp-text="state.data.getterProp"></div>
	<div data-testid="prop1" data-wp-text="state.data.prop1"></div>
	<div data-testid="prop2" data-wp-text="state.data.prop2"></div>
	<div data-testid="prop3" data-wp-text="state.data.prop3"></div>
</div>

<script type="application/json" id="wp-interactivity-data">
	<?php echo isset( $initial_state ) ? json_encode( $initial_state ) : '{}'; ?>
</script>
