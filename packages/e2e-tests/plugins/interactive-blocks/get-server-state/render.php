<?php
/**
 * HTML for testing the getServerState() function.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */

if ( isset( $attributes['state'] ) ) {
	wp_interactivity_state( 'test/get-server-state', $attributes['state'] );
}
?>

<div
	data-wp-interactive="test/get-server-state"
	data-wp-watch---update-state="callbacks.updateState"
	data-wp-watch---non-changing="callbacks.updateNonChanging"
	data-wp-watch---only-in-main="callbacks.updateOnlyInMain"
	data-wp-watch---only-in-link-1="callbacks.updateOnlyInLink1"
>
	<div data-testid="prop" data-wp-text="state.prop"></div>
	<div data-testid="nested.prop" data-wp-text="state.nested.prop"></div>
	<div data-testid="newProp" data-wp-text="state.newProp"></div>
	<div data-testid="nested.newProp" data-wp-text="state.nested.newProp"></div>
	<div data-testid="nonChanging" data-wp-text="state.nonChanging"></div>
	<div data-testid="onlyInMain" data-wp-text="state.onlyInMain"></div>
	<div data-testid="onlyInLink1" data-wp-text="state.onlyInLink1"></div>

	<button
		data-testid="tryToModifyServerState"
		<?php echo wp_interactivity_data_wp_context( array( 'result' => 'modify' ) ); ?>
		data-wp-on--click="actions.attemptModification"
		data-wp-text="context.result">
	>
		modify
	</button>

	<button
		data-testid="updateNonChanging"
		data-wp-on--click="actions.updateNonChanging"
	>
		update non-changing prop
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
HTML;
			}
		}
		?>
	</nav>
</div>
