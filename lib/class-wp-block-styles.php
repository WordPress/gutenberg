<?php

class WP_Block_Styles {

	/**
	 * An array of blocks along with their styles.
	 *
	 * @access protected
	 *
	 * @var array
	 */
	protected $blocks;

	/**
	 * An array of stylesheets that have already been added.
	 *
	 * @access protected
	 *
	 * @var array
	 */
	protected $block_styles_added = array();

	/**
	 * Whether the injection script has been added or not.
	 *
	 * @access protected
	 *
	 * @var bool
	 */
	protected $injection_script_added = false;

	/**
	 * An array of core block styles.
	 *
	 * @access protected
	 *
	 * @var array
	 */
	protected $core_block_styles = array(
		'audio'           => 'inline',
		'button'          => 'inline_link',
		'buttons'         => 'inline_link',
		'calendar'        => 'inject',
		'categories'      => 'inject',
		'columns'         => 'inject',
		'cover'           => 'footer',
		'embed'           => 'inline',
		'file'            => 'inline',
		'gallery'         => 'footer',
		'heading'         => 'inline',
		'image'           => 'inline',
		'latest-comments' => 'inline',
		'latest-posts'    => 'inline',
		'list'            => 'inline',
		'media-text'      => 'inline',
		'navigation'      => 'inline',
		'navigation-link' => 'inline',
		'paragraph'       => 'inline',
		'post-author'     => 'inline',
		'pullquote'       => 'inline',
		'quote'           => 'inline',
		'rss'             => 'inline',
		'search'          => 'inline',
		'separator'       => 'inline',
		'site-logo'       => 'inline',
		'social-links'    => 'inline',
		'spacer'          => 'inline',
		'subhead'         => 'inline',
		'table'           => 'inline',
		'text-columns'    => 'inline',
		'video'           => 'inline',
	);

	/**
	 * Constructor.
	 *
	 * @access public
	 */
	public function __construct() {
		if ( current_theme_supports( 'split-block-styles' ) ) {
			add_filter( 'render_block', [ $this, 'add_styles' ], 10, 2 );
		}
	}

	/**
	 * Get an array of block styles.
	 *
	 * @access public
	 *
	 * @return array
	 */
	public function get_blocks_styles_array() {

		if ( ! $this->blocks ) {

			foreach ( $this->core_block_styles as $block => $method ) {
				if ( ! isset( $this->blocks[ "core/$block" ] ) ) {
					$this->blocks[ "core/block" ] = array();
				}
				$this->blocks[ "core/$block" ][] = array(
					'handle' => "core-$block-block-styles",
					'src'    => gutenberg_url( "packages/block-library/build-style/$block.css" ),
					'ver'    => filemtime( gutenberg_dir_path() . "packages/block-library/build-style/$block.css" ),
					'media'  => 'all',
					'method' => $method,
					'path'   => gutenberg_dir_path() . "packages/block-library/build-style/$block.css",
				);
			}
		}

		return $this->blocks;
	}

	/**
	 * Add block-styles on the 1st occurence of a block-type.
	 *
	 * @param string $block_content The block content about to be appended.
	 * @param array  $block         The full block, including name and attributes.
	 *
	 * @return string
	 */
	function add_styles( $block_content, $block ) {

		// Early return if the styles for this block-type have already been added.
		if (
			! isset( $block['blockName'] ) || // Sanity check.
			in_array( $block['blockName'], $this->block_styles_added )
		) {
			return $block_content;
		}

		$block_styles     = array();
		$all_block_styles = $this->get_blocks_styles_array();
		$block_styles     = isset( $all_block_styles[ $block['blockName'] ] )
			? $all_block_styles[ $block['blockName'] ]
			: array();

		/**
		 * Filter collection of stylesheets per block-type.
		 *
		 * @since 5.5.0
		 *
		 * @param array  $block_styles An array of stylesheets per block-type.
		 * @param string $block_name   The $block['blockName'] identifier.
		 */
		$block_styles = apply_filters( 'block_styles', $block_styles, $block['blockName'] );

		foreach ( $block_styles as $block_style ) {
			$this->add_block_styles( $block_style );
		}
		$this->block_styles_added[] = $block['blockName'];

		return $block_content;
	}

