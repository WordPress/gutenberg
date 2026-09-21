<?php
/**
 * HTML for testing the router navigation lifecycle state (`state.navigating`
 * and `state.initiator`, published by `@wordpress/interactivity-router`) in
 * region-based client-side navigation.
 *
 * This single fixture block is shared by every test of the
 * `router-navigation-lifecycle` e2e spec, so it supports more attributes
 * than any one test exercises. The spec's `beforeAll` lists the published
 * pages and which attribute combination each one uses.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */

if ( isset( $attributes['disableNavigation'] ) && $attributes['disableNavigation'] ) {
	wp_interactivity_config(
		'core/router',
		array( 'clientNavigationDisabled' => true )
	);
}

$page = $attributes['page'] ?? '';

// Seeded into this block's own server context so `server-context-readout`
// below is driven by the real `parseServerData` -> `populateServerData`
// path rather than by static markup -- see the end-transition test and the "cascaded-commit
// absorption on the real server-context path" verifier it discharges.
wp_interactivity_state(
	'router-navigation-lifecycle',
	array( 'readout' => "server context for page {$page}" )
);

$next_href  = $attributes['next'] ?? null;
$other_href = $attributes['other'] ?? null;

// Each entry describes one router region this block instance renders: its
// id, the href its own (unlabelled) "navigate" link targets, and whether it
// is the primary region -- the one that also carries the destination marker
// and the server-context readout.
$regions = array();
if ( isset( $attributes['regionId'] ) ) {
	$regions[] = array(
		'id'            => $attributes['regionId'],
		'navigate_href' => $next_href,
		'is_primary'    => true,
	);
}
if ( isset( $attributes['secondRegionId'] ) ) {
	$regions[] = array(
		'id'            => $attributes['secondRegionId'],
		// The second region's own "navigate" link targets `other`, not
		// `next` -- deliberately, so a cross-region flow has two distinct
		// hrefs for the router's `navigatingTo` bail to separate. "Same
		// structure as the first" stops here: every other link below keeps
		// its usual meaning for both regions.
		'navigate_href' => $other_href,
		'is_primary'    => false,
	);
}
?>
<div data-wp-interactive="router-navigation-lifecycle">
	<?php if ( empty( $attributes['observerOnly'] ) ) : ?>
		<?php
		foreach ( $regions as $region ) :
			$region_id     = $region['id'];
			$navigate_href = $region['navigate_href'];
			$context       = wp_interactivity_data_wp_context( array( 'regionId' => $region_id ) );
			?>
			<?php
			/*
			 * FIXTURE TRAP: `data-wp-interactive` is repeated here even
			 * though the outer wrapper above already carries it. Do not
			 * "simplify" this away. The directive runtime's own hydration
			 * resolves the namespace from any ancestor, so omitting it here
			 * looks like it still works on first load -- links click,
			 * `data-wp-text` renders, everything hydrates fine. What breaks
			 * is silent: `interactivity-router`'s own region-detection
			 * selector (`regionsSelector` in
			 * `packages/interactivity-router/src/index.ts`) is
			 * `[data-wp-interactive][data-wp-router-region], [data-wp-interactive] [data-wp-interactive][data-wp-router-region]`
			 * -- it requires the *region-bearing element itself* to carry
			 * `data-wp-interactive`, not merely an ancestor. Without it,
			 * `preparePage()` never registers this element under
			 * `page.regions` for *any* page, including the very first one,
			 * so every navigation resets this region's signal to `null` and
			 * never repopulates it -- the region's entire content silently
			 * disappears after the first client-side navigation.
			 */
			?>
			<div
				data-testid="region-<?php echo esc_attr( $region_id ); ?>"
				data-wp-interactive="router-navigation-lifecycle"
				data-wp-router-region="<?php echo esc_attr( $region_id ); ?>"
				data-wp-class--is-origin="state.isOrigin"
				<?php echo $context; ?>
			>
				<?php if ( isset( $navigate_href ) ) : ?>
					<a
						data-testid="navigate"
						data-wp-on--click="actions.navigate"
						href="<?php echo esc_url( $navigate_href ); ?>"
					>navigate</a>
				<?php endif; ?>

				<?php
				/*
				 * `refresh` takes its href from `window.location.href` at
				 * click time, not from an attribute, so it renders on every
				 * page regardless of `next`/`other` -- which is what lets
				 * the superseded-navigation part of the uncached-traversal
				 * test start a navigation from page 2.
				 */
				?>
				<a
					data-testid="refresh"
					data-wp-on--click="actions.refresh"
					href="#"
				>refresh</a>

				<?php if ( isset( $next_href ) ) : ?>
					<a
						data-testid="navigate (silent)"
						data-wp-on--click="actions.navigateSilent"
						href="<?php echo esc_url( $next_href ); ?>"
					>navigate (silent)</a>
					<a
						data-testid="navigate (declared)"
						data-wp-on--click="actions.navigateDeclared"
						href="<?php echo esc_url( $next_href ); ?>"
					>navigate (declared)</a>
					<a
						data-testid="navigate (suppressed)"
						data-wp-on--click="actions.navigateSuppressed"
						href="<?php echo esc_url( $next_href ); ?>"
					>navigate (suppressed)</a>
					<a
						data-testid="navigate (timeout)"
						data-wp-on--click="actions.navigateTimeout"
						href="<?php echo esc_url( $next_href ); ?>"
					>navigate (timeout)</a>
					<a
						data-testid="prefetch"
						data-wp-on--click="actions.prefetch"
						href="<?php echo esc_url( $next_href ); ?>"
					>prefetch</a>
				<?php endif; ?>

				<?php if ( isset( $other_href ) ) : ?>
					<a
						data-testid="navigate (other)"
						data-wp-on--click="actions.navigate"
						href="<?php echo esc_url( $other_href ); ?>"
					>navigate (other)</a>
				<?php endif; ?>

				<?php if ( $region['is_primary'] ) : ?>
					<p data-testid="page-marker">page marker: <?php echo esc_html( $page ); ?></p>
					<p
						data-testid="server-context-readout"
						data-wp-text="state.readout"
					>not hydrated</p>
				<?php endif; ?>

				<?php
				/*
				 * Per-block spinner demonstration: a per-block spinner
				 * that shows only while *this* region's own navigation is
				 * in flight. `state.isLoading` reads `getContext().regionId`
				 * the same way `state.isOrigin` above does, so one getter
				 * serves every region on the page.
				 */
				?>
				<span
					data-testid="spinner-<?php echo esc_attr( $region_id ); ?>"
					data-wp-class--is-loading="state.isLoading"
				></span>

				<?php
				/*
				 * Region-scoped focus demonstration: a third `data-wp-watch`
				 * (never run-counted), one per region, edge-triggered on the
				 * `navigating` reading and scoped so it can read its own
				 * `regionId` from context. See `watchFocus()` in `view.js`
				 * for why its previous-`navigating` bookkeeping is kept
				 * outside `context` rather than in it.
				 */
				?>
				<span
					data-testid="focus-watcher-<?php echo esc_attr( $region_id ); ?>"
					data-wp-watch="callbacks.watchFocus"
				></span>
			</div>
		<?php endforeach; ?>

		<?php if ( ! empty( $attributes['nested'] ) ) : ?>
			<?php
			/*
			 * Nested-regions fixture: an `inner-region` nested inside an
			 * `outer-region`, with the `navigate` link inside the inner
			 * one, so a derivation that walks to the *outermost* region
			 * (the reading a writer might reach for "because the router
			 * treats the outer region as the update unit") reads
			 * `outer-region` instead of the correct nearest-enclosing
			 * `inner-region`. Both posts using `nested` render the same
			 * two ids, so the router updates both regions on navigation.
			 *
			 * FIXTURE TRAP (see above): both the outer and the inner
			 * region element carry `data-wp-interactive` on *themselves*,
			 * not only on an ancestor -- `regionsSelector` requires it on
			 * the region-bearing element itself.
			 */
			?>
			<div
				data-testid="region-outer-region"
				data-wp-interactive="router-navigation-lifecycle"
				data-wp-router-region="outer-region"
			>
				<div
					data-testid="region-inner-region"
					data-wp-interactive="router-navigation-lifecycle"
					data-wp-router-region="inner-region"
				>
					<?php if ( isset( $next_href ) ) : ?>
						<a
							data-testid="navigate"
							data-wp-on--click="actions.navigate"
							href="<?php echo esc_url( $next_href ); ?>"
						>navigate</a>
					<?php endif; ?>
				</div>
			</div>
		<?php endif; ?>
	<?php endif; ?>

	<!--
		The observer readout: rendered on every page, including
		`observerOnly`. The two watchers live on their own elements, each --
		not sharing one, since directives at one priority level on one
		element share a scope object.
	-->
	<p
		data-testid="lifecycle log"
		data-wp-watch="callbacks.watchLifecycle"
		data-wp-text="state.log"
	>not hydrated</p>
	<p
		data-testid="settlement log"
		data-wp-watch="callbacks.watchSettlement"
		data-wp-text="state.settlementLog"
	>not hydrated</p>
	<p data-testid="lifecycle navigating" data-wp-text="state.navigatingReading">not hydrated</p>
	<p data-testid="lifecycle initiator" data-wp-text="state.initiatorReading">not hydrated</p>

	<span data-testid="bind-aria-busy" data-wp-bind--aria-busy="state.navigating"></span>
	<span data-testid="bind-class-busy" data-wp-class--busy="state.navigating"></span>

	<?php
	/*
	 * The two `hidden` bindings, deliberately opposite
	 * polarities on the same page. `bind-hidden-negated` is
	 * `!state.navigating` -- the spinner shape, visible only while
	 * navigating -- and `bind-hidden-plain` is the un-negated inverse. Do
	 * not "fix" either expression to make a failing assertion pass: a
	 * test written against an inverted expectation goes red against
	 * *correct* code here, and dropping the negation would plant the bug
	 * in the fixture instead of the test. Check polarity against
	 * `getEvaluate`/`bind.ts`'s handling of the `!` prefix and of `hidden`
	 * specifically (`packages/interactivity/src/hooks.tsx:249,283-284` and
	 * `packages/interactivity/src/directives/bind.ts:67-72`), not
	 * intuition.
	 */
	?>
	<span data-testid="bind-hidden-negated" data-wp-bind--hidden="!state.navigating"></span>
	<span data-testid="bind-hidden-plain" data-wp-bind--hidden="state.navigating"></span>

	<?php
	/*
	 * A replica of Core's WP 6.9 loading-bar markup, bound to the
	 * *public* `core/router` store's deprecated `state.navigation` getter --
	 * not the private store WP 7.0 binds instead. `data-wp-interactive` is
	 * repeated here (unlike the plain elements above) because this element
	 * switches namespace away from `router-navigation-lifecycle`, not
	 * because of the region-detection trap noted earlier in this file.
	 */
	?>
	<div
		data-testid="loading-bar"
		data-wp-interactive="core/router"
		data-wp-class--start-animation="state.navigation.hasStarted"
		data-wp-class--finish-animation="state.navigation.hasFinished"
	></div>

	<?php
	/*
	 * A Core-loading-bar equivalent, rebuilt purely from the new
	 * public keys plus a consumer-side 400 ms debounce -- see the bare
	 * `watch()` call in `view.js` that writes `state.showBar`.
	 */
	?>
	<span data-testid="debounced-bar" data-wp-class--show-bar="state.showBar"></span>
</div>
