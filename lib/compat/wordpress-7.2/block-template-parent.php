<?php
/**
 * Renders a template inside the template assigned to it.
 *
 * A template can name another template to render inside, the way a page names
 * the template it is rendered inside. The parent's `core/post-content` block
 * is the slot: the child template's blocks are substituted for it, so a
 * template only carries what is particular to it and the header, the footer
 * and whatever else surrounds it live in one place.
 *
 * The assignment is stored in the `_wp_page_template` post meta of the
 * template's own post, the same meta a page uses to name its template, so
 * `get_page_template_slug()` reads it and the REST field is called `template`
 * like the one on a post.
 *
 * @package gutenberg
 */

/**
 * The most templates a chain may be deep.
 *
 * A chain that is longer than this is treated as a mistake and resolved as far
 * as the limit allows.
 */
const GUTENBERG_TEMPLATE_PARENT_MAX_DEPTH = 10;

/**
 * The block whose `core/post-content` blocks are not the slot.
 *
 * A query loop renders its blocks once per post, so the `core/post-content`
 * block inside one belongs to the post it is rendering rather than to the
 * template. The editor leaves those out of the post content blocks it makes
 * editable for the same reason, see the `getPostBlocksByName` selector of the
 * editor package.
 */
const GUTENBERG_TEMPLATE_CONTENT_SLOT_EXCLUDED_BLOCK = 'core/query';

/**
 * Returns whether a template has a `core/post-content` block to render a
 * template inside.
 *
 * @param string $content Serialized blocks of the template.
 * @return bool Whether it has a slot.
 */
