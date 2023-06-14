<?php
	$counter = 'ok' === $attributes['condition'] ? 3 : 0;
	$double  = $counter * 2;
?>
<div data-wp-island>
	<div>
		Counter:
		<span
			data-wp-bind.children="state.counter.value"
			data-testid="counter value"
			><?= $counter ?></span
		>
		<br />
		Double:
		<span
			data-wp-bind.children="state.counter.double"
			data-testid="counter double"
			><?= $double ?></span
		>
		<br />
		<button
			data-wp-on.click="actions.counter.increment"
			data-testid="counter button"
		>
			+1
		</button>
		<span
			data-wp-bind.children="state.counter.clicks"
			data-testid="counter clicks"
			>0</span
		>
		clicks
	</div>
</div>
<?php switch ( $attributes[ 'condition' ] ) : ?>
<?php case 'ok': ?>
	<script type="application/json" id="store">
		{ "state": { "counter": { "value": 3 } } }
	</script>
<?php break; ?>
<?php case 'corrupted-json': ?>
	<script type="application/json" id="store">
		this is not a JSON
	</script>
<?php break; ?>
<?php case 'invalid-state': ?>
	<script type="application/json" id="store">
		{ "state": null }
	</script>
<?php break; ?>
<?php endswitch ?>
