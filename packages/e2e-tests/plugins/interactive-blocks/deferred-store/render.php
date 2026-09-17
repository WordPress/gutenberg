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
		'value'                   => function () {
			$context = wp_interactivity_get_context( 'test/deferred-store/derived-state' );
			return 'bind-' . $context['counter'];
		},
		'below10'                 => function () {
			$context = wp_interactivity_get_context( 'test/deferred-store/derived-state' );
			return $context['counter'] < 10;
		},
		'redOrGreen'              => function () {
			$context = wp_interactivity_get_context( 'test/deferred-store/derived-state' );
			return $context['isReady'] ? 'rgb(0, 255, 0)' : 'rgb(255, 0, 0)';
		},
		'derivedText'             => function () {
			$context = wp_interactivity_get_context( 'test/deferred-store/derived-state' );
			return $context['isReady'] ? 'client-updated text' : 'server-rendered text';
		},
		'radiotelephonicAlphabet' => function () {
			$context = wp_interactivity_get_context( 'test/deferred-store/derived-state' );
			$dictionary = array(
				'a' => 'alpha',
				'b' => 'bravo',
				'c' => 'charlie',
				'd' => 'delta',
			);
			return array_map(
				function ( $item ) use ( $dictionary ) {
					return $dictionary[ $item ];
				},
				$context['list']
			);
		},
	)
);

add_filter(
	'script_module_data_@wordpress/interactivity',
	function ( $data ) {
		if ( ! isset( $data ) ) {
			$data = array();
		}
		$data['derivedStateClosures'] = array(
			'test/deferred-store/derived-state' => array(
				'state.value',
				'state.below10',
				'state.redOrGreen',
				'state.derivedText',
				'state.radiotelephonicAlphabet',
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
	<input
		name="derived-bind-2"
		type="text"
		value="bind-42"
		readonly
		data-wp-bind--value="state.existingValue"
		data-testid="derived-bind-value-2"
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

<div data-wp-interactive="test/deferred-store/derived-state" data-wp-context='{"isReady": false}'>
	<output
		style="color:red;"
		data-wp-style--color="state.redOrGreen"
		data-testid="derived-style-element"
	>Style</output>
	<button data-wp-on--click="actions.setReady" data-testid="derived-style-ready">Set ready</button>
</div>

<div data-wp-interactive="test/deferred-store/derived-state" data-wp-context='{"isReady": false}'>
	<output
		data-wp-text="state.derivedText"
		data-testid="derived-text-element"
	>server-rendered text</output>
	<button data-wp-on--click="actions.setReady" data-testid="derived-text-update">Update</button>
</div>

<div data-wp-interactive="test/deferred-store/derived-state" data-wp-context='{"list": ["a", "b", "c"]}'>
	<ol data-testid="derived-each-list">
		<template data-wp-each="state.radiotelephonicAlphabet">
			<li data-wp-text="context.item"></li>
		</template>
		<li data-wp-each-child="test/deferred-store/derived-state::state.radiotelephonicAlphabet" data-wp-text="context.item">alpha</li>
		<li data-wp-each-child="test/deferred-store/derived-state::state.radiotelephonicAlphabet" data-wp-text="context.item">bravo</li>
		<li data-wp-each-child="test/deferred-store/derived-state::state.radiotelephonicAlphabet" data-wp-text="context.item">charlie</li>
	</ol>
	<button data-wp-on--click="actions.addItem" data-testid="derived-each-additem">+</button>
</div>