	/**
	 * Adds a block style.
	 *
	 * @access public
	 *
	 * @param array $block_style The block-style we're adding.
	 *
	 * @return void
	 */
	public function add_block_styles( $block_style ) {

		$block_style['method'] = ( isset( $block_style['method'] ) ) ? $block_style['method'] : 'inject';

		switch ( $block_style['method'] ) {
			case 'inline':
				$this->add_block_style_inline( $block_style );
				break;

			case 'inline_link':
				$this->add_block_style_inline_link( $block_style );
				break;

			case 'footer':
				$this->add_block_style_footer( $block_style );
				break;

			case 'inject':
				$this->add_block_style_inject( $block_style );
				break;
		}
	}

	/**
	 * Adds a block style.
	 *
	 * @access public
	 *
	 * @param array $block_style The block-style we're adding.
	 *
	 * @return void
	 */
	public function add_block_style_inline( $block_style ) {
		$id = $block_style['handle'] . '-css';

		echo '<style id="' . esc_attr( $id ) . '">';
		include $block_style['path'];
		echo '</style>';
	}

	/**
	 * Adds a block style.
	 *
	 * @access public
	 *
	 * @param array $block_style The block-style we're adding.
	 *
	 * @return void
	 */
	public function add_block_style_inline_link( $block_style ) {
		$id    = $block_style['handle'] . '-css';
		$src   = $block_style['src'];
		$media = isset( $block_style['media'] ) ? $block_style['media'] : 'all';
		if ( $block_style['ver'] ) {
			$src = add_query_arg( 'ver', $block_style['ver'], $src );
		}

		echo '<link id="' . esc_attr( $id ) . '" rel="stylesheet" href="' . esc_url( $src ) . '" media="' . esc_attr( $media ) . '">';
	}

	/**
	 * Adds a block style.
	 *
	 * @access public
	 *
	 * @param array $block_style The block-style we're adding.
	 *
	 * @return void
	 */
	public function add_block_style_footer( $block_style ) {
		wp_enqueue_style(
			$block_style['handle'],
			$block_style['src'],
			[],
			$block_style['ver'],
			isset( $block_style['media'] ) ? $block_style['media'] : 'all'
		);
	}

	/**
	 * Adds a block style.
	 *
	 * @access public
	 *
	 * @param array $block_style The block-style we're adding.
	 *
	 * @return void
	 */
	public function add_block_style_inject( $block_style ) {
		if ( ! $this->injection_script_added ) {
			$this->add_injection_script();
			$this->injection_script_added = true;
		}

		$style = wp_parse_args(
			$block_style,
			[
				'handle' => '',
				'src'    => '',
				'ver'    => false,
			]
		);
		echo "<script>wpEnqueueStyle('{$style['handle']}', '{$style['src']}', [], '{$style['ver']}', '{$style['media']}')</script>";

	}

	/**
	 * Prints the JS script that allows us to enqueue/inject scripts directly.
	 *
	 * @access protected
	 *
	 * @return void
	 */
	protected function add_injection_script() {
		?>
		<script id="wp-enqueue-style-script">
		function wpEnqueueStyle( handle, src, deps, ver, media ) {

			// Create the element.
			var style = document.createElement( 'link' ),
				isFirst = ! window.wpEnqueueStyleLastInjectedEl,
				injectEl = isFirst
					? document.head
					: document.getElementById( window.wpEnqueueStyleLastInjectedEl ),
				injectPos = isFirst
					? 'afterbegin'
					: 'afterend';

			// Add element props for the stylesheet.
			style.id = handle + '-css';
			style.rel = 'stylesheet';
			style.href = src;
			if ( ver ) {
				style.href += 0 < style.href.indexOf( '?' ) ? '&ver=' + ver : '?ver=' + ver;
			}
			style.media = media ? media : 'all';

			// Set the global var so we know where to add the next style.
			// This helps us preserve priorities and inject styles one after the other instead of reversed.
			window.wpEnqueueStyleLastInjectedEl = handle + '-css';

			// Inject the element.
			injectEl.insertAdjacentElement( injectPos, style );
		}
		</script>
		<?php
	}
}
