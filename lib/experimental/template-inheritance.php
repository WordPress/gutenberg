<?php
/**
 * Template inheritance experiment.
 *
 * Lets a block template have a parent template, the way a page or post has a
 * template. On the front end the parent template renders as normal, and the
 * child template renders in place of the first Content block
 * (`core/post-content`) in the parent. Chains are supported, so a single post
 * template can sit inside a blog layout that sits inside a site shell.
 *
 * The parent is stored as post meta on the `wp_template` post and exposed in
 * the REST API as `parent_template`, holding the parent template's slug.
 * Themes can declare parents for their own template files with the
 * `gutenberg_template_parent` filter.
 *
 * @package gutenberg
 */

/**
 * The meta key that stores a template's parent template slug.
 */
const GUTENBERG_TEMPLATE_PARENT_META_KEY = '_wp_template_parent';

/**
 * The deepest a chain of parent templates may go, as a guard against
 * runaway chains.
 */
const GUTENBERG_TEMPLATE_INHERITANCE_MAX_DEPTH = 10;

/**
 * Returns the slug of a template's parent template.
 *
 * @param WP_Block_Template $template The template.
 * @return string The parent template slug, or an empty string if it has none.
 */
function gutenberg_get_template_parent( $template ) {
	$parent = '';

	if ( ! empty( $template->wp_id ) ) {
		$stored = get_post_meta( $template->wp_id, GUTENBERG_TEMPLATE_PARENT_META_KEY, true );
		if ( is_string( $stored ) ) {
			$parent = $stored;
		}
	}

	/**
	 * Filters the parent of a block template.
	 *
	 * Themes can use this to give their template files a parent template
	 * without the user having to customize them first.
	 *
	 * @param string            $parent   The parent template slug, or an empty string.
	 * @param WP_Block_Template $template The template.
	 */
	$parent = apply_filters( 'gutenberg_template_parent', $parent, $template );

	if ( ! is_string( $parent ) || $parent === $template->slug ) {
		return '';
	}

	return $parent;
}

/**
 * Returns the chain of ancestor templates for a template, closest first.
 *
 * The chain stops at the first parent that does not exist, does not contain
 * a Content block to render its child into, or would create a cycle.
 *
 * @param WP_Block_Template $template The template.
 * @return WP_Block_Template[] The ancestor templates, closest first.
 */
function gutenberg_get_template_ancestors( $template ) {
	$ancestors = array();
	$seen      = array( $template->slug => true );
	$current   = $template;

	while ( count( $ancestors ) < GUTENBERG_TEMPLATE_INHERITANCE_MAX_DEPTH ) {
		$parent_slug = gutenberg_get_template_parent( $current );
		if ( '' === $parent_slug || isset( $seen[ $parent_slug ] ) ) {
			break;
		}

		$parent = get_block_template( get_stylesheet() . '//' . $parent_slug, 'wp_template' );
		if ( ! $parent || empty( $parent->content ) || ! has_block( 'core/post-content', $parent->content ) ) {
			break;
		}

		$ancestors[]          = $parent;
		$seen[ $parent_slug ] = true;
		$current              = $parent;
	}

	return $ancestors;
}

/**
 * Exposes a template's parent in the REST API as `parent_template`.
 */
