<?php
/**
 * Island that throws during hydration. Used to test that a single failing
 * island does not break the hydration of other islands or the router.
 *
 * The `data-wp-run` callback throws synchronously during render, which
 * propagates out of `hydrate()` and aborts whatever hydration loop is
 * processing this island (the IntersectionObserver callback or the idle-time
 * sweep) unless that loop guards against errors.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */
?>
<div data-wp-interactive="throwing-island" data-testid="throwing-island">
	<p data-wp-run="callbacks.boom" data-testid="throwing-text">throwing island</p>
</div>