function gutenberg_block_template_has_content_slot( $content ) {
	return null !== gutenberg_substitute_template_content_slot( $content, '' );
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
		if ( $template instanceof WP_Block_Template ) {
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
 * Returns the slug of the template a template is rendered inside.
 *
 * @param WP_Block_Template|null $template Template to read the assignment from.
 * @return string Slug of the template it is rendered inside, or an empty string when it is rendered on its own.
 */
function gutenberg_get_block_template_parent_slug( $template ) {
	if ( ! $template instanceof WP_Block_Template || empty( $template->wp_id ) ) {
		return '';
	}

	$slug = get_page_template_slug( $template->wp_id );

	// `get_page_template_slug()` answers `false` for a post that has no meta,
	// and the default template is spelled as an empty string.
	if ( ! is_string( $slug ) || 'default' === $slug ) {
		return '';
	}

	return $slug;
}

/**
 * Substitutes blocks for the first `core/post-content` block of a template.
 *
 * Walks the tree in document order and uses the first `core/post-content`
 * block it reaches, at whatever depth, keeping the blocks that surround it.
 *
 * @param string $parent_content Serialized blocks of the template to substitute into.
 * @param string $child_content  Serialized blocks to substitute for the slot.
 * @return string|null The combined blocks, or `null` when the template has no `core/post-content` block.
 */
function gutenberg_substitute_template_content_slot( $parent_content, $child_content ) {
	$parent_blocks = parse_blocks( $parent_content );

	/*
	 * The top level of a template is a list of blocks rather than one block, so
	 * it is substituted into as the inner blocks of a block that is not
	 * serialized. Its own `innerContent` is therefore never read; only the
	 * `innerContent` of a block whose direct child is the slot is rewritten.
	 */
	$result = gutenberg_substitute_content_slot_in_block(
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
 * Substitutes blocks for the first `core/post-content` block among a block's descendants.
 *
 * @access private
 *
 * @param array $block        Parsed block to search.
 * @param array $child_blocks Parsed blocks to substitute for the slot.
 * @return array|null The block with the substitution applied, or `null` when it has no `core/post-content` descendant.
 */
function gutenberg_substitute_content_slot_in_block( $block, $child_blocks ) {
	foreach ( $block['innerBlocks'] as $index => $inner_block ) {
		if ( GUTENBERG_TEMPLATE_CONTENT_SLOT_EXCLUDED_BLOCK === $inner_block['blockName'] ) {
			continue;
		}

		if ( 'core/post-content' === $inner_block['blockName'] ) {
			array_splice( $block['innerBlocks'], $index, 1, $child_blocks );

			/*
			 * `serialize_block()` reads one inner block for every `null` in
			 * `innerContent`, so the `null` that stood for the slot becomes one
			 * per block substituted for it, in its place.
			 */
			$block['innerContent'] = gutenberg_expand_inner_content_slot(
				$block['innerContent'],
				$index,
				count( $child_blocks )
			);

			return $block;
		}

		if ( empty( $inner_block['innerBlocks'] ) ) {
			continue;
		}

		$substituted = gutenberg_substitute_content_slot_in_block( $inner_block, $child_blocks );
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
 * Replaces the placeholder of one inner block with the placeholders of several.
 *
 * @access private
 *
 * @param array $inner_content Chunks of a parsed block's `innerContent`, where each `null` stands for an inner block.
 * @param int   $block_index   Index among the inner blocks of the block being replaced.
 * @param int   $count         How many blocks replace it.
 * @return array The chunks, with that block's placeholder replaced by `$count` placeholders.
 */
function gutenberg_expand_inner_content_slot( $inner_content, $block_index, $count ) {
	$expanded = array();
	$seen     = 0;

	foreach ( $inner_content as $chunk ) {
		if ( null !== $chunk ) {
			$expanded[] = $chunk;
			continue;
		}

		if ( $seen === $block_index ) {
			$expanded = array_merge( $expanded, array_fill( 0, $count, null ) );
		} else {
			$expanded[] = null;
		}

		++$seen;
	}

	return $expanded;
}

/**
 * Renders a template inside the templates it is assigned to, up the whole chain.
 *
 * Stops at the first template that has no template assigned, at one that is
 * already in the chain, and at one whose template has no `core/post-content`
 * block to render it in.
 *
 * @param string $template_id ID of the template being rendered, as `theme//slug`.
 * @param string $content     Serialized blocks of the template being rendered.
 * @return string|null The template rendered inside its chain, or `null` when it is rendered on its own.
 */
function gutenberg_resolve_block_template_parents( $template_id, $content ) {
	$resolved   = null;
	$seen       = array( $template_id => true );
	$current_id = $template_id;

	for ( $depth = 0; $depth < GUTENBERG_TEMPLATE_PARENT_MAX_DEPTH; $depth++ ) {
		$current = gutenberg_get_block_template_read( $current_id );
		if ( ! $current ) {
			break;
		}

		$parent_slug = gutenberg_get_block_template_parent_slug( $current );
		if ( '' === $parent_slug ) {
			break;
		}

		$parent_id = $current->theme . '//' . $parent_slug;
		if ( isset( $seen[ $parent_id ] ) ) {
			break;
		}
		$seen[ $parent_id ] = true;

		$parent = gutenberg_get_block_template_read( $parent_id );
		if ( ! $parent || '' === trim( (string) $parent->content ) ) {
			break;
		}

		$combined = gutenberg_substitute_template_content_slot( $parent->content, $content );
		if ( null === $combined ) {
			break;
		}

		$content    = $combined;
		$resolved   = $combined;
		$current_id = $parent_id;
	}

	return $resolved;
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

	if ( empty( $_wp_current_template_id ) || empty( $_wp_current_template_content ) ) {
		return $template;
	}

	$resolved = gutenberg_resolve_block_template_parents( $_wp_current_template_id, $_wp_current_template_content );
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
	if ( isset( $item['wp_id'] ) ) {
		$slug = get_page_template_slug( (int) $item['wp_id'] );

		return is_string( $slug ) && 'default' !== $slug ? $slug : '';
	}

	// `wp_id` belongs to the `edit` context, so a response that leaves it out
	// is answered from the template itself.
	if ( isset( $item['id'] ) ) {
		return gutenberg_get_block_template_parent_slug( get_block_template( $item['id'], 'wp_template' ) );
	}

	return '';
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

	if ( '' === $value ) {
		delete_post_meta( $template->wp_id, '_wp_page_template' );

		return true;
	}

	update_post_meta( $template->wp_id, '_wp_page_template', $value );

	return true;
}

/**
 * Reads whether a template can render a template inside, for a REST response.
 *
 * @access private
 *
 * @param array $item Prepared template response.
 * @return bool Whether the template has a `core/post-content` block to render a template inside.
 */
function gutenberg_get_block_template_has_content_slot_field( $item ) {
	if ( isset( $item['content']['raw'] ) ) {
		return gutenberg_block_template_has_content_slot( $item['content']['raw'] );
	}

	// The content belongs to the `edit` context, so a response that leaves it
	// out is answered from the template itself.
	if ( isset( $item['id'] ) ) {
		$template = get_block_template( $item['id'], 'wp_template' );

		return $template ? gutenberg_block_template_has_content_slot( $template->content ) : false;
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
		'has_content_slot',
		array(
			'get_callback' => 'gutenberg_get_block_template_has_content_slot_field',
			'schema'       => array(
				'description' => __( 'Whether the template has a post content block to render another template inside of.', 'gutenberg' ),
				'type'        => 'boolean',
				'context'     => array( 'embed', 'view', 'edit' ),
				'readonly'    => true,
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_block_template_parent_field' );
