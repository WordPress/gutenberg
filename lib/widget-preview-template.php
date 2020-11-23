<?php
/**
 * Start: Include for phase 2
 * Template used to render widget previews.
 *
 * @package gutenberg
 * @since 5.4.0
 */

if ( ! function_exists( 'wp_head' ) ) {
	exit;
}
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="profile" href="https://gmpg.org/xfn/11" />
	<?php wp_head(); ?>
	<style>
		/* Reset theme styles */
		html, body, #page, #content {
			background: #FFF !important;
			padding: 0 !important;
			margin: 0 !important;
		}
	</style>
</head>

<body <?php body_class(); ?>>
<div id="page" class="site">
	<div id="content" class="site-content">
		<?php
		$registry = WP_Block_Type_Registry::get_instance();
		$block    = $registry->get_registered( 'core/legacy-widget' );
		echo $block->render( $_GET['widget-preview'] );
		?>
	</div><!-- #content -->
</div><!-- #page -->

<?php wp_footer(); ?>
</body>
</html>
