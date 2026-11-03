<?php
/**
 * HTML for testing lazy hydration combined with the router.
 *
 * The router region sits at the top of the page. Two additional islands are
 * pushed far below the viewport (the observer's rootMargin is one viewport
 * height, so islands more than two viewport heights down stay unobserved
 * until the user scrolls, the idle sweep fires, or the router force-hydrates).
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */
?>
<div
	data-wp-interactive="router-lazy-hydration"
	data-wp-router-region="lazy-hydration/region"
>
	<p data-testid="region-ssr">content from page <?php echo $attributes['page']; ?></p>
	<p data-testid="region-hydrated" data-wp-text="state.hydrated">no</p>

	<?php if ( isset( $attributes['next'] ) ) : ?>
		<a
			data-testid="next"
			data-wp-on--click="actions.router.navigate"
			href="<?php echo $attributes['next']; ?>"
		>Next</a>
	<?php else : ?>
		<a
			data-testid="back"
			data-wp-on--click="actions.router.back"
			href="#"
		>Back</a>
	<?php endif; ?>
</div>

<!-- The spacer pushes the islands below. The default viewport is 720px high and
	the observer rootMargin is 100%, so an island needs to be more than
	~1440px down to stay unobserved on load. -->
<div style="height: 2500px" aria-hidden="true"></div>

<div data-wp-interactive="router-lazy-hydration" data-testid="below-island">
	<p data-testid="below-hydrated" data-wp-text="state.hydrated">no</p>
	<button
		data-testid="below-button"
		data-wp-text="state.count"
		data-wp-on--click="actions.increment"
	>0</button>
</div>

<div style="height: 3000px" aria-hidden="true"></div>

<div data-wp-interactive="router-lazy-hydration" data-testid="deep-island">
	<p data-testid="deep-hydrated" data-wp-text="state.hydrated">no</p>
	<button
		data-testid="deep-button"
		data-wp-text="state.count"
		data-wp-on--click="actions.increment"
	>0</button>
</div>
