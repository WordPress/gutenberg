<?php
/**
 * Renders a template inside the template assigned to it.
 *
 * A template can name another template to render inside, the way a page names
 * the template it is rendered inside. The parent's `core/template-slot` block
 * is where: the child template's blocks are rendered in it, in place of what
 * the slot holds for the parent's own requests, so a template only carries
 * what is particular to it and the header, the footer and whatever else
 * surrounds it live in one place.
 *
 * A theme names the template each of its templates is rendered inside in the
 * `templates` section of its `theme.json`, so a theme works that way on
 * activation with nothing to set up.
 *
 * A site overrides what the theme names, including rendering a template on its
 * own, from the editor. The choice is stored in the `_wp_template_parent` post
 * meta of the template's own post, and exposed as the `template` REST field,
 * like the one on a post. The meta is `default` when the site renders the
 * template on its own, and absent when the site has made no choice and the
 * theme's one stands.
 *
 * Behind the `gutenberg-template-inheritance` experiment, which is what loads
 * this file, while the product questions this opens are settled: named slots,
 * what a theme may declare, and whether templates may nest more than one level.
 *
 * @package gutenberg
 */

/**
 * The block a template renders the templates inside it in.
 */
const GUTENBERG_TEMPLATE_SLOT_BLOCK = 'core/template-slot';

/**
 * The post meta storing the template a template is rendered inside.
 *
 * A key of its own rather than the `_wp_page_template` a post names its
 * template with, so that what a site stores while trying the experiment can be
 * renamed or cleaned up, and core is free to give that key a meaning of its own
 * for templates.
 */
const GUTENBERG_TEMPLATE_PARENT_META_KEY = '_wp_template_parent';

/**
 * Parses the blocks of a template, with its patterns resolved.
 *
 * Themes build templates out of pattern references, so the slot can be in a
 * pattern rather than in the template itself. Resolving them first finds it
 * there, the way the editor does once it has loaded the patterns.
 *
 * @access private
 *
 * @param string $content Serialized blocks of the template.
 * @return array Parsed blocks, with every `core/pattern` block replaced by its blocks.
 */
function gutenberg_parse_block_template_blocks( $content ) {
	return resolve_pattern_blocks( parse_blocks( (string) $content ) );
}

/**
 * Returns whether a template has a `core/template-slot` block to render a
 * template inside.
 *
 * @param string $content Serialized blocks of the template.
 * @return bool Whether it has a slot.
 */
function gutenberg_block_template_has_slot( $content ) {
	return gutenberg_blocks_have_template_slot( gutenberg_parse_block_template_blocks( $content ) );
}

/**
 * Returns whether a list of parsed blocks holds a `core/template-slot` block.
 *
 * @access private
 *
 * @param array $blocks Parsed blocks to search.
 * @return bool Whether one of them, at any depth, is the slot.
 */