function gutenberg_register_template_parent_rest_field() {
	register_rest_field(
		'wp_template',
		'parent_template',
		array(
			'get_callback'    => static function ( $data ) {
				if ( empty( $data['id'] ) ) {
					return '';
				}
				$template = get_block_template( $data['id'], 'wp_template' );
				return $template ? gutenberg_get_template_parent( $template ) : '';
			},
			'update_callback' => 'gutenberg_update_template_parent',
			'schema'          => array(
				'description' => __( 'Slug of the template this template renders inside.', 'gutenberg' ),
				'type'        => 'string',
				'context'     => array( 'view', 'edit' ),
				'arg_options' => array(
					'sanitize_callback' => 'sanitize_title',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_template_parent_rest_field' );

/**
 * Saves a template's parent from a REST request.
 *
 * @param string            $value    The parent template slug, or an empty string to remove it.
 * @param WP_Block_Template $template The template being updated.
 * @return true|WP_Error True on success, or an error if the parent is not allowed.
 */
function gutenberg_update_template_parent( $value, $template ) {
	if ( ! $template instanceof WP_Block_Template || empty( $template->wp_id ) ) {
		return new WP_Error(
			'rest_template_parent_not_saved',
			__( 'The parent template could not be saved.', 'gutenberg' ),
			array( 'status' => 500 )
		);
	}

	$value = (string) $value;

	if ( '' === $value ) {
		delete_post_meta( $template->wp_id, GUTENBERG_TEMPLATE_PARENT_META_KEY );
		return true;
	}

	if ( $value === $template->slug ) {
		return new WP_Error(
			'rest_template_parent_invalid',
			__( 'A template can’t be its own parent.', 'gutenberg' ),
			array( 'status' => 400 )
		);
	}

	$parent = get_block_template( get_stylesheet() . '//' . $value, 'wp_template' );
	if ( ! $parent ) {
		return new WP_Error(
			'rest_template_parent_invalid',
			__( 'The parent template doesn’t exist.', 'gutenberg' ),
			array( 'status' => 400 )
		);
	}

	foreach ( gutenberg_get_template_ancestors( $parent ) as $ancestor ) {
		if ( $ancestor->slug === $template->slug ) {
			return new WP_Error(
				'rest_template_parent_invalid',
				__( 'That parent template already renders inside this one.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}
	}

	update_post_meta( $template->wp_id, GUTENBERG_TEMPLATE_PARENT_META_KEY, $value );
	return true;
}

/**
 * Child template markup waiting to render into a Content block, outermost
 * first. Filled when the template loader resolves a template that has
 * parents, and emptied as each Content block slot renders.
 *
 * @global string[] $gutenberg_template_inheritance_slots
 */
$GLOBALS['gutenberg_template_inheritance_slots'] = array();

/**
 * Swaps the resolved block template for the outermost template in its chain
 * of parents, and queues each child template to render into its parent's
 * Content block.
 *
 * Runs on `template_include`, after `locate_block_template()` has set the
 * template content and before the template canvas renders it.
 *
 * @global string   $_wp_current_template_id
 * @global string   $_wp_current_template_content
 * @global string[] $gutenberg_template_inheritance_slots
 *
 * @param string $template The path of the template to include.
 * @return string The path of the template to include, unchanged.
 */
function gutenberg_template_inheritance_compose( $template ) {
	global $_wp_current_template_id, $_wp_current_template_content, $gutenberg_template_inheritance_slots;

	if ( empty( $_wp_current_template_id ) || empty( $_wp_current_template_content ) ) {
		return $template;
	}

	$current = get_block_template( $_wp_current_template_id, 'wp_template' );
	if ( ! $current ) {
		return $template;
	}

	$slots   = array();
	$content = $_wp_current_template_content;
	foreach ( gutenberg_get_template_ancestors( $current ) as $ancestor ) {
		array_unshift( $slots, $content );
		$content = $ancestor->content;
	}

	if ( $slots ) {
		$gutenberg_template_inheritance_slots = $slots;
		$_wp_current_template_content         = $content;
	}

	return $template;
}
add_filter( 'template_include', 'gutenberg_template_inheritance_compose', 20 );

/**
 * Rendered child templates waiting to replace their Content block's
 * placeholder, keyed by placeholder.
 *
 * @global string[] $gutenberg_template_inheritance_rendered
 */
$GLOBALS['gutenberg_template_inheritance_rendered'] = array();

/**
 * Makes the Content block render the next queued child template, when there
 * is one, instead of the post content.
 *
 * The child template takes the Content block's place with no wrapper, so its
 * markup lands exactly as it would if it were written into the parent. The
 * Content block's own settings, such as its tag name and styles, don't apply
 * to a child template. Block supports run on what a render callback returns,
 * so the callback returns a placeholder, and the child replaces it once they
 * have run. See `gutenberg_template_inheritance_replace_placeholder()`.
 *
 * @param array  $args       The block type registration arguments.
 * @param string $block_name The block type name.
 * @return array The block type registration arguments.
 */
function gutenberg_template_inheritance_post_content_args( $args, $block_name ) {
	if ( 'core/post-content' !== $block_name || empty( $args['render_callback'] ) ) {
		return $args;
	}

	$render_post_content     = $args['render_callback'];
	$args['render_callback'] = static function ( $attributes, $content, $block ) use ( $render_post_content ) {
		global $gutenberg_template_inheritance_slots, $gutenberg_template_inheritance_rendered;
		static $slot_count = 0;

		// A Content block inside a Query Loop always shows the post's content.
		if ( empty( $gutenberg_template_inheritance_slots ) || isset( $block->context['queryId'] ) ) {
			return call_user_func( $render_post_content, $attributes, $content, $block );
		}

		$child_template = array_shift( $gutenberg_template_inheritance_slots );
		$placeholder    = '{{gutenberg-template-slot-' . ++$slot_count . '}}';

		$gutenberg_template_inheritance_rendered[ $placeholder ] = do_blocks( do_shortcode( $child_template ) );

		return $placeholder;
	};

	return $args;
}
add_filter( 'register_block_type_args', 'gutenberg_template_inheritance_post_content_args', 20, 2 );

/**
 * Swaps a Content block's placeholder for the child template rendered into
 * it, after block supports have run.
 *
 * @global string[] $gutenberg_template_inheritance_rendered
 *
 * @param string $block_content The rendered block content.
 * @return string The rendered child template, or the block content unchanged.
 */
function gutenberg_template_inheritance_replace_placeholder( $block_content ) {
	global $gutenberg_template_inheritance_rendered;

	if ( isset( $gutenberg_template_inheritance_rendered[ $block_content ] ) ) {
		$child_html = $gutenberg_template_inheritance_rendered[ $block_content ];
		unset( $gutenberg_template_inheritance_rendered[ $block_content ] );
		return $child_html;
	}

	return $block_content;
}
add_filter( 'render_block_core/post-content', 'gutenberg_template_inheritance_replace_placeholder', PHP_INT_MAX );

/*
 * Registers a child theme of Twenty Twenty-Five whose templates inherit from
 * its Index template, so the experiment can be tried without building a
 * theme. Temporary, for testing: remove before this experiment merges.
 */
register_theme_directory( __DIR__ . '/template-inheritance-themes' );
