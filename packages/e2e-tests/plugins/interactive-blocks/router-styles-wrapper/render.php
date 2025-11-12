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

	<!-- This one should remain green after navigation. -->
	<fieldset>
		<legend>Rule order checker</legend>
		<p data-testid="order-checker" class="order-checker">I should remain green</p>
	</fieldset>

	<!-- Links to pages with different blocks combination. -->
	<nav data-wp-interactive="test/router-styles">
		<?php foreach ( $attributes['links'] as $label => $link ) : ?>
			<a
				data-testid="link <?php echo $label; ?>"
				data-wp-on--click="actions.navigate"
				data-wp-on-async--mouseenter="actions.prefetch"
				href="<?php echo $link; ?>"
			>
				<?php echo $label; ?>
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
		data-wp-bind--hidden="state.undefined"
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
