<?php
/**
 * Table of Contents block.
 *
 * @package gutenberg
 */

/**
 * Handles rendering the table of contents.
 */
class Block_Table_Of_Contents {
	/**
	 * Cache of TOC placeholder IDs.
	 *
	 * @var array $ids
	 */
	private $ids = array();

	/**
	 * Cache of TOC Titles.
	 *
	 * @var array $titles
	 */
	private $titles = array();

	/**
	 * Cache of TOC "numbered" settings.
	 *
	 * @var array $numbered
	 */
	private $numbered = array();

	/**
	 * Cache of heading blocks found.
	 *
	 * @var array $headings
	 */
	private $headings = array();

	/**
	 * Constructor.
	 */
	function __construct() {
		register_block_type( 'core/table-of-contents', array(
			'attributes'      => array(
				'title'    => array(
					'type'    => 'string',
					'default' => __( 'Table of Contents', 'gutenberg' ),
				),
				'numbered' => array(
					'type'    => 'bool',
					'default' => true,
				),
			),
			'render_callback' => array( $this, 'add_placeholder' ),
		) );

		add_filter( 'raw_block_content', array( $this, 'add_id_to_heading_blocks' ), 10, 2 );
		add_filter( 'the_content', array( $this, 'insert_toc' ) );
	}

	/**
	 * Initialises an instance of the class.
	 *
	 * @return Block_Table_Of_Contents Instance of the class.
	 */
	static public function init() {
		static $instance;
		if ( ! $instance ) {
			$instance = new Block_Table_Of_Contents();
		}
		return $instance;
	}

	/**
	 * Adds a placeholder for the Table of Contents to be rendered into, after
	 * all of the blocks have been processed.
	 *
	 * @param array $attributes The block attributes.
	 *
	 * @return string The placeholder.
	 */
	public function add_placeholder( $attributes ) {
		$toc_id = '<!-- ' . uniqid( 'toc-', true ) . ' -->';

		$this->ids[]      = $toc_id;
		$this->titles[]   = $attributes['title'];
		$this->numbered[] = $attributes['numbered'];

		return $toc_id;
	}

	/**
	 * Replaces the Table of Contents placeholders with the actual Table of Contents
	 *
	 * @param string $content The HTML content of the post.
	 *
	 * @return string The post HTML, with Table of Contents inserted.
	 */
	public function insert_toc( $content ) {
		foreach ( $this->ids as $count => $id ) {
			$title    = $this->titles[ $count ];
			$numbered = $this->numbered[ $count ];

			$html = "<h2>$title</h2>";

			if ( ! $this->headings ) {
				$html .= '<p><em>' . __( 'Empty', 'gutenberg' ) . '</e></p>';
				$content = str_replace( $id, $html, $content );
				continue;
			}

			$html .= '<ul class="wp-block-table-of-contents">';

			$level_counts = array(
				1 => 0,
				2 => 0,
				3 => 0,
				4 => 0,
				5 => 0,
				6 => 0,
			);

			foreach ( $this->headings as $heading ) {
				$level_string = '';
				if ( $numbered ) {
					$level_counts[ $heading['level'] ]++;
					for ( $ii = $heading['level'] + 1; $ii <= 6; $ii++ ) {
						$level_counts[ $ii ] = 0;
					}
					$level_string = $this->create_chapter_string( $level_counts, $heading['level'] ) . ' ';
				}

				$html .= "<li class='level{$heading['level']}'>$level_string<a href='#{$heading['id']}'>{$heading['heading']}</a></li>";
			}

			$content = str_replace( $id, $html, $content );
		}

		return $content;
	}

	/**
	 * Creates a TOC chapter string, based on where the parser is currently up to.
	 *
	 * @param array $level_counts The state of each chapter level.
	 * @param int   $level The currently chapter's level.
	 *
	 * @return string The chapter string.
	 */
	private function create_chapter_string( $level_counts, $level ) {
		$string = '';
		for ( $ii = 2; $ii <= $level; $ii++ ) {
			$string .= $level_counts[ $ii ];
			if ( $ii != $level ) {
				$string .= '.';
			}
		}
		return $string;
	}

	/**
	 * When a heading block is processed, we need to add an ID attribute, so we can link to it.
	 *
	 * @param string $content The raw content of the block being processed.
	 * @param string $block_name The Block Name of the block being processed.
	 *
	 * @return string The HTML to replace $content with.
	 */
	public function add_id_to_heading_blocks( $content, $block_name ) {
		if ( 'core/heading' !== $block_name ) {
			return $content;
		}

		return preg_replace_callback( '|^(\s*)<h([1-6])>(.+)</h\2>|i', array( $this, 'add_id_to_heading_blocks_callback' ), $content );
	}

	/**
	 * Internal callback for add an ID to headers.
	 *
	 * @see Gutenberg_Table_of_Contents::add_id_to_heading_blocks()
	 *
	 * @param array $matches Array of matches.
	 *
	 * @return string The replacement string to use.
	 */
	private function add_id_to_heading_blocks_callback( $matches ) {
		$heading = trim( wp_strip_all_tags( $matches[3], true ) );
		$id = 'heading-' . preg_replace( '/[^a-z0-9_]+/i', '-', $heading );

		$this->headings[] = array(
			'level'   => $matches[2],
			'heading' => $heading,
			'id'      => $id,
		);

		return "{$matches[1]}<h{$matches[2]} id='$id'>{$matches[3]}</h{$matches[2]}>";
	}
}
