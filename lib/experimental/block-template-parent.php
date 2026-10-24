<?php
/**
 * Renders a template inside the template assigned to it.
 *
 * A template can name another template to render inside, the way a page names
 * the template it is rendered inside. The parent's `core/post-content` block
 * is the slot: the child template's blocks are rendered in it, so a template
 * only carries what is particular to it and the header, the footer and
 * whatever else surrounds it live in one place.
 *
 * A theme names the template each of its templates is rendered inside in the
 * `templates` section of its `theme.json`, so a theme works that way on
 * activation with nothing to set up.
 *
 * A site overrides what the theme names, including rendering a template on its
 * own, from the editor. The choice is stored in the `_wp_page_template` post
 * meta of the template's own post, the same meta a page uses to name its
 * template, so the REST field is called `template` like the one on a post. The
 * meta is `default` when the site renders the template on its own, and absent
 * when the site has made no choice and the theme's one stands.
 *
 * Behind the `gutenberg-template-inheritance` experiment, which is what loads
 * this file, while the product questions this opens are settled: named slots,
 * what a theme may declare, and how a chain meets the template hierarchy.
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
 * The attribute marking the `core/post-content` block that is the slot.
 *
 * The blocks of the template being rendered are resolved into the serialized
 * blocks of the template around it, so the block that holds them is marked in
 * the markup itself rather than in a variable. It is set while answering a
 * request and never saved.
 */
const GUTENBERG_TEMPLATE_CONTENT_SLOT_ATTRIBUTE = 'templateSlot';

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
		$slug = get_post_meta( $template->wp_id, '_wp_page_template', true );

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
 * Puts blocks inside the first `core/post-content` block of a template.
 *
 * Walks the tree in document order and uses the first `core/post-content`
 * block it reaches, at whatever depth, keeping the blocks that surround it.
 *
 * @param string $parent_content Serialized blocks of the template to substitute into.
 * @param string $child_content  Serialized blocks to put in the slot.
 * @return string|null The combined blocks, or `null` when the template has no `core/post-content` block.
 */
