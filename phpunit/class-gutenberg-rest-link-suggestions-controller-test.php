<?php
/**
 * Unit tests covering Gutenberg_REST_Link_Suggestions_Controller functionality.
 *
 * The ranking cases mirror the `sortResults` tests in
 * `packages/core-data/src/fetch/test/__experimental-fetch-link-suggestions.js`, so the order the
 * endpoint returns matches the order the editor used to sort merged results into.
 *
 * @package gutenberg
 */
class Gutenberg_REST_Link_Suggestions_Controller_Test extends WP_Test_REST_TestCase {
	const ROUTE = '/wp-block-editor/v1/link-suggestions';

	protected static $editor_id;
	protected static $author_id;
	protected static $subscriber_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id     = $factory->user->create( array( 'role' => 'editor' ) );
		self::$author_id     = $factory->user->create( array( 'role' => 'author' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		self::delete_user( self::$author_id );
		self::delete_user( self::$subscriber_id );
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$editor_id );
	}

	/**
	 * Runs a request against the endpoint.
	 *
	 * @param array $params Query parameters.
	 * @return WP_REST_Response
	 */
	private function get_suggestions( $params = array() ) {
		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_query_params( $params );
		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Returns the titles of the suggestions for a search, in the order the endpoint gave them.
	 *
	 * @param array $params Query parameters.
	 * @return string[]
	 */
	private function get_titles( $params ) {
		$response = $this->get_suggestions( $params );
		$this->assertSame( 200, $response->get_status() );
		return wp_list_pluck( $response->get_data(), 'title' );
	}

	/**
	 * Creates a published post with a date, so posts that rank the same keep a known order.
	 *
	 * @param string $title     Post title.
	 * @param string $post_type Post type.
	 * @param int    $age       How many days old the post is; older posts come later among equals.
	 * @param array  $args      Extra post arguments.
	 * @return int Post ID.
	 */
	private function create_post( $title, $post_type = 'page', $age = 0, $args = array() ) {
		return self::factory()->post->create(
			array_merge(
				array(
					'post_title'  => $title,
					'post_type'   => $post_type,
					'post_status' => 'publish',
					'post_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '2026-01-01' ) - $age * DAY_IN_SECONDS ),
				),
				$args
			)
		);
	}

	/**
	 * Creates an attachment.
	 *
	 * @param string $title  Attachment title.
	 * @param int    $parent_id Parent post ID.
	 * @param string $file   Attached file.
	 * @return int Attachment ID.
	 */
	private function create_attachment( $title, $parent_id = 0, $file = 'image.jpg' ) {
		return self::factory()->attachment->create_object(
			$file,
			$parent_id,
			array(
				'post_title'     => $title,
				'post_mime_type' => 'image/jpeg',
			)
		);
	}

	public function test_register_routes() {
		$this->assertArrayHasKey( self::ROUTE, rest_get_server()->get_routes() );
	}

	public function test_rejects_users_who_cannot_edit_posts() {
		wp_set_current_user( self::$subscriber_id );

		$response = $this->get_suggestions( array( 'search' => 'coffee' ) );

		$this->assertErrorResponse( 'rest_forbidden', $response, 403 );
	}

	public function test_returns_the_fields_wp_v2_search_returns() {
		add_theme_support( 'post-formats', array( 'gallery' ) );
		set_post_format( $this->create_post( 'Unrelated', 'post' ), 'gallery' );
		$page_id       = $this->create_post( 'Gallery Page' );
		$category_id   = self::factory()->category->create( array( 'name' => 'Gallery Category' ) );
		$attachment_id = $this->create_attachment( 'Gallery Photo', 0, 'gallery-photo.jpg' );

		$data = $this->get_suggestions( array( 'search' => 'gallery' ) )->get_data();
		$self = array_map(
			function ( $item ) {
				return isset( $item['_links']['self'][0]['href'] ) ? $item['_links']['self'][0]['href'] : null;
			},
			$data
		);

		$this->assertSame(
			array(
				array(
					'id'      => $page_id,
					'title'   => 'Gallery Page',
					'url'     => get_permalink( $page_id ),
					'type'    => 'post',
					'subtype' => 'page',
				),
				array(
					'id'      => $category_id,
					'title'   => 'Gallery Category',
					'url'     => get_term_link( $category_id ),
					'type'    => 'term',
					'subtype' => 'category',
				),
				array(
					'id'      => 'gallery',
					'title'   => 'Gallery',
					'url'     => get_post_format_link( 'gallery' ),
					'type'    => 'post-format',
					'subtype' => 'post-format',
				),
				array(
					'id'      => $attachment_id,
					'title'   => 'Gallery Photo',
					'url'     => wp_get_attachment_url( $attachment_id ),
					'type'    => 'attachment',
					'subtype' => 'attachment',
				),
			),
			array_map(
				function ( $item ) {
					unset( $item['_links'] );
					return $item;
				},
				$data
			)
		);
		$this->assertSame(
			array(
				rest_url( rest_get_route_for_post( $page_id ) ),
				rest_url( rest_get_route_for_term( $category_id ) ),
				null, // Post formats have no route of their own, as in `/wp/v2/search`.
				rest_url( rest_get_route_for_post( $attachment_id ) ),
			),
			$self
		);
	}

	public function test_lets_a_search_plugin_supply_the_suggestions() {
		$this->create_post( 'Coffee Page' );
		$supplied = array(
			array(
				'id'      => 7,
				'title'   => 'From the search plugin',
				'url'     => 'https://example.org/elsewhere/',
				'type'    => 'post',
				'subtype' => 'page',
			),
		);
		$received = null;

		add_filter(
			'link_suggestions_pre_query',
			function ( $suggestions, $request ) use ( $supplied, &$received ) {
				$received = $request['search'];
				return array(
					'items' => $supplied,
					'total' => 31,
				);
			},
			10,
			2
		);

		$response = $this->get_suggestions(
			array(
				'search'   => 'coffee',
				'per_page' => 10,
			)
		);
		$headers  = $response->get_headers();

		$this->assertSame( 'coffee', $received );
		$this->assertSame( $supplied, $response->get_data() );
		$this->assertSame( 31, $headers['X-WP-Total'] );
		$this->assertSame( 4, $headers['X-WP-TotalPages'] );
	}

	/**
	 * Counts the searches run against the database while a callback runs.
	 *
	 * @param callable $callback Callback.
	 * @return int
	 */
	private function count_searches( $callback ) {
		$count  = 0;
		$filter = function ( $query ) use ( &$count ) {
			if ( false !== strpos( $query, 'AS title_words' ) ) {
				++$count;
			}
			return $query;
		};

		add_filter( 'query', $filter );
		$callback();
		remove_filter( 'query', $filter );

		return $count;
	}

	public function test_runs_one_query_for_a_page_of_suggestions() {
		$this->create_post( 'Coffee Page' );

		$this->assertSame(
			1,
			$this->count_searches(
				function () {
					$this->assertSame( array( 'Coffee Page' ), $this->get_titles( array( 'search' => 'coffee' ) ) );
				}
			)
		);
	}

	public function test_reports_the_total_for_a_page_past_the_last() {
		foreach ( array( 'Chai One', 'Chai Two', 'Chai Three' ) as $age => $title ) {
			$this->create_post( $title, 'page', $age );
		}

		$response = $this->get_suggestions(
			array(
				'search'   => 'chai',
				'per_page' => 1,
				'page'     => 5,
			)
		);
		$headers  = $response->get_headers();

		$this->assertSame( array(), $response->get_data() );
		$this->assertSame( 3, $headers['X-WP-Total'] );
		$this->assertSame( 3, $headers['X-WP-TotalPages'] );
	}

	public function test_reports_no_suggestions_without_a_second_query() {
		$searches = $this->count_searches(
			function () {
				$response = $this->get_suggestions( array( 'search' => 'zebra' ) );
				$this->assertSame( array(), $response->get_data() );
				$this->assertSame( 0, $response->get_headers()['X-WP-Total'] );
			}
		);

		$this->assertSame( 1, $searches );
	}

	public function test_answers_a_repeated_search_from_the_cache() {
		$this->create_post( 'Coffee Page' );
		$search = function () {
			$this->assertSame( array( 'Coffee Page' ), $this->get_titles( array( 'search' => 'coffee' ) ) );
		};

		$this->assertGreaterThan( 0, $this->count_searches( $search ) );
		$this->assertSame( 0, $this->count_searches( $search ) );
	}

	public function test_finds_posts_and_terms_added_after_a_search_was_cached() {
		$this->create_post( 'Coffee Page', 'page', 1 );
		$this->get_titles( array( 'search' => 'coffee' ) );

		$this->create_post( 'Coffee Post', 'post', 0 );
		$this->assertSame( array( 'Coffee Page', 'Coffee Post' ), $this->get_titles( array( 'search' => 'coffee' ) ) );

		self::factory()->category->create( array( 'name' => 'Coffee Category' ) );
		$this->assertContains( 'Coffee Category', $this->get_titles( array( 'search' => 'coffee' ) ) );
	}

	public function test_does_not_share_cached_suggestions_between_users_who_see_different_media() {
		$private_id = $this->create_post( 'Private Parent', 'page', 1, array( 'post_status' => 'private' ) );
		$this->create_attachment( 'Mocha Private Parent', $private_id );

		$this->assertSame( array( 'Mocha Private Parent' ), $this->get_titles( array( 'search' => 'mocha' ) ) );

		wp_set_current_user( self::$author_id );
		$this->assertSame( array(), $this->get_titles( array( 'search' => 'mocha' ) ) );
	}

	public function test_ranks_a_title_holding_what_was_typed_as_one_string_first() {
		$this->create_post( 'How to get from Stockholm to Helsinki by boat', 'page', 1 );
		$this->create_post( 'The art of packing lightly: How to travel with just a cabin bag', 'page', 2, array( 'post_content' => 'Tips inside.' ) );
		$this->create_post( 'Tips for travel with a young baby', 'page', 3 );
		self::factory()->category->create( array( 'name' => 'City Guides' ) );
		self::factory()->category->create( array( 'name' => 'Travel Tips' ) );

		$this->assertSame(
			array(
				'Travel Tips', // Holds "travel tips" as one string.
				'Tips for travel with a young baby', // Holds both words.
				'The art of packing lightly: How to travel with just a cabin bag', // Holds one.
			),
			$this->get_titles( array( 'search' => 'travel tips' ) )
		);
	}

	public function test_ranks_content_above_a_term_when_both_begin_with_the_search() {
		self::factory()->category->create( array( 'name' => 'Contact' ) );
		$this->create_post( 'Contact us today' );
		$this->create_post( 'Hello world!' );

		$this->assertSame(
			array( 'Contact us today', 'Contact' ),
			$this->get_titles( array( 'search' => 'contact' ) )
		);
	}

	public function test_ranks_a_whole_word_above_one_found_inside_a_longer_word() {
		$this->create_post( 'News', 'page', 1 );
		$this->create_post( 'Newspaper', 'page', 2 );
		$this->create_post( 'News Flash News', 'page', 3 );
		$this->create_post( 'News', 'page', 4 );

		$this->assertSame(
			array(
				'News',
				'News Flash News', // Repeating the word does not rank it higher.
				'News', // Ranks the same as the above, so older comes later.
				'Newspaper',
			),
			$this->get_titles( array( 'search' => 'news' ) )
		);
	}

	public function test_ranks_a_title_beginning_with_the_search_from_the_first_character() {
		$this->create_post( 'Tips for travel with a young baby', 'page', 1 );
		$this->create_post( 'A day trip from Stockholm to Swedish countryside towns', 'page', 2 );

		$this->assertSame(
			array(
				'A day trip from Stockholm to Swedish countryside towns',
				'Tips for travel with a young baby',
			),
			// Scoped to content, as every title holding an "a" matches, such as "Uncategorized".
			$this->get_titles(
				array(
					'search' => 'a',
					'type'   => 'post',
				)
			)
		);
	}

	public function test_ranks_an_attachment_that_begins_with_the_search_below_a_page_holding_it_further_in() {
		$this->create_attachment( 'coffee-beans', 0, 'coffee-beans.jpg' );
		$this->create_post( 'Our Coffee' );

		$this->assertSame(
			array( 'Our Coffee', 'coffee-beans' ),
			$this->get_titles( array( 'search' => 'coffee' ) )
		);
	}

	public function test_lifts_an_attachment_that_begins_with_the_search_when_media_is_preferred() {
		$this->create_attachment( 'coffee-beans', 0, 'coffee-beans.jpg' );
		$this->create_post( 'Our Coffee' );

		$this->assertSame(
			array( 'coffee-beans', 'Our Coffee' ),
			$this->get_titles(
				array(
					'search'       => 'coffee',
					'prefer_types' => array( 'attachment' ),
				)
			)
		);
	}

	public function test_ranks_a_title_beginning_with_the_search_above_one_holding_it_further_in_whatever_the_type() {
		$this->create_post( 'Coffee Equipment Gear Care' );
		self::factory()->category->create( array( 'name' => 'Gear' ) );
		self::factory()->category->create( array( 'name' => 'Coffee Gear' ) );

		$this->assertSame(
			array(
				'Gear', // Begins with the search.
				'Coffee Equipment Gear Care', // Holds it further in, and content ranks above terms.
				'Coffee Gear',
			),
			$this->get_titles( array( 'search' => 'gear' ) )
		);
	}

	public function test_does_not_share_a_page_with_titles_holding_the_search_further_in() {
		$this->create_post( 'Dark Roast Post', 'post' );
		$this->create_post( 'Dark Roast Page', 'page' );
		self::factory()->tag->create( array( 'name' => 'Roast Tag' ) );

		$first = $this->get_suggestions(
			array(
				'search'   => 'roast',
				'per_page' => 2,
			)
		)->get_data();

		$this->assertSame( 'Roast Tag', $first[0]['title'] );
	}

	public function test_matches_the_search_as_a_string_not_as_whole_words() {
		$this->create_post( 'Coffeehouse Rules', 'page', 1 );
		$this->create_post( 'Notes On Coffee', 'page', 2 );
		$this->create_post( 'Coffee of the World', 'page', 3 );

		$this->assertSame(
			array(
				'Coffee of the World', // Begins with the string, a whole word.
				'Coffeehouse Rules', // Begins with the string, inside a longer word.
				'Notes On Coffee', // Holds the string further in.
			),
			$this->get_titles( array( 'search' => 'coffee' ) )
		);
	}

	public function test_ranks_a_title_holding_every_word_above_one_holding_some() {
		$this->create_post( 'Coffee', 'page', 0, array( 'post_content' => 'A guide.' ) );
		self::factory()->category->create( array( 'name' => 'Our Coffee is a Guide' ) );
		$this->create_attachment( 'Our Coffee Guide' );

		$this->assertSame(
			array(
				'Our Coffee Guide', // Holds "coffee guide" as one string.
				'Our Coffee is a Guide', // Holds both words.
				'Coffee', // Holds one.
			),
			$this->get_titles( array( 'search' => 'coffee guide' ) )
		);
	}

	public function test_ranks_content_then_taxonomies_then_post_formats_then_attachments() {
		add_theme_support( 'post-formats', array( 'gallery' ) );
		set_post_format( $this->create_post( 'Unrelated', 'post', 9 ), 'gallery' );

		$this->create_attachment( 'Gallery Photo' );
		self::factory()->tag->create( array( 'name' => 'Gallery Tag' ) );
		$this->create_post( 'Gallery Post', 'post', 1 );
		self::factory()->category->create( array( 'name' => 'Gallery Category' ) );
		$this->create_post( 'Gallery Page', 'page', 2 );

		$data = $this->get_suggestions( array( 'search' => 'gallery' ) )->get_data();

		$this->assertSame(
			array( 'page', 'post', 'category', 'post_tag', 'post-format', 'attachment' ),
			wp_list_pluck( $data, 'subtype' )
		);
	}

	public function test_matches_titles_shown_with_curly_quotes_to_the_straight_quotes_typed() {
		$this->create_post( 'Barista S Best Coffee', 'page', 1, array( 'post_content' => "Barista's pick." ) );
		$this->create_post( 'Barista\'s "Best" Coffee', 'page', 2 );

		// Titles are stored with the straight quotes typed, and shown with curly ones.
		$this->assertSame(
			array( "Barista\u{2019}s \u{201C}Best\u{201D} Coffee", 'Barista S Best Coffee' ),
			array_map(
				'html_entity_decode',
				$this->get_titles( array( 'search' => 'barista\'s "best" coffee' ) )
			)
		);
	}

	public function test_ranks_a_title_holding_both_words_above_one_holding_a_single_word_whole() {
		$this->create_post( 'Coffee Beans', 'page', 1, array( 'post_content' => 'A guide.' ) );
		$this->create_post( 'Coffeehouse Guidebook', 'page', 2 );

		$this->assertSame(
			array( 'Coffeehouse Guidebook', 'Coffee Beans' ),
			$this->get_titles( array( 'search' => 'coffee guide' ) )
		);
	}

	public function test_ranks_a_word_found_in_a_longer_one_by_how_much_of_it_that_word_is() {
		$this->create_post( 'Caterpillar', 'page', 1 );
		$this->create_post( 'Catering', 'page', 2 );

		$this->assertSame(
			array( 'Catering', 'Caterpillar' ),
			$this->get_titles( array( 'search' => 'cater' ) )
		);
	}

	public function test_ranks_a_match_found_only_in_the_content_below_title_matches() {
		$this->create_post( 'Opening Hours', 'page', 1, array( 'post_content' => 'Espresso served all day.' ) );
		$this->create_post( 'Espresso Menu', 'page', 2 );

		$this->assertSame(
			array( 'Espresso Menu', 'Opening Hours' ),
			$this->get_titles( array( 'search' => 'espresso' ) )
		);
	}

	public function test_matches_media_by_caption_and_description() {
		self::factory()->attachment->create_object(
			'photo.jpg',
			0,
			array(
				'post_title'     => 'Photo',
				'post_excerpt'   => 'A ristretto shot.',
				'post_mime_type' => 'image/jpeg',
			)
		);
		self::factory()->attachment->create_object(
			'other.jpg',
			0,
			array(
				'post_title'     => 'Other',
				'post_content'   => 'Ristretto at the bar.',
				'post_mime_type' => 'image/jpeg',
			)
		);

		$this->assertEqualSets(
			array( 'Photo', 'Other' ),
			$this->get_titles( array( 'search' => 'ristretto' ) )
		);
	}

	public function test_does_not_require_stopwords_to_be_found() {
		$this->create_post( 'Daily Grind' );

		// Searches drop words like "the", as `WP_Query` does.
		$this->assertSame(
			array( 'Daily Grind' ),
			$this->get_titles( array( 'search' => 'the daily grind' ) )
		);
	}

	public function test_matches_a_quoted_phrase_as_one_term() {
		$this->create_post( 'Cold Brew Guide', 'page', 1 );
		$this->create_post( 'Brew It Cold', 'page', 2 );

		$this->assertSame(
			array( 'Cold Brew Guide' ),
			$this->get_titles( array( 'search' => '"cold brew"' ) )
		);
	}

	public function test_leaves_out_results_holding_a_word_typed_with_a_minus() {
		$this->create_post( 'Coffee Beans', 'page', 1 );
		$this->create_post( 'Decaf Coffee', 'page', 2 );
		$this->create_post( 'Coffee Notes', 'page', 3, array( 'post_content' => 'Decaf too.' ) );

		$this->assertSame(
			array( 'Coffee Beans' ),
			$this->get_titles( array( 'search' => 'coffee -decaf' ) )
		);
	}

	public function test_leaves_out_drafts_and_private_posts() {
		$this->create_post( 'Latte Draft', 'page', 1, array( 'post_status' => 'draft' ) );
		$this->create_post( 'Latte Private', 'page', 2, array( 'post_status' => 'private' ) );
		$this->create_post( 'Latte Published', 'page', 3 );

		$this->assertSame(
			array( 'Latte Published' ),
			$this->get_titles( array( 'search' => 'latte' ) )
		);
	}

	public function test_leaves_out_media_attached_to_a_post_the_user_cannot_read() {
		$private_id = $this->create_post( 'Private Parent', 'page', 1, array( 'post_status' => 'private' ) );
		$this->create_attachment( 'Mocha Private Parent', $private_id );
		$this->create_attachment( 'Mocha Unattached' );

		wp_set_current_user( self::$author_id );

		$this->assertSame(
			array( 'Mocha Unattached' ),
			$this->get_titles( array( 'search' => 'mocha' ) )
		);
	}

	public function test_includes_media_attached_to_a_post_the_user_can_read() {
		$private_id = $this->create_post( 'Private Parent', 'page', 1, array( 'post_status' => 'private' ) );
		$this->create_attachment( 'Mocha Private Parent', $private_id );

		$this->assertSame(
			array( 'Mocha Private Parent' ),
			$this->get_titles( array( 'search' => 'mocha' ) )
		);
	}

	public function test_does_not_match_media_by_file_name() {
		$this->create_attachment( 'Beach', 0, 'sunset-beach.jpg' );

		// Media is matched by its title, caption and description. Its title is the file name when
		// uploaded, unless the image names itself or someone renames it.
		$this->assertSame(
			array(),
			$this->get_titles( array( 'search' => 'sunset beach' ) )
		);
	}

	public function test_filters_by_type_and_subtype() {
		$this->create_post( 'Chai Post', 'post' );
		$this->create_post( 'Chai Page', 'page' );
		self::factory()->category->create( array( 'name' => 'Chai Category' ) );
		self::factory()->tag->create( array( 'name' => 'Chai Tag' ) );
		$this->create_attachment( 'Chai Photo' );

		$this->assertSame(
			array( 'Chai Page' ),
			$this->get_titles(
				array(
					'search'  => 'chai',
					'type'    => 'post',
					'subtype' => 'page',
				)
			)
		);
		$this->assertSame(
			array( 'Chai Category' ),
			$this->get_titles(
				array(
					'search'  => 'chai',
					'type'    => 'term',
					'subtype' => 'category',
				)
			)
		);
		$this->assertSame(
			array( 'Chai Photo' ),
			$this->get_titles(
				array(
					'search' => 'chai',
					'type'   => 'attachment',
				)
			)
		);
	}

	public function test_leaves_out_post_formats_when_excluded() {
		add_theme_support( 'post-formats', array( 'gallery' ) );
		set_post_format( $this->create_post( 'Unrelated', 'post' ), 'gallery' );

		$with    = $this->get_suggestions( array( 'search' => 'gallery' ) )->get_data();
		$without = $this->get_suggestions(
			array(
				'search'       => 'gallery',
				'type_exclude' => array( 'post-format' ),
			)
		)->get_data();

		$this->assertSame( array( 'post-format' ), wp_list_pluck( $with, 'subtype' ) );
		$this->assertSame( array(), $without );
	}

	/**
	 * Creates one match of each type for "chai".
	 */
	private function create_one_of_each_type() {
		$this->create_post( 'Chai Post', 'post' );
		$this->create_post( 'Chai Page', 'page' );
		self::factory()->category->create( array( 'name' => 'Chai Category' ) );
		self::factory()->tag->create( array( 'name' => 'Chai Tag' ) );
		$this->create_attachment( 'Chai Photo' );
	}

	public function test_searches_only_the_types_asked_for() {
		$this->create_one_of_each_type();

		$this->assertEqualSets(
			array( 'Chai Post', 'Chai Page', 'Chai Photo' ),
			$this->get_titles(
				array(
					'search' => 'chai',
					'type'   => array( 'post', 'attachment' ),
				)
			)
		);
	}

	public function test_searches_only_the_subtypes_asked_for() {
		$this->create_one_of_each_type();

		$this->assertEqualSets(
			array( 'Chai Page', 'Chai Category' ),
			$this->get_titles(
				array(
					'search'  => 'chai',
					'subtype' => array( 'page', 'category' ),
				)
			)
		);
	}

	public function test_leaves_out_the_types_excluded() {
		$this->create_one_of_each_type();

		$this->assertEqualSets(
			array( 'Chai Post', 'Chai Page', 'Chai Category', 'Chai Tag' ),
			$this->get_titles(
				array(
					'search'       => 'chai',
					'type_exclude' => array( 'attachment' ),
				)
			)
		);
	}

	public function test_leaves_out_the_subtypes_excluded() {
		$this->create_one_of_each_type();

		$this->assertEqualSets(
			array( 'Chai Post', 'Chai Page', 'Chai Category', 'Chai Photo' ),
			$this->get_titles(
				array(
					'search'          => 'chai',
					'subtype_exclude' => array( 'post_tag' ),
				)
			)
		);
	}

	public function test_leaves_out_a_subtype_both_asked_for_and_excluded() {
		$this->create_one_of_each_type();

		$this->assertSame(
			array( 'Chai Page' ),
			$this->get_titles(
				array(
					'search'          => 'chai',
					'subtype'         => array( 'page', 'category' ),
					'subtype_exclude' => array( 'category' ),
				)
			)
		);
	}

	public function test_does_not_search_post_types_or_taxonomies_that_are_not_public() {
		$this->create_post( 'Chai Synced Pattern', 'wp_block' );

		$this->assertSame(
			array(),
			$this->get_titles(
				array(
					'search'  => 'chai',
					'subtype' => array( 'wp_block' ),
				)
			)
		);
	}

	public function test_counts_only_the_results_the_filters_keep() {
		foreach ( array( 'Chai One', 'Chai Two', 'Chai Three' ) as $age => $title ) {
			$this->create_post( $title, 'page', $age );
		}
		self::factory()->category->create( array( 'name' => 'Chai Category' ) );
		self::factory()->category->create( array( 'name' => 'Chai Category Two' ) );

		$response = $this->get_suggestions(
			array(
				'search'   => 'chai',
				'subtype'  => array( 'page' ),
				'per_page' => 2,
			)
		);
		$headers  = $response->get_headers();

		$this->assertSame( 3, $headers['X-WP-Total'] );
		$this->assertSame( 2, $headers['X-WP-TotalPages'] );
		$this->assertSame( array( 'Chai One', 'Chai Two' ), wp_list_pluck( $response->get_data(), 'title' ) );
	}

	public function test_ranks_pages_above_other_content_that_matches_as_well() {
		$this->create_post( 'Coffee Post', 'post', 0 );
		$this->create_post( 'Coffee Page', 'page', 1 );

		// The post is newer, which would otherwise put it first.
		$this->assertSame( array( 'Coffee Page', 'Coffee Post' ), $this->get_titles( array( 'search' => 'coffee' ) ) );
	}

	public function test_ranks_posts_above_pages_when_posts_are_preferred() {
		$this->create_post( 'Coffee Post', 'post', 1 );
		$this->create_post( 'Coffee Page', 'page', 0 );

		$this->assertSame(
			array( 'Coffee Post', 'Coffee Page' ),
			$this->get_titles(
				array(
					'search'       => 'coffee',
					'prefer_types' => array(
						array(
							'type'    => 'post',
							'subtype' => 'post',
						),
					),
				)
			)
		);
	}

	public function test_ranks_the_preferred_subtype_above_the_usual_type_order() {
		$this->create_post( 'Coffee Guide' );
		self::factory()->category->create( array( 'name' => 'Coffee' ) );

		$this->assertSame(
			array( 'Coffee', 'Coffee Guide' ),
			$this->get_titles(
				array(
					'search'       => 'coffee',
					'prefer_types' => array(
						array(
							'type'    => 'term',
							'subtype' => 'category',
						),
					),
				)
			)
		);
	}

	public function test_ranks_preferred_types_in_the_order_given() {
		$this->create_post( 'Latte Page' );
		self::factory()->category->create( array( 'name' => 'Latte Category' ) );
		self::factory()->tag->create( array( 'name' => 'Latte Tag' ) );

		$this->assertSame(
			array( 'Latte Tag', 'Latte Category', 'Latte Page' ),
			$this->get_titles(
				array(
					'search'       => 'latte',
					'prefer_types' => array(
						array(
							'type'    => 'term',
							'subtype' => 'post_tag',
						),
						array(
							'type'    => 'term',
							'subtype' => 'category',
						),
					),
				)
			)
		);
	}

	public function test_prefers_every_subtype_of_a_preferred_search_type() {
		$this->create_post( 'Latte Page' );
		self::factory()->category->create( array( 'name' => 'Latte Category' ) );
		self::factory()->tag->create( array( 'name' => 'Latte Tag' ) );

		$this->assertSame(
			array( 'Latte Category', 'Latte Tag', 'Latte Page' ),
			$this->get_titles(
				array(
					'search'       => 'latte',
					'prefer_types' => array( 'term' ),
				)
			)
		);
	}

	public function test_does_not_rank_a_preferred_type_above_a_better_match() {
		$this->create_post( 'Gear Guide' );
		self::factory()->category->create( array( 'name' => 'Coffee Gear' ) );

		// The page begins with the search, the category holds it further in.
		$this->assertSame(
			array( 'Gear Guide', 'Coffee Gear' ),
			$this->get_titles(
				array(
					'search'       => 'gear',
					'prefer_types' => array(
						array(
							'type'    => 'term',
							'subtype' => 'category',
						),
					),
				)
			)
		);
	}

	public function test_brings_a_preferred_type_onto_the_first_page() {
		$this->create_post( 'Brew Post', 'post' );
		$this->create_post( 'Brew Page', 'page' );
		self::factory()->category->create( array( 'name' => 'Brew Category' ) );

		$params = array(
			'search'   => 'brew',
			'per_page' => 2,
		);

		$this->assertNotContains( 'Brew Category', $this->get_titles( $params ) );
		$this->assertContains(
			'Brew Category',
			$this->get_titles(
				array_merge(
					$params,
					array(
						'prefer_types' => array(
							array(
								'type'    => 'term',
								'subtype' => 'category',
							),
						),
					)
				)
			)
		);
	}

	public function test_pages_hold_every_match_once_and_report_the_total() {
		foreach ( array( 'Mocha One', 'Mocha Two', 'Mocha Three', 'Mocha Four', 'Mocha Five' ) as $age => $title ) {
			$this->create_post( $title, 'page', $age );
		}
		self::factory()->category->create( array( 'name' => 'Mocha Category' ) );
		$this->create_attachment( 'Mocha Photo' );

		$paged = array();
		foreach ( array( 1, 2, 3, 4 ) as $page ) {
			$response = $this->get_suggestions(
				array(
					'search'   => 'mocha',
					'per_page' => 2,
					'page'     => $page,
				)
			);
			$headers  = $response->get_headers();

			$this->assertSame( 7, $headers['X-WP-Total'] );
			$this->assertSame( 4, $headers['X-WP-TotalPages'] );

			$paged = array_merge( $paged, wp_list_pluck( $response->get_data(), 'title' ) );
		}

		$this->assertEqualSets(
			array( 'Mocha One', 'Mocha Two', 'Mocha Three', 'Mocha Four', 'Mocha Five', 'Mocha Category', 'Mocha Photo' ),
			$paged
		);
	}

	public function test_shares_a_page_evenly_between_kinds_that_match_equally_well() {
		foreach ( array( 'Brew One', 'Brew Two', 'Brew Three', 'Brew Four' ) as $age => $title ) {
			$this->create_post( $title, 'page', $age );
		}
		foreach ( array( 'Brew Category A', 'Brew Category B', 'Brew Category C' ) as $name ) {
			self::factory()->category->create( array( 'name' => $name ) );
		}
		foreach ( array( 'Brew Photo A', 'Brew Photo B', 'Brew Photo C' ) as $title ) {
			$this->create_attachment( $title );
		}

		$data = $this->get_suggestions(
			array(
				'search'   => 'brew',
				'per_page' => 6,
			)
		)->get_data();

		// Two of each kind, shown in the order they rank in.
		$this->assertSame(
			array( 'post', 'post', 'term', 'term', 'attachment', 'attachment' ),
			wp_list_pluck( $data, 'type' )
		);
		$this->assertSame( array( 'Brew One', 'Brew Two' ), array_slice( wp_list_pluck( $data, 'title' ), 0, 2 ) );
	}

	public function test_shares_a_page_evenly_between_post_types_and_taxonomies() {
		// Posts are newer, so they would take every slot for content if posts and pages shared one.
		foreach ( array( 'Brew Post A', 'Brew Post B', 'Brew Post C' ) as $age => $title ) {
			$this->create_post( $title, 'post', $age );
		}
		foreach ( array( 'Brew Page A', 'Brew Page B', 'Brew Page C' ) as $age => $title ) {
			$this->create_post( $title, 'page', 10 + $age );
		}
		foreach ( array( 'Brew Category A', 'Brew Category B' ) as $name ) {
			self::factory()->category->create( array( 'name' => $name ) );
		}
		foreach ( array( 'Brew Tag A', 'Brew Tag B' ) as $name ) {
			self::factory()->tag->create( array( 'name' => $name ) );
		}

		$data = $this->get_suggestions(
			array(
				'search'   => 'brew',
				'per_page' => 4,
			)
		)->get_data();

		$this->assertSame( array( 'page', 'post', 'category', 'post_tag' ), wp_list_pluck( $data, 'subtype' ) );
	}

	public function test_carries_the_share_onto_later_pages_when_more_types_match_than_fit() {
		$this->create_post( 'Drip Post', 'post' );
		$this->create_post( 'Drip Page', 'page' );
		self::factory()->category->create( array( 'name' => 'Drip Category' ) );
		self::factory()->tag->create( array( 'name' => 'Drip Tag' ) );
		$this->create_attachment( 'Drip Photo' );
		$this->create_post( 'Drip Post Two', 'post', 1 );
		$this->create_post( 'Drip Page Two', 'page', 1 );

		$types = array();
		foreach ( array( 1, 2, 3 ) as $page ) {
			$types[ $page ] = wp_list_pluck(
				$this->get_suggestions(
					array(
						'search'   => 'drip',
						'per_page' => 2,
						'page'     => $page,
					)
				)->get_data(),
				'subtype'
			);
		}

		// Every type gets its first turn before any type gets a second.
		$this->assertEqualSets( array( 'post', 'page', 'category', 'post_tag' ), array_merge( $types[1], $types[2] ) );
		// Then the second turns begin, after the last first turn.
		$this->assertCount( 2, $types[3] );
		$this->assertContains( 'attachment', $types[3] );
	}

	public function test_gives_the_share_of_a_kind_that_runs_out_to_the_others() {
		foreach ( array( 'Pour One', 'Pour Two', 'Pour Three', 'Pour Four', 'Pour Five' ) as $age => $title ) {
			$this->create_post( $title, 'page', $age );
		}
		self::factory()->category->create( array( 'name' => 'Pour Category' ) );

		$first  = $this->get_suggestions(
			array(
				'search'   => 'pour',
				'per_page' => 4,
			)
		)->get_data();
		$second = $this->get_suggestions(
			array(
				'search'   => 'pour',
				'per_page' => 4,
				'page'     => 2,
			)
		)->get_data();

		$this->assertSame( array( 'post', 'post', 'post', 'term' ), wp_list_pluck( $first, 'type' ) );
		$this->assertSame( array( 'Pour Four', 'Pour Five' ), wp_list_pluck( $second, 'title' ) );
	}

	public function test_does_not_share_a_page_with_a_kind_that_only_matches_less_well() {
		foreach ( array( 'Latte One', 'Latte Two', 'Latte Three' ) as $age => $title ) {
			$this->create_post( $title, 'page', $age );
		}
		self::factory()->attachment->create_object(
			'photo.jpg',
			0,
			array(
				'post_title'     => 'Photo',
				'post_content'   => 'Latte art.',
				'post_mime_type' => 'image/jpeg',
			)
		);

		$first = $this->get_suggestions(
			array(
				'search'   => 'latte',
				'per_page' => 2,
			)
		)->get_data();

		// The photo only mentions the word in its description, so every title match comes first.
		$this->assertSame( array( 'Latte One', 'Latte Two' ), wp_list_pluck( $first, 'title' ) );
		$this->assertSame(
			array( 'Latte One', 'Latte Two', 'Latte Three', 'Photo' ),
			$this->get_titles( array( 'search' => 'latte' ) )
		);
	}

	public function test_ranks_by_match_alone_where_the_database_cannot_share_pages_between_kinds() {
		foreach ( array( 'Brew One', 'Brew Two', 'Brew Three', 'Brew Four' ) as $age => $title ) {
			$this->create_post( $title, 'page', $age );
		}
		self::factory()->category->create( array( 'name' => 'Brew Category' ) );

		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_query_params(
			array(
				'search'   => 'brew',
				'page'     => 1,
				'per_page' => 2,
			)
		);

		// The controller as it runs on a database without window functions, such as MySQL 5.7.
		$controller = new class() extends Gutenberg_REST_Link_Suggestions_Controller {
			protected function supports_window_functions() {
				return false;
			}
		};
		$data       = $controller->get_items( $request )->get_data();

		$this->assertSame( array( 'Brew One', 'Brew Two' ), wp_list_pluck( $data, 'title' ) );
	}

	public function test_lists_pages_then_other_content_newest_first_when_nothing_is_typed() {
		_delete_all_posts();
		self::factory()->category->create( array( 'name' => 'Some Category' ) );
		$this->create_post( 'Older', 'page', 2 );
		$this->create_post( 'Newest', 'post', 0 );
		$this->create_post( 'Middle', 'page', 1 );

		$this->assertSame(
			array( 'Middle', 'Older', 'Newest' ),
			$this->get_titles( array( 'per_page' => 3 ) )
		);
	}
}
