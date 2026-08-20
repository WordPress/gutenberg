<?php
/**
 * HTML for testing the iAPI's style assets management.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */

add_action(
	'wp_enqueue_scripts',
	function () {
		wp_enqueue_style(
			'wrapper-styles-from-link',
			plugin_dir_url( __FILE__ ) . 'style-from-link.css',
			array()
		);
		wp_enqueue_style(
			'wrapper-styles-media-print',
			plugin_dir_url( __FILE__ ) . 'style-media-print.css',
			array(),
			false,
			'print'
		);
	}
);

/*
 * URL of the style sheet that is injected dynamically from the client. It is
 * not enqueued on purpose, so it is only present in the DOM after the
 * `actions.addDynamicStyles` action runs.
 */
wp_interactivity_state(
	'test/router-styles',
	array( 'dynamicLinkUrl' => plugin_dir_url( __FILE__ ) . 'style-dynamic-link.css' )
);

/*
 * Style sheet loaded asynchronously with the "print trick" that opts out of the
 * router's style management with `data-wp-router-style="ignore"`, so the router
 * never touches it.
 *
 * It is only printed on the pages that contain the navigation links, i.e., the
 * pages the tests start from, so it is absent from every page the router
 * fetches.
 *
 * The markup is printed directly instead of enqueued because
 * `wp_enqueue_style()` cannot output the `onload` attribute. It is printed in
 * `wp_head` so it stays outside of the router regions, which are re-rendered
 * by the vdom.
 */
if ( ! empty( $attributes['links'] ) ) {
	add_action(
		'wp_head',
		function () {
			printf(
				'<link rel="stylesheet" href="%s" media="print" onload="this.onload=null;this.media=\'all\'" data-wp-router-style="ignore">',
				esc_url( plugin_dir_url( __FILE__ ) . 'style-async-ignore.css' )
			);
		}
	);
}

$wrapper_attributes = get_block_wrapper_attributes();
?>
<div <?php echo $wrapper_attributes; ?>>
	<!-- These get colored when the corresponding block is present. -->
	<fieldset>
		<legend>Styles from block styles</legend>
		<p data-testid="red" class="red">Red</p>
		<p data-testid="green" class="green">Green</p>
		<p data-testid="blue" class="blue">Blue</p>
		<p data-testid="all" class="red green blue">All</p>
	</fieldset>

	<!-- These get colored when the corresponding block enqueues a referenced stylesheet. -->
	<fieldset>
		<legend>Styles from referenced style sheets</legend>
		<p data-testid="red-from-link" class="red-from-link">Red from link</p>
		<p data-testid="green-from-link" class="green-from-link">Green from link</p>
		<p data-testid="blue-from-link" class="blue-from-link">Blue from link</p>
		<p data-testid="all-from-link" class="red-from-link green-from-link blue-from-link">All from link</p>
		<div data-testid="background-from-link"class="background-from-link" style="width: 10px; height: 10px"></div>
	</fieldset>

	<!-- These get colored when the corresponding block adds inline style. -->
	<fieldset>
		<legend>Styles from inline styles</legend>
		<p data-testid="red-from-inline" class="red-from-inline">Red</p>
		<p data-testid="green-from-inline" class="green-from-inline">Green</p>
		<p data-testid="blue-from-inline" class="blue-from-inline">Blue</p>
		<p data-testid="all-from-inline" class="red-from-inline green-from-inline blue-from-inline">All</p>
	</fieldset>

	<!-- These get colored when the corresponding block prints a style sheet that is loaded asynchronously. -->
	<fieldset>
		<legend>Styles loaded asynchronously</legend>
		<p data-testid="async-print" class="async-print">Print trick</p>
		<p data-testid="async-data-media" class="async-data-media">Media from data attribute</p>
		<p data-testid="async-preload" class="async-preload">Preload turned into a style sheet</p>
		<p data-testid="async-persist" class="async-persist">Persisted style sheet</p>
		<p data-testid="async-ignore" class="async-ignore">Ignored style sheet</p>
	</fieldset>

	<!-- This one should remain green after navigation. -->
	<fieldset>
		<legend>Rule order checker</legend>
		<p data-testid="order-checker" class="order-checker">I should remain green</p>
	</fieldset>

	<!-- These get colored when styles are injected dynamically from the client. -->
	<fieldset>
		<legend>Dynamically injected styles</legend>
		<p data-testid="dynamic-style" class="dynamic-style">Dynamic style</p>
		<p data-testid="dynamic-link" class="dynamic-link">Dynamic link</p>
		<div data-wp-interactive="test/router-styles">
			<button
				data-testid="add dynamic styles"
				data-wp-on--click="actions.addDynamicStyles"
			>
				Add dynamic styles
			</button>
		</div>
	</fieldset>

	<!-- Links to pages with different blocks combination. -->
	<nav data-wp-interactive="test/router-styles">
		<?php foreach ( $attributes['links'] as $label => $link ) : ?>
			<a
				data-testid="link <?php echo $label; ?>"
				data-wp-on--click="actions.navigate"
				data-wp-on--mouseenter="actions.prefetch"
				href="<?php echo $link; ?>"
			>
				<?php echo $label; ?>
			</a>
		<?php endforeach; ?>
		<?php foreach ( $attributes['links'] as $label => $link ) : ?>
			<a
				data-testid="force link <?php echo $label; ?>"
				data-wp-on--click="actions.navigateForce"
				href="<?php echo $link; ?>"
			>
				<?php echo $label; ?> (force)
			</a>
		<?php endforeach; ?>
	</nav>

	<!-- HTML updated on navigation. -->
	<div
		data-wp-interactive="test/router-styles"
		data-wp-router-region="router-styles"
	>
		<?php echo $content; ?>
	</div>

	<!-- Flag to check whether hydration has occurred. -->
	<div
		data-testid="hydrated"
		data-wp-interactive="test/router-styles"
		data-wp-bind--hidden="!state.hydrated"
		data-wp-init="callbacks.setHydrated"
		hidden
	>
		Hydrated
	</div>

	<!-- Text to check whether a navigation was client-side. -->
	<div
		data-testid="client-side navigation"
		data-wp-interactive="test/router-styles"
		data-wp-bind--hidden="!state.clientSideNavigation"
		hidden
	>
		Client-side navigation
	</div>

	<!-- Text to check whether a page is being prefetched. -->
	<div data-wp-interactive="test/router-styles" >
		Prefetching: <span data-testid="prefetching" data-wp-text="state.prefetching"></span>
	</div>

	<!-- Text hidden when media=print applies. -->
	<div class="hide-on-print" data-testid="hide-on-print">This should be visible when media is not "print".</div>

	<!-- Element for testing noscript styles being ignored -->
	<div data-testid="noscript-style-test" class="noscript-style-test">This should not be affected by styles in noscript tags</div>

	<!-- Noscript styles that should be ignored -->
	<noscript>
		<style>
			.noscript-style-test {
				color: rgb(255, 0, 0) !important;
			}
		</style>
	</noscript>
</div>
