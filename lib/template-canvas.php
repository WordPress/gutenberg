<?php
/**
 * Template canvas file to render the current 'wp_template'.
 *
 * @package gutenberg
 */

/**
 * Get the template HTML.
 * This needs to run before <head> so that blocks can add scripts and styles in wp_head().
 */
$template_html = gutenberg_get_the_template_html();
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<?php echo $template_html; // phpcs:ignore WordPress.Security.EscapeOutput ?>

<?php wp_footer(); ?>
</body>
</html>
