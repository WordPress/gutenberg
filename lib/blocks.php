<?php
/**
 * Functions related to editor blocks for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

if ( ! function_exists( 'register_block_type' ) ) {
	/**
	 * Registers a block type.
	 *
	 * @since 0.1.0
	 * @since 0.6.0 Now also accepts a WP_Block_Type instance as first parameter.
	 *
	 * @param string|WP_Block_Type $name Block type name including namespace, or alternatively a
	 *                                   complete WP_Block_Type instance. In case a WP_Block_Type
	 *                                   is provided, the $args parameter will be ignored.
	 * @param array                $args {
	 *     Optional. Array of block type arguments. Any arguments may be defined, however the
	 *     ones described below are supported by default. Default empty array.
	 *
	 *     @type callable $render_callback Callback used to render blocks of this block type.
	 * }
	 * @return WP_Block_Type|false The registered block type on success, or false on failure.
	 */
	function register_block_type( $name, $args = array() ) {
		return WP_Block_Type_Registry::get_instance()->register( $name, $args );
	}
}

if ( ! function_exists( 'unregister_block_type' ) ) {
	/**
	 * Unregisters a block type.
	 *
	 * @since 0.1.0
	 * @since 0.6.0 Now also accepts a WP_Block_Type instance as first parameter.
	 *
	 * @param string|WP_Block_Type $name Block type name including namespace, or alternatively a
	 *                                   complete WP_Block_Type instance.
	 * @return WP_Block_Type|false The unregistered block type on success, or false on failure.
	 */
	function unregister_block_type( $name ) {
		return WP_Block_Type_Registry::get_instance()->unregister( $name );
	}
}

if ( ! function_exists( 'gutenberg_parse_blocks' ) ) {
	/**
	 * Parses blocks out of a content string.
	 *
	 * @since 0.5.0
	 *
	 * @param  string $content Post content.
	 * @return array  Array of parsed block objects.
	 */
	function gutenberg_parse_blocks( $content ) {
		/**
		 * Filter to allow plugins to replace the server-side block parser
		 *
		 * @since 3.8.0
		 *
		 * @param string $parser_class Name of block parser class
		 */
		$parser_class = apply_filters( 'block_parser_class', 'WP_Block_Parser' );
		// Load default block parser for server-side parsing if the default parser class is being used.
		if ( 'WP_Block_Parser' === $parser_class ) {
			require_once dirname( __FILE__ ) . '/../packages/block-serialization-default-parser/parser.php';
		}
		$parser = new $parser_class();
		return $parser->parse( $content );
	}
}

if ( ! function_exists( 'get_dynamic_block_names' ) ) {
	/**
	 * Returns an array of the names of all registered dynamic block types.
	 *
	 * @return array Array of dynamic block names.
	 */
	function get_dynamic_block_names() {
		$dynamic_block_names = array();

		$block_types = WP_Block_Type_Registry::get_instance()->get_all_registered();
		foreach ( $block_types as $block_type ) {
			if ( $block_type->is_dynamic() ) {
				$dynamic_block_names[] = $block_type->name;
			}
		}

		return $dynamic_block_names;
	}
}

if ( ! function_exists( 'get_dynamic_blocks_regex' ) ) {
	/**
	 * Retrieve the dynamic blocks regular expression for searching.
	 *
	 * @since 3.6.0
	 *
	 * @return string
	 */
	function get_dynamic_blocks_regex() {
		$dynamic_block_names   = get_dynamic_block_names();
		$dynamic_block_pattern = (
			'/<!--\s+wp:(' .
			str_replace(
				'/',
				'\/',                 // Escape namespace, not handled by preg_quote.
				str_replace(
					'core/',
					'(?:core/)?', // Allow implicit core namespace, but don't capture.
					implode(
						'|',                   // Join block names into capture group alternation.
						array_map(
							'preg_quote',    // Escape block name for regular expression.
							$dynamic_block_names
						)
					)
				)
			) .
			')(\s+(\{.*?\}))?\s+(\/)?-->/'
		);

		return $dynamic_block_pattern;
	}
}

/**
 * Renders a single block into a HTML string.
 *
 * @since 1.9.0
 * @since 4.4.0 renders full nested tree of blocks before reassembling into HTML string
 * @since 4.7.0 filters blocks structurally before rendering and as text afterwards
 * @global WP_Post $post The post to edit.
 *
 * @param  array $source_block A single parsed block object.
 * @return string String of rendered HTML.
 */
