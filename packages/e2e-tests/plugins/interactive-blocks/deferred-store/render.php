<?php
/**
 * HTML for testing scope restoration with generators.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_interactivity_state(
	'test/deferred-store',
	array(
		'number' => 2,
		'double' => 4,
	)
);

wp_interactivity_state(
	'test/deferred-store/derived-state',
	array(
		'value'   => function () {
			$context = wp_interactivity_get_context( 'test/deferred-store/bind' );
			return $context['counter'] * 2;
		},
		'below10' => function () {
			$context = wp_interactivity_get_context( 'test/deferred-store/class' );
			return $context['counter'] < 10;
		},
	)
);

add_filter(
	'script_module_data_@wordpress/interactivity',
	function ( $data ) {
		if ( ! isset( $data ) ) {
			$data = array();
		}
		$data['derivedStatePropsAccessed'] = array(
			'test/deferred-store/derived-state' => array(
				'state.value',
				'state.below10',
			),
		);
		return $data;
	}
);

?>

<div
	data-wp-interactive="test/deferred-store"
	<?php echo wp_interactivity_data_wp_context( array( 'text' => '!dlrow ,olleH' ) ); ?>
>
	<span data-wp-text="state.reversedText" data-testid="result"></span>
	<span data-wp-text="state.reversedTextGetter" data-testid="result-getter"></span>

	<span data-wp-text="state.number" data-testid="state-number"></span>
	<span data-wp-text="state.double" data-testid="state-double"></span>
</div>

<div data-wp-interactive="test/deferred-store/derived-state">
	<button data-wp-on--click="actions.load" data-testid="derived-state-load">load</button>
	<span hidden data-wp-bind--hidden="!state.hydrated" data-testid="derived-state-hydrated">hydrated</span>
	<span hidden data-wp-bind--hidden="!state.loaded" data-testid="derived-state-loaded">loaded</span>
</div>

<div data-wp-interactive="test/deferred-store/derived-state" data-wp-context='{"counter": 42}'>
	<input
		name="derived-bind"
		type="text"
		value="bind-42"
		readonly
		data-wp-bind--value="state.value"
		data-testid="derived-bind-value"
	>
	<button data-wp-on--click="actions.increment" data-testid="derived-bind-increment">+</button>
</div>

<div data-wp-interactive="test/deferred-store/derived-state" data-wp-context='{"counter": 9}'>
	<output
		class="below-10"
		data-wp-class--below-10="state.below10"
		data-wp-text="context.counter"
		data-testid="derived-class-element"
	>NaN</output>
	<button data-wp-on--click="actions.increment" data-testid="derived-class-increment">+</button>
</div>
