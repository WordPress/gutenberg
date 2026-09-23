<?php
/**
 * HTML for testing the router navigation lifecycle state (`state.navigating`
 * and `state.initiator`, published by `@wordpress/interactivity-router`) in
 * **full-page** client-side navigation mode (the
 * `gutenberg-full-page-client-side-navigation` experiment).
 *
 * Full-page mode makes the whole BODY the router region --
 * `Gutenberg_Interactivity_API_Full_Page_Navigation::add_directives_to_body()`
 * sets `data-wp-interactive` and `data-wp-router-region="core/body"` on the
 * BODY tag itself, and there is no per-post switch. So, unlike
 * `router-navigation-lifecycle`, this fixture's own wrapper declares *no*
 * `data-wp-router-region` of its own: its own named region (`regionId`) is
 * nested *inside* the implicit BODY region, which is what lets the "outside
 * every block region" control below -- rendered inside this wrapper but
 * outside that nested region -- derive `core/body` by walking up to BODY,
 * rather than stopping at this wrapper or at some region of its own.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */

$page      = $attributes['page'] ?? '';
$next_href = $attributes['next'] ?? null;
$region_id = $attributes['regionId'] ?? '';
?>
<div data-wp-interactive="router-navigation-full-page">
	<?php if ( isset( $next_href ) ) : ?>
		<!--
			A plain <a>, outside every block region. No directive
			handles this click, so the full-page document click listener
			(`packages/interactivity-router/src/full-page.ts`) does -- and
			that listener's own `actions.navigate()` call carries no ambient
			directive scope, so it must read absent regardless of where this
			link sits in the DOM.
		-->
		<a
			data-testid="plain-link-outside-region"
			href="<?php echo esc_url( $next_href ); ?>"
		>plain link (outside region)</a>

		<!--
			A directive-scoped click control, also outside every
			block region. Its own `data-wp-on--click` action *does* carry an
			ambient scope, and this control's nearest enclosing
			`data-wp-router-region` is the BODY the full-page PHP class marks
			`core/body` -- not this wrapper, which declares none of its own.
		-->
		<a
			data-testid="navigate-outside-region"
			data-wp-on--click="actions.navigate"
			href="<?php echo esc_url( $next_href ); ?>"
		>navigate (outside region)</a>
	<?php endif; ?>

	<?php
	/*
	 * FIXTURE TRAP (see `router-navigation-lifecycle/render.php` for the
	 * full account): `data-wp-interactive` is repeated here even though the
	 * outer wrapper above already carries it. `interactivity-router`'s own
	 * region-detection selector requires the region-bearing element itself
	 * to carry `data-wp-interactive`, not merely an ancestor -- omitting it
	 * here would hydrate fine on first load and then silently drop this
	 * region's content after the first client-side navigation.
	 */
	?>
	<div
		data-testid="region-<?php echo esc_attr( $region_id ); ?>"
		data-wp-interactive="router-navigation-full-page"
		data-wp-router-region="<?php echo esc_attr( $region_id ); ?>"
	>
		<?php if ( isset( $next_href ) ) : ?>
			<!--
				A plain <a>, this time *inside* the fixture's own
				region. Still handled by the document listener, not by any
				directive scope -- DOM containment must not change the
				reading, which is exactly what makes this link and the one
				above a matched pair.
			-->
			<a
				data-testid="plain-link-inside-region"
				href="<?php echo esc_url( $next_href ); ?>"
			>plain link (inside region)</a>

			<!--
				A click handled by this block's own scoped action,
				inside its own region -- the identical shape to
				`router-navigation-lifecycle`'s region-mode `navigate` link,
				so the reading it produces here must match the region-mode
				reading exactly.
			-->
			<a
				data-testid="navigate-inside-region"
				data-wp-on--click="actions.navigate"
				href="<?php echo esc_url( $next_href ); ?>"
			>navigate (inside region)</a>
		<?php endif; ?>

		<p data-testid="page-marker">page marker: <?php echo esc_html( $page ); ?></p>
	</div>

	<!--
		The observer readout -- the same shape as
		`router-navigation-lifecycle`'s counted lifecycle observer, reading
		`core/router` state from this block's own store namespace. Its run
		*count* is not asserted anywhere in this fixture's tests: the
		BODY-wide region tears this whole wrapper down and rebuilds it on
		every navigation, so a count here is a function of reconciliation,
		not of the lifecycle. Its *content* still is evidence, because
		`state.log` is module state and survives the region swap.
	-->
	<p
		data-testid="lifecycle log"
		data-wp-watch="callbacks.watchLifecycle"
		data-wp-text="state.log"
	>not hydrated</p>
	<p data-testid="lifecycle navigating" data-wp-text="state.navigatingReading">not hydrated</p>
	<p data-testid="lifecycle initiator" data-wp-text="state.initiatorReading">not hydrated</p>
</div>