function gutenberg_blocks_have_template_slot( $blocks ) {
	foreach ( $blocks as $block ) {
		if ( GUTENBERG_TEMPLATE_SLOT_BLOCK === $block['blockName'] ) {
			return true;
		}

		if ( ! empty( $block['innerBlocks'] ) && gutenberg_blocks_have_template_slot( $block['innerBlocks'] ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Remembers the templates read while answering the request, and returns them.
 *
 * `locate_block_template()` reads the candidates of the template hierarchy to
 * settle on one, so the template of the request, and often the template it is
 * rendered inside, are already in hand by the time this runs. Reading them
 * again would be a database query apiece on every front end request, including
 * the requests of the sites using no template inside another.
 *
 * @access private
 *
 * @param WP_Block_Template[]|null $templates Templates to remember, or `null` to only read them.
 * @param bool                     $reset     Whether to forget the templates remembered so far first.
 * @return array<string, WP_Block_Template> The templates read so far, keyed by id.
 */
function gutenberg_block_templates_read( $templates = null, $reset = false ) {
	static $read = array();

	if ( $reset ) {
		$read = array();
	}

	foreach ( (array) $templates as $template ) {
		/*
		 * Core applies the filter the memo is filled from for template parts
		 * as well, and a template part can have the same slug as a template,
		 * so the same id. Only templates are remembered, so that a part never
		 * stands in for the template a template is rendered inside.
		 */
		if ( $template instanceof WP_Block_Template && 'wp_template' === $template->type ) {
			$read[ $template->id ] = $template;
		}
	}

	return $read;
}

/**
 * Forgets the templates remembered for the request when one of them changes.
 *
 * Saving a template, reverting it to the one of the theme, or deleting it all
 * clean its post cache, so a request that goes on to render a template reads
 * the template as it now is rather than as it was.
 *
 * @access private
 *
 * @param int     $post_id ID of the post whose cache was cleaned.
 * @param WP_Post $post    The post whose cache was cleaned.
 */
function gutenberg_forget_block_templates_read( $post_id, $post ) {
	if ( 'wp_template' === $post->post_type ) {
		gutenberg_block_templates_read( null, true );
	}
}
add_action( 'clean_post_cache', 'gutenberg_forget_block_templates_read', 10, 2 );

/**
 * Remembers the templates of a `get_block_templates()` call.
 *
 * @access private
 *
 * @param WP_Block_Template[] $templates The templates the call answers.
 * @return WP_Block_Template[] The templates, unchanged.
 */
function gutenberg_remember_block_templates_read( $templates ) {
	gutenberg_block_templates_read( $templates );

	return $templates;
}
add_filter( 'get_block_templates', 'gutenberg_remember_block_templates_read' );

/**
 * Returns a template by id, from the ones read while answering the request
 * when it is among them.
 *
 * @access private
 *
 * @param string $template_id ID of the template, as `theme//slug`.
 * @return WP_Block_Template|null The template, or `null` when there is none with that id.
 */
function gutenberg_get_block_template_read( $template_id ) {
	$read = gutenberg_block_templates_read();

	return $read[ $template_id ] ?? get_block_template( $template_id, 'wp_template' );
}

/**
 * Returns the slug of the template the active theme renders a template inside.
 *
 * @param string $template_slug Slug of the template, the name of its file.
 * @return string Slug of the template the theme renders it inside, or an empty string when it names none.
 */
function gutenberg_get_theme_block_template_parent_slug( $template_slug ) {
	$templates = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_templates();

	return $templates[ $template_slug ]['template'] ?? '';
}

/**
 * Returns the slug of the template a template is rendered inside.
 *
 * The site's own choice, stored on the template's post, stands for the one the
 * theme names, including when the site renders the template on its own.
 *
 * @param WP_Block_Template|null $template Template to read the assignment from.
 * @return string Slug of the template it is rendered inside, or an empty string when it is rendered on its own.
 */
function gutenberg_get_block_template_parent_slug( $template ) {
	if ( ! $template instanceof WP_Block_Template ) {
		return '';
	}

	if ( ! empty( $template->wp_id ) ) {
		$slug = get_post_meta( $template->wp_id, GUTENBERG_TEMPLATE_PARENT_META_KEY, true );

		// The meta is absent, so the site has made no choice and the one the
		// theme names stands.
		if ( is_string( $slug ) && '' !== $slug ) {
			return 'default' === $slug ? '' : $slug;
		}
	}

	// Only the active theme has a `theme.json` to read.
	if ( get_stylesheet() !== $template->theme ) {
		return '';
	}

	return gutenberg_get_theme_block_template_parent_slug( $template->slug );
}

/**
 * Puts blocks inside the `core/template-slot` block of a template.
 *
 * Walks the tree in document order, with the template's patterns resolved, and
 * uses the first slot it reaches, at whatever depth, keeping the blocks that
 * surround it. A template can hold more than one: the first is its slot, here
 * and in the editor, and any other keeps what it holds.
 *
 * @param string $parent_content Serialized blocks of the template to substitute into.
 * @param string $child_content  Serialized blocks to put in the slot.
 * @return string|null The combined blocks, or `null` when the template has no slot.
 */
function gutenberg_substitute_template_slot( $parent_content, $child_content ) {
	$parent_blocks = gutenberg_parse_block_template_blocks( $parent_content );

	/*
	 * The top level of a template is a list of blocks rather than one block, so
	 * it is searched as the inner blocks of a block that is never serialized.
	 * Only the slot block itself changes shape, so no `innerContent` above it
	 * is rewritten, and this one is never read.
	 */
	$result = gutenberg_substitute_template_slot_in_block(
		array(
			'blockName'    => null,
			'attrs'        => array(),
			'innerBlocks'  => $parent_blocks,
			'innerHTML'    => '',
			'innerContent' => array_fill( 0, count( $parent_blocks ), null ),
		),
		parse_blocks( $child_content )
	);

	if ( null === $result ) {
		return null;
	}

	return serialize_blocks( $result['innerBlocks'] );
}

/**
 * Puts blocks inside the first `core/template-slot` block among a block's descendants.
 *
 * @access private
 *
 * @param array $block        Parsed block to search.
 * @param array $child_blocks Parsed blocks to put in the slot.
 * @return array|null The block with the blocks in its slot, or `null` when it has no slot among its descendants.
 */
function gutenberg_substitute_template_slot_in_block( $block, $child_blocks ) {
	foreach ( $block['innerBlocks'] as $index => $inner_block ) {
		if ( GUTENBERG_TEMPLATE_SLOT_BLOCK === $inner_block['blockName'] ) {
			$block['innerBlocks'][ $index ] = gutenberg_fill_template_slot( $inner_block, $child_blocks );

			return $block;
		}

		if ( empty( $inner_block['innerBlocks'] ) ) {
			continue;
		}

		$substituted = gutenberg_substitute_template_slot_in_block( $inner_block, $child_blocks );
		if ( null !== $substituted ) {
			// Only the block holding the slot changes shape, so the
			// `innerContent` of everything above it still lines up.
			$block['innerBlocks'][ $index ] = $substituted;

			return $block;
		}
	}

	return null;
}

/**
 * Makes the slot of a template hold the blocks of the template rendered inside it.
 *
 * The blocks take the place of what the slot holds for the template's own
 * requests. The slot block stays where it is, so that it still renders its
 * wrapper: its layout, its alignment and the rest of its block supports apply
 * to the template rendered inside it, as they do in the editor.
 *
 * @access private
 *
 * @param array $slot         The parsed `core/template-slot` block.
 * @param array $child_blocks Parsed blocks to put in it.
 * @return array The slot block, holding the blocks.
 */
function gutenberg_fill_template_slot( $slot, $child_blocks ) {
	$slot['innerBlocks'] = $child_blocks;
	$slot['innerHTML']   = '';
	// `serialize_block()` reads one inner block for every `null`, and
	// `WP_Block::render()` renders one for every `null` in turn.
	$slot['innerContent'] = array_fill( 0, count( $child_blocks ), null );

	return $slot;
}

/**
 * Renders a template inside the template assigned to it.
 *
 * Only one level: a template is rendered inside the template it names, and the
 * template it names is not rendered inside another in turn, even when it names
 * one for its own requests. That is all the editor shows around a template, so
 * the front end matches the canvas, and it leaves no loop to guard against
 * beyond a template naming itself.
 *
 * Renders the template on its own when it names no template, names itself,
 * names one that is not there or is empty, or names one with no
 * `core/template-slot` block to render it in.
 *
 * @param string $template_id ID of the template being rendered, as `theme//slug`.
 * @param string $content     Serialized blocks of the template being rendered.
 * @return string|null The template rendered inside the one it names, or `null` when it is rendered on its own.
 */
function gutenberg_resolve_block_template_parents( $template_id, $content ) {
	$template = gutenberg_get_block_template_read( $template_id );
	if ( ! $template ) {
		return null;
	}

	$parent_slug = gutenberg_get_block_template_parent_slug( $template );
	if ( '' === $parent_slug ) {
		return null;
	}

	$parent_id = $template->theme . '//' . $parent_slug;
	if ( $parent_id === $template_id ) {
		return null;
	}

	$parent = gutenberg_get_block_template_read( $parent_id );
	if ( ! $parent || '' === trim( (string) $parent->content ) ) {
		return null;
	}

	return gutenberg_substitute_template_slot( $parent->content, $content );
}

/**
 * Renders the template of the current request inside the template assigned to it.
 *
 * Runs on `template_include`, after `locate_block_template()` has settled on a
 * template and put its content in the global the template canvas renders.
 *
 * @param string $template Path to the template to include.
 * @return string The path, unchanged.
 */
function gutenberg_render_block_template_inside_parent( $template ) {
	global $_wp_current_template_content, $_wp_current_template_id;

	if ( empty( $_wp_current_template_id ) ) {
		return $template;
	}

	/*
	 * A template with no blocks of its own is still rendered inside the
	 * template it names: that is where its header and its footer are, and the
	 * slot renders as empty the way the content block of an empty post does.
	 */
	$resolved = gutenberg_resolve_block_template_parents( $_wp_current_template_id, (string) $_wp_current_template_content );
	if ( null !== $resolved ) {
		$_wp_current_template_content = $resolved;
	}

	return $template;
}
add_filter( 'template_include', 'gutenberg_render_block_template_inside_parent' );

/**
 * Reads the template a template is rendered inside for a REST response.
 *
 * @access private
 *
 * @param array $item Prepared template response.
 * @return string Slug of the template it is rendered inside, or an empty string when it is rendered on its own.
 */
function gutenberg_get_block_template_parent_field( $item ) {
	if ( ! isset( $item['id'] ) ) {
		return '';
	}

	return gutenberg_get_block_template_parent_slug( gutenberg_get_block_template_read( $item['id'] ) );
}

/**
 * Stores the template a template is rendered inside from a REST request.
 *
 * @access private
 *
 * @param string            $value    Slug of the template to render it inside, or an empty string to render it on its own.
 * @param WP_Block_Template $template Template being written to.
 * @return true|WP_Error True on success, or a `WP_Error` when the template has no post to store it on.
 */
function gutenberg_update_block_template_parent_field( $value, $template ) {
	if ( empty( $template->wp_id ) ) {
		return new WP_Error(
			'rest_template_parent_not_stored',
			__( 'The template could not be saved, so the template to render it inside was not stored.', 'gutenberg' ),
			array( 'status' => 500 )
		);
	}

	/*
	 * `default` rather than an empty string, so that a site rendering a
	 * template on its own is told apart from one that has made no choice and
	 * takes the template its theme names.
	 */
	update_post_meta( $template->wp_id, GUTENBERG_TEMPLATE_PARENT_META_KEY, '' === $value ? 'default' : $value );

	return true;
}

/**
 * Reads whether a template can render a template inside, for a REST response.
 *
 * @access private
 *
 * @param array $item Prepared template response.
 * @return bool Whether the template has a `core/template-slot` block to render a template inside.
 */
function gutenberg_get_block_template_has_template_slot_field( $item ) {
	if ( isset( $item['content']['raw'] ) ) {
		return gutenberg_block_template_has_slot( $item['content']['raw'] );
	}

	// The content belongs to the `edit` context, so a response that leaves it
	// out is answered from the template itself, as read for the request rather
	// than read again for every template of a collection.
	if ( isset( $item['id'] ) ) {
		$template = gutenberg_get_block_template_read( $item['id'] );

		return $template ? gutenberg_block_template_has_slot( $template->content ) : false;
	}

	return false;
}

/**
 * Exposes the template a template is rendered inside in the REST API, and
 * whether it can render one inside itself.
 *
 * The assignment is named `template` to match the field a post carries for the
 * same purpose.
 */
function gutenberg_register_block_template_parent_field() {
	register_rest_field(
		'wp_template',
		'template',
		array(
			'get_callback'    => 'gutenberg_get_block_template_parent_field',
			'update_callback' => 'gutenberg_update_block_template_parent_field',
			'schema'          => array(
				'description' => __( 'The slug of the template this template is rendered inside of.', 'gutenberg' ),
				'type'        => 'string',
				'context'     => array( 'embed', 'view', 'edit' ),
				'arg_options' => array(
					'sanitize_callback' => 'sanitize_text_field',
				),
			),
		)
	);

	register_rest_field(
		'wp_template',
		'has_template_slot',
		array(
			'get_callback' => 'gutenberg_get_block_template_has_template_slot_field',
			'schema'       => array(
				'description' => __( 'Whether the template has a template slot block to render another template inside of.', 'gutenberg' ),
				'type'        => 'boolean',
				'context'     => array( 'embed', 'view', 'edit' ),
				'readonly'    => true,
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_block_template_parent_field' );

/**
 * Registers the field naming the template a template is rendered inside.
 *
 * Registered here rather than with the `wp_template` collection of
 * `@wordpress/core-fields`, which holds the fields core registers, so that the
 * field only exists while the experiment is on, and that package stays as core
 * ships it. Its script module is registered with every other one, and is only
 * imported for the field.
 *
 * Its id is `parent_template` rather than the `template` every other post type
 * has, which is the template that renders a post; its value is the `template`
 * REST field, which matches the one on a post.
 *
 * @access private
 */
function gutenberg_register_block_template_parent_entity_field() {
	wp_register_entity_fields(
		'gutenberg',
		'postType',
		'wp_template',
		array(
			array(
				'id'            => 'parent_template',
				'type'          => 'text',
				'label'         => __( 'Template', 'gutenberg' ),
				'enableSorting' => false,
				'filterBy'      => false,
			),
		),
		'@wordpress/template-inheritance'
	);
}
add_action( 'wp_entity_fields_api_init', 'gutenberg_register_block_template_parent_entity_field' );

/**
 * Adds the `parent_template` field to the form of the template summary.
 *
 * The field is merged rather than pinned into the list, so that the view
 * configuration of `wp_template` stays as the plugin ships it and this feature
 * adds its own field, which is also what keeps the field out of the summary
 * while the experiment is off.
 *
 * @access private
 *
 * @param Gutenberg_View_Config_Data $data The view configuration container for the entity.
 * @return Gutenberg_View_Config_Data The updated view configuration container.
 */
function gutenberg_add_block_template_parent_field_to_view_config( $data ) {
	return $data->merge(
		array(
			'form' => array(
				'fields' => array( 'parent_template' ),
			),
		),
		1
	);
}

/**
 * Registers the view configuration filter of the `parent_template` field.
 *
 * Registered on `init`, after the entity view configuration API has defined the
 * function naming its hook.
 *
 * @access private
 */
function gutenberg_register_block_template_parent_view_config_filter() {
	add_filter(
		gutenberg_get_entity_view_config_hook_name( 'postType', 'wp_template' ),
		'gutenberg_add_block_template_parent_field_to_view_config',
		7,
		1
	);
}
add_action( 'init', 'gutenberg_register_block_template_parent_view_config_filter' );