function gutenberg_render_block( $source_block ) {
	global $post;

	$global_post = $post;
	/**
	 * Filter to process a block structurally before rendering.
	 *
	 * Use this filter if you want to modify a block's attributes or rearrange
	 * its inner blocks or change its block type - anything which might govern
	 * the way the block gets rendered in the next step.
	 *
	 * @example
	 * function replace_with_translation( $prev, $source_block ) {
	 *     $block = $prev ?: $source_block;
	 *
	 *     if ( ! isset( $block['attrs']['translation_id'] ) ) {
	 *         return $prev;
	 *     }
	 *
	 *     $locale      = get_current_locale();
	 *     $translation = get_translated_block( $block['attrs']['translation_id'], $locale );
	 *
	 *     return $translation ?: $prev;
	 * }
	 * add_filter( 'block_pre_render', 'replace_with_translation' );
	 *
	 * @example
	 * function hide_hidden_inner_blocks( $prev, $source_block ) {
	 *     if ( 'my-plugin/hider' !== $source_block['blockName'] ) {
	 *         return $prev;
	 *     }
	 *
	 *     $block                = $prev ?: $source_block;
	 *     $block['innerBlocks'] = array();
	 *     $inner_content        = array();
	 *     $block_index          = 0;
	 *     $html                 = '';
	 *     foreach ( $block['innerContent'] as $chunk ) {
	 *         if ( is_string( $chunk ) ) {
	 *             $html .= $chunk;
	 *             continue;
	 *         }
	 *
	 *         if ( ! can_see_block( $inner ) ) {
	 *             continue;
	 *         }
	 *
	 *         $inner = $block['innerBlocks'][$block_index++];
	 *         $block['innerBlocks'][] = $inner;
	 *         if ( ! empty( $html ) ) {
	 *             $inner_content[] = $html;
	 *         }
	 *         $inner_content[] = null;
	 *     }
	 *
	 *     return $block;
	 * }
	 * add_filter( 'block_pre_render', 'hide_hidden_inner_blocks' );
	 *
	 * @example
	 * function un_markdownify_block( $prev, $source_block ) {
	 *     $block = $prev ?: $source_block;
	 *     return 'my-plugin/markdown' === $block['blockName']
	 *         ? array_merge( $block, array( 'blockName' => 'core/paragraph' ) )
	 *         : $prev;
	 * }
	 * if ( show_markdown_source() ) {
	 *     add_filter( 'block_pre_render', 'un_markdownify_block' );
	 * }
	 *
	 * @since 4.7.0
	 *
	 * @param array|null $prev transformed block from previous filter or null
	 * @param array $source_block original block passed through all filters
	 *
	 * @return array|null transformed version of block or previous $block if not transformation is needed
	 */
	$pre_render = apply_filters( 'block_pre_render', null, $source_block );
	$post       = $global_post;
	$block      = isset( $pre_render ) ? $pre_render : $source_block;

	$block_type    = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	$is_dynamic    = $block['blockName'] && null !== $block_type && $block_type->is_dynamic();
	$inner_content = '';
	$index         = 0;

	foreach ( $block['innerContent'] as $chunk ) {
		$inner_content .= is_string( $chunk ) ? $chunk : gutenberg_render_block( $block['innerBlocks'][ $index++ ] );
	}

	if ( $is_dynamic ) {
		$attributes  = is_array( $block['attrs'] ) ? (array) $block['attrs'] : array();
		$global_post = $post;
		$output      = $block_type->render( $attributes, $inner_content );
		$post        = $global_post;
	} else {
		$output = $inner_content;
	}

	$global_post = $post;
	/**
	 * Filter to process a block textually after rendering.
	 *
	 * Use this filter if you want to apply string or HTML transformations
	 * on a block after it and its inner blocks have already been rendered
	 * and into HTML. Inner blocks will have been fully rendered into the
	 * parent block by this point, so if you want to process the inner blocks
	 * themselves you should look at `block_pre_render`.
	 *
	 * This filter is particularly useful if you want to process the output
	 * from other blocks which might be substantially different from their
	 * original raw `post_content` content.
	 *
	 * @example
	 * function rot13_block( $output, $block ) {
	 *     return isset( $block['attrs']['do_rot13'] )
	 *         ? str_rot13( $output )
	 *         : $output;
	 * }
	 * add_filter( 'block_post_render', 'rot13_block' );
	 *
	 * @example
	 * function add_return_to_top_link( $output ) {
	 *     return $output . '<a class="return-to-top">Top</a>';
	 * }
	 * add_filter( 'block_post_render', 'add_return_to_top_link' );
	 *
	 * @example
	 * class Matcher {
	 *     public $count = 0;
	 *     public $pattern;
	 *
	 *     function __construct( $pattern ) {
	 *         $this->pattern = $pattern;
	 *     }
	 *
	 *     function block_post_render( $output ) {
	 *         if ( 1 !== preg_match( $this->pattern, $output ) ) {
	 *             return $output;
	 *         }
	 *
	 *         $this->count++;
	 *
	 *         return '<div class="matched-block">' . $output . '</div>'
	 *     }
	 *
	 *     function the_content( $html ) {
	 *         $count = $this->count;
	 *         $this->count = 0;
	 *
	 *         return $count > 0
	 *             ? $html . '<div>Found ' . $count . ' blocks with a match!</div>'
	 *             : $html;
	 *     }
	 * }
	 * $matcher = new Matcher( '/new editor/i' );
	 * add_filter( 'block_post_render', array( $matcher, 'block_post_render' ) );
	 * add_filter( 'the_content', array( $matcher, 'the_content' ), 10 );
	 *
	 * @since 4.7.0
	 *
	 * @param string $output rendered HTML from block or previous filters
	 * @param array $block original block that was rendered
	 *
	 * @return string processed HTML to display
	 */
	$post_render = apply_filters( 'block_post_render', $output, $block );
	$post        = $global_post;

	return $post_render;
}

