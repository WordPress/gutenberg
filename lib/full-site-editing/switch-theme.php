<?php
/**
 * Theme switcher.
 *
 * @package gutenberg
 */

class WP_Switch_Theme_Page
{
	private $title;

	private $themes;

	private $theme_slugs;

	public function __construct() {
		add_action( 'init', array( $this, 'init' ) );
		add_action( 'admin_menu', array( $this, 'menu' ) );
	}

	public function init() {
		if ( ! gutenberg_is_fse_theme() ) {
			return;
		}

		$this->themes = array();
		$current = wp_get_theme()->get_stylesheet();

		foreach ( wp_get_themes() as $theme ) {
			if ( is_readable( $theme->stylesheet_dir . '/block-templates/index.html' ) && $theme->stylesheet !== $current ) {
				$this->themes[] = $theme;
				$this->theme_slugs[] = $theme->stylesheet;
			}
		}

		$this->title = __( 'Switch Theme', 'gutenberg' );
	}

	public function callback() {
		if ( ! gutenberg_is_fse_theme() || ! current_user_can( 'switch_themes' ) ) {
			return;
		}

		echo '<div class="wrap">';
		echo '<h2>' . $this->title . '</h2>';
		echo '<form method="post" action="">';

		if ( isset( $_POST['switch_theme_2'] ) && in_array( $_POST['switch_theme_2'], $this->theme_slugs ) ) {
			
			$keep_templates = array();
			$keep_template_parts = array();

			foreach ( $_POST as $key => $value ) {

				if ( $value && strpos( $key, 'keep_template_' ) === 0 ) {
					$keep_templates[] = substr( $key, 14 );
				}
				if ( $value && strpos( $key, 'keep_template-part_' ) === 0 ) {
					$keep_template_parts[] = substr( $key, 19 );
				}
			}

			foreach ( $keep_templates as $template ) {
				$template = gutenberg_get_block_template( $template, 'wp_template');

				foreach ( parse_blocks( $template->content ) as $block ) {
					if ( 'core/template-part' === $block['blockName'] && ! empty( $block['attrs']['slug'] ) && ! in_array( $block['attrs']['slug'], $keep_template_parts ) ) {
						$keep_template_parts[] = $block['attrs']['slug'];
					}
				}

				if ( $template->wp_id ) {
					wp_set_post_terms( $template->wp_id, esc_sql( $_POST['switch_theme_2'] ), 'wp_theme', true );
				}
			}

			foreach ( $keep_template_parts as $template_part ) {
				$template_part = gutenberg_get_block_template( $template_part, 'wp_template_part');

				if ( $template_part->wp_id ) {
					wp_set_post_terms( $template_part->wp_id, esc_sql( $_POST['switch_theme_2'] ), 'wp_theme', true );
				}
			}

			// Temporary
			echo '<p>Done. Now activating new theme...</p>';

		} else if ( isset( $_POST['switch_theme'] ) && in_array( $_POST['switch_theme'], $this->theme_slugs ) ) {
			echo '<p>' . __( 'Next, select which templates and template parts to keep from your current theme.', 'gutenberg' ) . '</p>';
			echo '<p>' . __( 'Templates:', 'gutenberg' ) . '</p>';

			foreach ( gutenberg_get_block_templates( array(), 'wp_template' ) as $template ) {
				printf( '<input type="checkbox" id="keep_template_%1$s" name="keep_template_%1$s"><label for="keep_template_%1$s">%2$s</label><br>', $template->id, $template->title );
			}

			echo '<p>' . __( 'Template Parts:', 'gutenberg' ) . '</p>';

			foreach ( gutenberg_get_block_templates( array(), 'wp_template_part' ) as $template_part ) {
				printf( '<input type="checkbox" id="keep_template-part_%1$s" name="keep_template-part_%1$s"><label for="keep_template-part_%1$s">%2$s</label><br>', $template_part->id, $template_part->title );
			}

			printf( '<input type="hidden" name="switch_theme_2" value="%s">', esc_attr( $_POST['switch_theme'] ) );
			
		} else {
			echo '<p>' . __( 'First, select another full site editing theme to switch to.', 'gutenberg' ) . '</p>';

			foreach ( $this->themes as $theme ) {
				printf( '<input type="radio" id="%1$s" name="switch_theme" value="%1$s"><label for="%1$s">%2$s</label><br>', $theme->stylesheet, $theme->name );
			}
		}

		submit_button();
		echo '</form></div>';
	}

	public function menu() {
		if ( ! gutenberg_is_fse_theme() ) {
			return;
		}
		
		add_submenu_page( 'themes.php', $this->title, $this->title, 'switch_themes', 'gutenberg_switch_theme', array( $this, 'callback' ) );
	}
}
new WP_Switch_Theme_Page();