<?php
/**
 * HTML for testing the router navigate function.
 *
 * @package gutenberg-test-interactive-blocks
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */

?>


<div data-wp-interactive data-wp-navigation-id="region-1">
	<h2 data-testid="title"><?php echo $attributes['title']; ?></h2>

	<output
		data-testid="router navigations"
		data-wp-text="state.router.navigations"
	>NaN</output>
	<output
		data-testid="router status"
		data-wp-text="state.router.status"
	>undefined</output>

	<?php
	if ( isset( $attributes['links'] ) ) {
		foreach ( $attributes['links'] as $key => $link ) {
			$i = $key += 1;
			echo <<<HTML
			<a
				data-testid="link $i"
				data-wp-on--click="actions.router.navigate"
				href="$link"
			>link $i</a>
HTML;
		}
	}
	?>
</div>
