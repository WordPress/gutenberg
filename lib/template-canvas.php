<?php
/**
 * Template canvas file to render the current 'wp_template'.
 *
 * @package gutenberg
 */

?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<?php gutenberg_render_the_template(); ?>

<?php wp_footer(); ?>
</body>
</html>
