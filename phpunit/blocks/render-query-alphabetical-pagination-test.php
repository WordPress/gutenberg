<?php
/**
 * Tests for alphabetical pagination in the `core/query` block.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests deriving the letters of a Query Loop block and filtering it by one.
 *
 * @group blocks
 */
class Tests_Blocks_RenderQueryAlphabeticalPagination extends WP_UnitTestCase {

	/**
	 * Post type used to keep these tests isolated from any other content.
	 *
	 * @var string
	 */
	const POST_TYPE = 'test_glossary';

	/**
	 * Created post IDs, keyed by post title.
	 *
	 * @var array
	 */
	private $post_ids = array();

	public function set_up() {
		parent::set_up();

		register_post_type(
			self::POST_TYPE,
			array(
				'public'   => true,
				'label'    => 'Glossary',
				'supports' => array( 'title', 'editor' ),
			)
		);

		foreach ( array( 'Apple', 'Avocado', 'Banana', '3M' ) as $title ) {
			$this->post_ids[ $title ] = self::factory()->post->create(
				array(
					'post_title'  => $title,
					'post_type'   => self::POST_TYPE,
					'post_status' => 'publish',
				)
			);
		}
	}

	public function tear_down() {
		unset( $_GET['query-0-letter'], $_GET['query-0-page'] );
		unregister_post_type( self::POST_TYPE );
		$this->post_ids = array();
		parent::tear_down();
	}

	/**
	 * Returns the query vars describing every post created for a test.
	 *
	 * @param array $extra Additional query vars.
	 * @return array Query vars.
	 */
	private function get_query_args( $extra = array() ) {
		return array_merge(
			array(
				'post_type'   => self::POST_TYPE,
				'post_status' => 'publish',
				'post__in'    => array_values( $this->post_ids ),
				'fields'      => 'ids',
			),
			$extra
		);
	}

	/**
	 * Renders a Query Loop block with alphabetical pagination turned on.
	 *
	 * @return string Rendered block output.
	 */
	private function render_query() {
		$post_type = self::POST_TYPE;

		$content = <<<HTML
		<!-- wp:query {"queryId":0,"query":{"perPage":10,"pages":0,"offset":0,"postType":"$post_type","order":"asc","orderBy":"title","inherit":false},"useAlphabeticalPagination":true} -->
		<div class="wp-block-query">
			<!-- wp:post-template -->
				<!-- wp:post-title /-->
			<!-- /wp:post-template -->
			<!-- wp:query-total {"displayType":"total-results"} /-->
			<!-- wp:query-pagination -->
				<!-- wp:query-pagination-numbers /-->
			<!-- /wp:query-pagination -->
		</div>
		<!-- /wp:query -->
HTML;

		return do_blocks( $content );
	}

	/**
	 * The letters come from the post titles, with non-letters grouped under "#".
	 */
	public function test_initials_are_derived_from_post_titles() {
		// The build system prefixes block functions, so tests call the built name.
		$buckets = gutenberg_block_core_query_pagination_numbers_get_initials( $this->get_query_args() );

		$this->assertSame( array( '#', 'A', 'B' ), wp_list_pluck( $buckets, 'label' ) );
		$this->assertSame( array( '3' ), $buckets[0]['chars'] );
		$this->assertSame( array( 'A' ), $buckets[1]['chars'] );
	}

	/**
	 * The custom query var restricts a query to titles starting with a letter.
	 */
	public function test_posts_where_filters_by_initial() {
		$query = new WP_Query(
			$this->get_query_args(
				array(
					'query_loop_title_initials' => array( 'A' ),
					'orderby'                   => 'title',
					'order'                     => 'ASC',
				)
			)
		);

		$this->assertSame(
			array( $this->post_ids['Apple'], $this->post_ids['Avocado'] ),
			$query->posts
		);
	}

	/**
	 * The "#" bucket matches only the characters it was derived from.
	 */
	public function test_posts_where_filters_by_the_non_letter_bucket() {
		$query = new WP_Query(
			$this->get_query_args( array( 'query_loop_title_initials' => array( '3' ) ) )
		);

		$this->assertSame( array( $this->post_ids['3M'] ), $query->posts );
	}

	/**
	 * A query that does not carry the query var is left untouched.
	 */
	public function test_posts_where_is_a_no_op_without_the_query_var() {
		$query = new WP_Query( $this->get_query_args() );

		$this->assertCount( 4, $query->posts );
	}

	/**
	 * Rendering the block lists every derived letter alongside an "All" link.
	 */
	public function test_rendering_lists_the_derived_letters() {
		$output = $this->render_query();

		$processor = new WP_HTML_Tag_Processor( $output );
		$labels    = array();
		while ( $processor->next_tag( array( 'class_name' => 'page-numbers' ) ) ) {
			$labels[] = $processor->get_attribute( 'aria-label' );
		}

		// "All" is current, so it renders as a span without an aria-label.
		$this->assertSame(
			array(
				null,
				'Titles starting with a number or symbol',
				'Titles starting with A',
				'Titles starting with B',
			),
			$labels
		);
	}

	/**
	 * Selecting a letter filters the posts, the count, and marks it current.
	 */
	public function test_selecting_a_letter_filters_the_query() {
		$_GET['query-0-letter'] = 'B';

		$output = $this->render_query();

		$this->assertStringContainsString( 'Banana', $output );
		$this->assertStringNotContainsString( 'Apple', $output );
		$this->assertStringNotContainsString( 'Avocado', $output );
		$this->assertStringContainsString( '1 result found', $output );
		$this->assertStringContainsString(
			'<span class="page-numbers current" aria-current="page">B</span>',
			$output
		);
	}

	/**
	 * The "#" bucket selects the titles that do not start with a letter.
	 */
	public function test_selecting_the_non_letter_bucket_filters_the_query() {
		$_GET['query-0-letter'] = '#';

		$output = $this->render_query();

		$this->assertStringContainsString( '3M', $output );
		$this->assertStringNotContainsString( 'Apple', $output );
		$this->assertStringContainsString( '1 result found', $output );
	}

	/**
	 * A letter no post starts with is ignored rather than filtering everything out.
	 */
	public function test_an_unknown_letter_is_ignored() {
		$_GET['query-0-letter'] = 'Z';

		$output = $this->render_query();

		$this->assertStringContainsString( 'Apple', $output );
		$this->assertStringContainsString( '4 results found', $output );
	}

	/**
	 * A crafted value cannot reach the SQL that builds the WHERE clause.
	 */
	public function test_a_crafted_letter_is_ignored() {
		$_GET['query-0-letter'] = "%' OR 1=1 --";

		$output = $this->render_query();

		$this->assertStringContainsString( 'Apple', $output );
		$this->assertStringContainsString( '4 results found', $output );
	}
}
