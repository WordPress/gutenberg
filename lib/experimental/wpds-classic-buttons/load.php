<?php
/**
 * WPDS classic buttons experiment — enqueues the token-based button stylesheet
 * over Core's classic `buttons` styles in wp-admin.
 *
 * Gated by the `gutenberg-wpds-classic-buttons` experiment (see
 * lib/experimental/experiments/load.php and the conditional require in
 * lib/load.php). When the experiment is off, this file is never loaded and
 * nothing changes.
 *
 * @package gutenberg
 */

/**
 * Swaps classic button styling for the token-based regeneration on classic
 * admin screens.
 *
 * Mechanism — override, not a wholesale dequeue. Core registers `buttons` as a
 * hard dependency of the `colors` handle (see wp_default_styles() in Core's
 * script-loader.php), so `wp_dequeue_style( 'buttons' )` alone cannot remove it:
 * the dependency resolver re-adds it for `colors`. Instead we enqueue the
 * generated stylesheet with `buttons` and `colors` as dependencies, so it prints
 * last and its declarations win by source order (identical selectors, no
 * `!important` escalation beyond what Core already uses). A genuine wholesale
 * dequeue would require a Core change to break that dependency — recorded as a
 * roadmap item, not attempted from the plugin.
 *
 * The `buttons` handle is also shared with login, install, media and the classic
 * editor. `admin_enqueue_scripts` only fires in wp-admin, so this swap is scoped
 * there and never touches the login screen or the front end.
 */
function gutenberg_wpds_classic_buttons_enqueue() {
	$base_url = gutenberg_url( 'lib/experimental/wpds-classic-buttons/' );
	$version  = defined( 'GUTENBERG_VERSION' ) && ! SCRIPT_DEBUG ? GUTENBERG_VERSION : time();

	// 1. Make the WPDS tokens (`--wpds-*`) resolvable in classic admin.
	//    Core registers the token stylesheet as `wp-theme` (Trac #65646) but does
	//    not list it as a dependency of `wp-admin`, so classic pages do not load
	//    it. Prefer that handle when the running Core is new enough; otherwise
	//    fall back to the plugin's own prebuilt copy. Either way, the generated
	//    declarations also carry static fallbacks, so buttons render correctly
	//    even if neither is present.
	$token_deps = array();
	if ( wp_style_is( 'wp-theme', 'registered' ) ) {
		wp_enqueue_style( 'wp-theme' );
		$token_deps[] = 'wp-theme';
	} else {
		wp_enqueue_style(
			'gutenberg-wpds-tokens',
			gutenberg_url( 'packages/theme/prebuilt/css/design-tokens.css' ),
			array(),
			$version
		);
		$token_deps[] = 'gutenberg-wpds-tokens';
	}

	// 2. Best-effort dequeue of the classic handle (effective only where it was
	//    enqueued standalone rather than pulled in as a `colors` dependency).
	wp_dequeue_style( 'buttons' );

	// 3. Enqueue the token-based regeneration, ordered after `buttons`/`colors`
	//    so it reliably overrides them.
	wp_enqueue_style(
		'gutenberg-wpds-classic-buttons',
		$base_url . 'buttons.css',
		array_merge( array( 'buttons', 'colors' ), $token_deps ),
		$version
	);
}
add_action( 'admin_enqueue_scripts', 'gutenberg_wpds_classic_buttons_enqueue', 20 );