if ( ! function_exists( 'do_blocks' ) ) {
	/**
	 * Parses dynamic blocks out of `post_content` and re-renders them.
	 *
	 * @since 0.1.0
	 * @since 4.4.0 performs full parse on input post content
	 *
	 * @param  string $content Post content.
	 * @return string          Updated post content.
	 */
	function do_blocks( $content ) {
		// If there are blocks in this content, we shouldn't run wpautop() on it later.
		$priority = has_filter( 'the_content', 'wpautop' );
		if ( false !== $priority && doing_filter( 'the_content' ) && has_blocks( $content ) ) {
			remove_filter( 'the_content', 'wpautop', $priority );
			add_filter( 'the_content', '_restore_wpautop_hook', $priority + 1 );
		}

		$blocks = gutenberg_parse_blocks( $content );
		$output = '';

		foreach ( $blocks as $block ) {
			$output .= gutenberg_render_block( $block );
		}

		return $output;
	}

	add_filter( 'the_content', 'do_blocks', 7 ); // BEFORE do_shortcode() and oembed.
}

if ( ! function_exists( '_restore_wpautop_hook' ) ) {
	/**
	 * If do_blocks() needs to remove wpautop() from the `the_content` filter,
	 * this re-adds it afterwards, for subsequent `the_content` usage.
	 *
	 * @access private
	 *
	 * @since 4.6.0
	 *
	 * @param string $content The post content running through this filter.
	 * @return string The unmodified content.
	 */
	function _restore_wpautop_hook( $content ) {
		$current_priority = has_filter( 'the_content', '_restore_wpautop_hook' );

		add_filter( 'the_content', 'wpautop', $current_priority - 1 );
		remove_filter( 'the_content', '_restore_wpautop_hook', $current_priority );

		return $content;
	}
}

if ( ! function_exists( 'strip_dynamic_blocks' ) ) {
	/**
	 * Remove all dynamic blocks from the given content.
	 *
	 * @since 3.6.0
	 *
	 * @param string $content Content of the current post.
	 * @return string
	 */
	function strip_dynamic_blocks( $content ) {
		return preg_replace( get_dynamic_blocks_regex(), '', $content );
	}
}

if ( ! function_exists( 'strip_dynamic_blocks_add_filter' ) ) {
	/**
	 * Adds the content filter to strip dynamic blocks from excerpts.
	 *
	 * It's a bit hacky for now, but once this gets merged into core the function
	 * can just be called in `wp_trim_excerpt()`.
	 *
	 * @since 3.6.0
	 *
	 * @param string $text Excerpt.
	 * @return string
	 */
	function strip_dynamic_blocks_add_filter( $text ) {
		add_filter( 'the_content', 'strip_dynamic_blocks', 6 );

		return $text;
	}
	add_filter( 'get_the_excerpt', 'strip_dynamic_blocks_add_filter', 9 ); // Before wp_trim_excerpt().
}

if ( ! function_exists( 'strip_dynamic_blocks_remove_filter' ) ) {
	/**
	 * Removes the content filter to strip dynamic blocks from excerpts.
	 *
	 * It's a bit hacky for now, but once this gets merged into core the function
	 * can just be called in `wp_trim_excerpt()`.
	 *
	 * @since 3.6.0
	 *
	 * @param string $text Excerpt.
	 * @return string
	 */
	function strip_dynamic_blocks_remove_filter( $text ) {
		remove_filter( 'the_content', 'strip_dynamic_blocks', 6 );

		return $text;
	}
	add_filter( 'wp_trim_excerpt', 'strip_dynamic_blocks_remove_filter', 0 ); // Before all other.
}
