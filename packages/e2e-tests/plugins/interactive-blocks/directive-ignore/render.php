<?php
/**
 * HTML for testing the directive `data-wp-style`.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_interactivity_state( 'directive-ignore', array( 'clicks' => 0 ) );
?>

<div
	data-testid="block"
	data-wp-interactive="directive-ignore"
	data-wp-run="actions.run"
	<?php
		echo wp_interactivity_data_wp_context(
			array(
				'a'   => 'the letter a',
				'b'   => 'the letter b',
				'one' => 'the number one',
				'two' => 'the number two',
			)
		);
	?>
>
	<div data-wp-text="state.clicks" data-testid="counter"></div>

	<div data-wp-ignore data-wp-text="context.two" data-testid="ignored">
		<div data-testid="ignored-child" data-wp-text="context.a">No processing should occur here.</div>
	</div>

	<button data-testid="click-me" data-wp-on--click="actions.click" type="button">Click me</button>
</div>