function gutenberg_substitute_template_content_slot( $parent_content, $child_content ) {
	$parent_blocks = parse_blocks( $parent_content );

	/*
	 * The top level of a template is a list of blocks rather than one block, so
	 * it is searched as the inner blocks of a block that is never serialized.
	 * Only the slot block itself changes shape, so no `innerContent` above it
	 * is rewritten, and this one is never read.
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
 * Puts blocks inside the first `core/post-content` block among a block's descendants.
 *
 * @access private
 *
 * @param array $block        Parsed block to search.
 * @param array $child_blocks Parsed blocks to put in the slot.
 * @return array|null The block with the blocks in its slot, or `null` when it has no `core/post-content` descendant.
 */
function gutenberg_substitute_content_slot_in_block( $block, $child_blocks ) {
	foreach ( $block['innerBlocks'] as $index => $inner_block ) {
		if ( GUTENBERG_TEMPLATE_CONTENT_SLOT_EXCLUDED_BLOCK === $inner_block['blockName'] ) {
			continue;
		}

		if ( 'core/post-content' === $inner_block['blockName'] ) {
			$block['innerBlocks'][ $index ] = gutenberg_fill_template_content_slot( $inner_block, $child_blocks );

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
 * Makes the slot block of a template hold the blocks of the template rendered inside it.
 *
 * The `core/post-content` block stays where it is and takes the blocks as its
 * own, rather than being replaced by them, so that it still renders its
 * wrapper: its layout, its alignment and the rest of its block supports apply
 * to the template rendered inside it, and a theme styling `.entry-content`
 * still reaches it. It is also what the editor shows around the blocks being
 * edited, so the canvas and the front end agree.
 *
 * @access private
 *
 * @param array $slot         The parsed `core/post-content` block that is the slot.
 * @param array $child_blocks Parsed blocks to put in it.
 * @return array The slot block, holding the blocks.
 */
function gutenberg_fill_template_content_slot( $slot, $child_blocks ) {
	if ( ! is_array( $slot['attrs'] ) ) {
		$slot['attrs'] = array();
	}

	$slot['innerBlocks'] = $child_blocks;
	$slot['innerHTML']   = '';
	// `serialize_block()` reads one inner block for every `null`, and
	// `WP_Block::render()` renders one for every `null` in turn.
	$slot['innerContent'] = array_fill( 0, count( $child_blocks ), null );

	$slot['attrs'][ GUTENBERG_TEMPLATE_CONTENT_SLOT_ATTRIBUTE ] = true;

	return $slot;
}

/**
 * Renders the blocks a template puts in its slot inside the content block's own wrapper.
 *
 * The slot is a `core/post-content` block that holds the blocks of the
 * template rendered inside it, which `WP_Block::render()` has already rendered
 * into `$content` by the time the block's own callback runs. Rendering the post
 * of the request instead, as the block otherwise would, is what has to be
 * skipped; the wrapper is not, so it is built here the way the block builds it.
 *
 * @access private
 *
 * @param array  $args Arguments of the block type being registered.
 * @param string $name Name of the block type being registered.
 * @return array The arguments, with the slot handled for `core/post-content`.
 */
function gutenberg_render_template_content_slot( $args, $name ) {
	if ( 'core/post-content' !== $name || ! isset( $args['render_callback'] ) ) {
		return $args;
	}

	$render_post_content = $args['render_callback'];

	$args['render_callback'] = static function ( $attributes, $content, $block ) use ( $render_post_content ) {
		/*
		 * The attribute marks the slot, and is not registered, so it is read
		 * from the parsed block rather than from the prepared attributes.
		 */
		$is_slot = isset( $block->parsed_block['attrs'][ GUTENBERG_TEMPLATE_CONTENT_SLOT_ATTRIBUTE ] )
			&& true === $block->parsed_block['attrs'][ GUTENBERG_TEMPLATE_CONTENT_SLOT_ATTRIBUTE ];

		if ( ! $is_slot ) {
			return call_user_func( $render_post_content, $attributes, $content, $block );
		}

		if ( '' === trim( $content ) ) {
			return '';
		}

		/*
		 * The allowed tag names and the `entry-content` class follow
		 * `render_block_core_post_content()`, so that the template rendered
		 * inside sits in the same wrapper on the front end as in the editor.
		 */
		$tag_name = 'div';
		if ( isset( $attributes['tagName'] ) && is_string( $attributes['tagName'] ) ) {
			$allowed_tag_names   = array( 'div', 'main', 'section', 'article' );
			$normalized_tag_name = strtolower( $attributes['tagName'] );

			if ( in_array( $normalized_tag_name, $allowed_tag_names, true ) ) {
				$tag_name = $normalized_tag_name;
			}
		}

		return sprintf(
			'<%1$s %2$s>%3$s</%1$s>',
			$tag_name,
			get_block_wrapper_attributes( array( 'class' => 'entry-content' ) ),
			$content
		);
	};

	return $args;
}
add_filter( 'register_block_type_args', 'gutenberg_render_template_content_slot', 10, 2 );

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
	if ( ! isset( $item['id'] ) ) {
		return '';
	}

	return gutenberg_get_block_template_parent_slug( gutenberg_get_block_template_read( $item['id'] ) );
}

/**
 * Checks that a template may be rendered inside the template a request names.
 *
 * The editor only offers the templates a template may name, but a request may
 * carry any slug, and a chain that loops or names a template that is not there
 * is a template the site cannot show. The resolver stops rather than loops, so
 * this is about not writing data the site has no use for.
 *
 * Whether the template named has a `core/post-content` block to render this one
 * in is deliberately not checked: a template can lose its content block after
 * the fact, and that is a template to fix rather than an assignment to reject.
 *
 * @access private
 *
 * @param string            $slug     Slug of the template to render it inside, or an empty string to render it on its own.
 * @param WP_Block_Template $template Template being written to.
 * @return true|WP_Error True when it may be stored, or a `WP_Error` describing why it may not.
 */
function gutenberg_validate_block_template_parent_slug( $slug, $template ) {
	// Rendering the template on its own is always available.
	if ( '' === $slug ) {
		return true;
	}

	if ( $slug === $template->slug ) {
		return new WP_Error(
			'rest_template_parent_itself',
			__( 'A template cannot be rendered inside itself.', 'gutenberg' ),
			array( 'status' => 400 )
		);
	}

	$parent = get_block_template( $template->theme . '//' . $slug, 'wp_template' );
	if ( ! $parent ) {
		return new WP_Error(
			'rest_template_parent_not_found',
			__( 'The template to render this one inside of does not exist.', 'gutenberg' ),
			array( 'status' => 400 )
		);
	}

	// Walking up from the template named reaches this one only when storing the
	// slug would close a loop.
	$seen    = array( $parent->id => true );
	$current = $parent;

	for ( $depth = 0; $depth < GUTENBERG_TEMPLATE_PARENT_MAX_DEPTH; $depth++ ) {
		$next_slug = gutenberg_get_block_template_parent_slug( $current );
		if ( '' === $next_slug ) {
			return true;
		}

		$next_id = $current->theme . '//' . $next_slug;

		if ( $next_id === $template->id ) {
			return new WP_Error(
				'rest_template_parent_loop',
				__( 'The template to render this one inside of is already rendered inside of it.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		// A chain that already loops higher up is left to the resolver, which
		// stops at the template it has seen rather than following it round.
		if ( isset( $seen[ $next_id ] ) ) {
			return true;
		}
		$seen[ $next_id ] = true;

		$current = get_block_template( $next_id, 'wp_template' );
		if ( ! $current ) {
			return true;
		}
	}

	return true;
}

/**
 * Stores the template a template is rendered inside from a REST request.
 *
 * @access private
 *
 * @param string            $value    Slug of the template to render it inside, or an empty string to render it on its own.
 * @param WP_Block_Template $template Template being written to.
 * @return true|WP_Error True on success, or a `WP_Error` when the template has no post to store it on or the slug is not one it may name.
 */
function gutenberg_update_block_template_parent_field( $value, $template ) {
	if ( empty( $template->wp_id ) ) {
		return new WP_Error(
			'rest_template_parent_not_stored',
			__( 'The template could not be saved, so the template to render it inside was not stored.', 'gutenberg' ),
			array( 'status' => 500 )
		);
	}

	$valid = gutenberg_validate_block_template_parent_slug( $value, $template );
	if ( is_wp_error( $valid ) ) {
		return $valid;
	}

	/*
	 * `default` rather than an empty string, so that a site rendering a
	 * template on its own is told apart from one that has made no choice and
	 * takes the template its theme names.
	 */
	update_post_meta( $template->wp_id, '_wp_page_template', '' === $value ? 'default' : $value );

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
