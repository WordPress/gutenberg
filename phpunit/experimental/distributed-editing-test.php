<?php
/**
 * Unit tests covering the distributed editing prototype engine.
 *
 * These tests exercise the security invariant of the blessing save model:
 * accepted content only ever contains chunks that are byte-identical to
 * previously accepted content, kses-filtered, or explicitly hash-approved by a
 * user with unfiltered_html.
 *
 * @package gutenberg
 */

/**
 * Tests for Gutenberg_Distributed_Editing_Engine.
 *
 * @covers Gutenberg_Distributed_Editing_Engine
 */
class Gutenberg_Distributed_Editing_Engine_Test extends WP_UnitTestCase {
	/**
	 * Administrator user ID (has unfiltered_html on single site).
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Author user ID (lacks unfiltered_html).
	 *
	 * @var int
	 */
	protected static $author_id;

	/**
	 * Engine under test.
	 *
	 * @var Gutenberg_Distributed_Editing_Engine
	 */
	protected $engine;

	/**
	 * Test post ID.
	 *
	 * @var int
	 */
	protected $post_id;

	const PARAGRAPH = "<!-- wp:paragraph -->\n<p>Hello world.</p>\n<!-- /wp:paragraph -->";

	const PARAGRAPH_EDITED = "<!-- wp:paragraph -->\n<p>Hello, edited world.</p>\n<!-- /wp:paragraph -->";

	const SCRIPT_BLOCK = "<!-- wp:html -->\n<script>document.title = 'accepted';</script>\n<!-- /wp:html -->";

	const SCRIPT_BLOCK_EDITED = "<!-- wp:html -->\n<script>document.title = 'proposed';</script>\n<!-- /wp:html -->";

	/**
	 * Creates shared fixture users.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetupBeforeClass( $factory ) {
		self::$admin_id  = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$author_id = $factory->user->create( array( 'role' => 'author' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$author_id );
	}

	public function set_up() {
		parent::set_up();

		if ( is_multisite() ) {
			$this->markTestSkipped( 'Administrators lack unfiltered_html on multisite; the approval scenarios assume single site.' );
		}

		$this->engine = new Gutenberg_Distributed_Editing_Engine();

		wp_set_current_user( self::$admin_id );
		$this->post_id = self::factory()->post->create(
			array(
				'post_author'  => self::$admin_id,
				'post_content' => self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK,
			)
		);

		// The factory insert runs while kses filters may be active for the
		// current request; ensure the fixture content is stored verbatim.
		kses_remove_filters();
		wp_update_post(
			array(
				'ID'           => $this->post_id,
				'post_content' => wp_slash( self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK ),
			)
		);
		kses_init();
	}

	/**
	 * Returns the stored content of the test post.
	 *
	 * @return string Post content.
	 */
	private function stored_content() {
		return get_post( $this->post_id )->post_content;
	}

	/**
	 * Returns the pending-review wrapper chunks of the stored content.
	 *
	 * @return array[] Wrapper info: exact chunk bytes and parsed attributes.
	 */
	private function stored_wrappers() {
		$wrappers = array();
		foreach ( $this->engine->split_top_level_chunks( $this->stored_content() ) as $chunk ) {
			if ( 0 === strpos( $chunk, '<!-- wp:de/pending-review' ) ) {
				$parsed     = parse_blocks( $chunk );
				$wrappers[] = array(
					'chunk' => $chunk,
					'attrs' => $parsed[0]['attrs'],
				);
			}
		}
		return $wrappers;
	}

	public function test_chunk_split_reproduces_input_bytes() {
		$content = "<p>freeform lead</p>\n" .
			"<!-- wp:group -->\n<div class=\"wp-block-group\">" .
			"<!-- wp:html -->\n<script>alert(1);</script>\n<!-- /wp:html -->" .
			"</div>\n<!-- /wp:group -->\n\n" .
			'<!-- wp:separator /-->' .
			"\n\ntrailing freeform";

		$chunks = $this->engine->split_top_level_chunks( $content );

		$this->assertSame( $content, implode( '', $chunks ), 'Concatenated chunks must reproduce the input byte for byte.' );
		$this->assertContains( '<!-- wp:separator /-->', $chunks, 'Void blocks are their own chunks.' );

		// The nested html block must remain inside the group chunk, not split out.
		$group_chunks = array_filter(
			$chunks,
			static function ( $chunk ) {
				return 0 === strpos( $chunk, '<!-- wp:group' );
			}
		);
		$this->assertCount( 1, $group_chunks );
		$this->assertStringContainsString( '<script>alert(1);</script>', array_shift( $group_chunks ) );
	}

	public function test_stale_base_version_is_rejected() {
		$result = $this->engine->save(
			$this->post_id,
			self::PARAGRAPH_EDITED . "\n\n" . self::SCRIPT_BLOCK,
			'v1:not-the-current-version',
			array(),
			self::$author_id
		);

		$this->assertWPError( $result );
		$this->assertSame( 'de_stale_base', $result->get_error_code() );
		$this->assertSame( self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK, $this->stored_content(), 'A stale save must not change the post.' );

		$data = $result->get_error_data();
		$this->assertSame( $this->engine->get_version( $this->post_id ), $data['version'], 'The rejection must carry the current version for client rebase.' );
	}

	public function test_untouched_protected_block_survives_unprivileged_save() {
		$this->assertFalse( user_can( self::$author_id, 'unfiltered_html' ) );

		$result = $this->engine->save(
			$this->post_id,
			self::PARAGRAPH_EDITED . "\n\n" . self::SCRIPT_BLOCK,
			$this->engine->get_version( $this->post_id ),
			array(),
			self::$author_id
		);

		$this->assertIsArray( $result );
		$this->assertSame( array(), $result['sequestered'] );
		$this->assertSame(
			self::PARAGRAPH_EDITED . "\n\n" . self::SCRIPT_BLOCK,
			$this->stored_content(),
			'An untouched protected block must survive an unprivileged save byte for byte.'
		);
	}

	public function test_unprivileged_protected_change_is_sequestered_and_kses_filtered() {
		$result = $this->engine->save(
			$this->post_id,
			self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK_EDITED,
			$this->engine->get_version( $this->post_id ),
			array(),
			self::$author_id
		);

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result['sequestered'] );

		$content = $this->stored_content();
		$this->assertStringNotContainsString( '<script', $content, 'The unapproved protected change must be kses-filtered.' );
		$this->assertStringNotContainsString( 'document.title = \'accepted\';', $content, 'The old protected chunk was replaced (as kses output), not kept.' );

		$wrappers = $this->stored_wrappers();
		$this->assertCount( 1, $wrappers );
		$this->assertSame( self::$author_id, $wrappers[0]['attrs']['proposer'], 'Audit: the wrapper must record its true proposer.' );
		$this->assertSame( self::SCRIPT_BLOCK_EDITED, $wrappers[0]['attrs']['proposed'], 'The original proposed bytes ride in the wrapper attributes as inert data.' );
	}

	public function test_privileged_unapproved_protected_change_is_sequestered() {
		$result = $this->engine->save(
			$this->post_id,
			self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK_EDITED,
			$this->engine->get_version( $this->post_id ),
			array(),
			self::$admin_id
		);

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result['sequestered'], 'Default-deny applies to privileged savers too: unapproved changes sequester.' );
		$this->assertStringNotContainsString( '<script', $this->stored_content() );

		$wrappers = $this->stored_wrappers();
		$this->assertCount( 1, $wrappers );
		$this->assertSame( self::$admin_id, $wrappers[0]['attrs']['proposer'] );
	}

	public function test_privileged_approved_protected_change_is_accepted_verbatim() {
		$result = $this->engine->save(
			$this->post_id,
			self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK_EDITED,
			$this->engine->get_version( $this->post_id ),
			array( $this->engine->hash_chunk( self::SCRIPT_BLOCK_EDITED ) ),
			self::$admin_id
		);

		$this->assertIsArray( $result );
		$this->assertSame( self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK_EDITED, $this->stored_content() );
	}

	public function test_approval_is_hash_pinned_against_toctou() {
		// The admin reviewed and approved one version of the chunk, but the save
		// carries different bytes (e.g. a late remote update landed in between).
		$approved_but_stale = $this->engine->hash_chunk( "<!-- wp:html -->\n<script>document.title = 'reviewed-earlier';</script>\n<!-- /wp:html -->" );

		$result = $this->engine->save(
			$this->post_id,
			self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK_EDITED,
			$this->engine->get_version( $this->post_id ),
			array( $approved_but_stale ),
			self::$admin_id
		);

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result['sequestered'], 'An approval for different bytes must not cover the changed chunk.' );
		$this->assertStringNotContainsString( '<script', $this->stored_content() );
	}

	public function test_approval_from_unprivileged_user_is_ignored() {
		$result = $this->engine->save(
			$this->post_id,
			self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK_EDITED,
			$this->engine->get_version( $this->post_id ),
			array( $this->engine->hash_chunk( self::SCRIPT_BLOCK_EDITED ) ),
			self::$author_id
		);

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result['sequestered'], 'Approvals from users without unfiltered_html carry no weight.' );
		$this->assertStringNotContainsString( '<script', $this->stored_content() );
	}

	public function test_wrapper_is_kses_stable_and_passes_through_untouched() {
		$this->engine->save(
			$this->post_id,
			self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK_EDITED,
			$this->engine->get_version( $this->post_id ),
			array(),
			self::$author_id
		);
		$wrappers = $this->stored_wrappers();
		$this->assertCount( 1, $wrappers );
		$wrapper = $wrappers[0]['chunk'];

		$this->assertFalse( $this->engine->is_protected_chunk( $wrapper ), 'The wrapper must be kses-stable so it survives unprivileged saves.' );

		// A later unprivileged save that edits around the wrapper preserves it.
		$result = $this->engine->save(
			$this->post_id,
			self::PARAGRAPH_EDITED . "\n\n" . $wrapper,
			$this->engine->get_version( $this->post_id ),
			array(),
			self::$author_id
		);
		$this->assertIsArray( $result );
		$this->assertStringContainsString( $wrapper, $this->stored_content(), 'An untouched wrapper must survive byte for byte.' );
	}

	public function test_approving_wrapped_proposal_via_save_applies_exact_bytes() {
		$this->engine->save(
			$this->post_id,
			self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK_EDITED,
			$this->engine->get_version( $this->post_id ),
			array(),
			self::$author_id
		);
		$wrappers = $this->stored_wrappers();
		$proposed = $wrappers[0]['attrs']['proposed'];
		$this->assertSame( self::SCRIPT_BLOCK_EDITED, $proposed );

		// The reviewer unwraps in the editor and saves with the approval hash.
		$content = str_replace( $wrappers[0]['chunk'], $proposed, $this->stored_content() );
		$result  = $this->engine->save(
			$this->post_id,
			$content,
			$this->engine->get_version( $this->post_id ),
			array( $this->engine->hash_chunk( $proposed ) ),
			self::$admin_id
		);

		$this->assertIsArray( $result );
		$this->assertSame( array(), $result['sequestered'] );
		$this->assertStringContainsString( self::SCRIPT_BLOCK_EDITED, $this->stored_content() );
		$this->assertSame( array(), $this->stored_wrappers(), 'The wrapper is gone once the proposal is approved.' );
	}

	public function test_approving_without_privilege_resequesters() {
		$this->engine->save(
			$this->post_id,
			self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK_EDITED,
			$this->engine->get_version( $this->post_id ),
			array(),
			self::$author_id
		);
		$wrappers = $this->stored_wrappers();
		$content  = str_replace( $wrappers[0]['chunk'], $wrappers[0]['attrs']['proposed'], $this->stored_content() );

		$result = $this->engine->save(
			$this->post_id,
			$content,
			$this->engine->get_version( $this->post_id ),
			array( $this->engine->hash_chunk( $wrappers[0]['attrs']['proposed'] ) ),
			self::$author_id
		);

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result['sequestered'], 'Approvals from users without unfiltered_html carry no weight; the unwrap sequesters again.' );
		$this->assertStringNotContainsString( '<script', $this->stored_content() );
		$this->assertCount( 1, $this->stored_wrappers() );
	}

	public function test_rejecting_wrapped_proposal_keeps_placeholder() {
		$this->engine->save(
			$this->post_id,
			self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK_EDITED,
			$this->engine->get_version( $this->post_id ),
			array(),
			self::$author_id
		);
		$wrappers    = $this->stored_wrappers();
		$placeholder = $wrappers[0]['attrs']['placeholder'];

		// Reject = replace the wrapper with its kses-filtered placeholder.
		$content = str_replace( $wrappers[0]['chunk'], $placeholder, $this->stored_content() );
		$result  = $this->engine->save(
			$this->post_id,
			$content,
			$this->engine->get_version( $this->post_id ),
			array(),
			self::$author_id
		);

		$this->assertIsArray( $result );
		$this->assertSame( array(), $result['sequestered'], 'The placeholder is kses-clean and needs no approval.' );
		$this->assertSame( array(), $this->stored_wrappers() );
		$this->assertStringNotContainsString( '<script', $this->stored_content() );
	}

	public function test_crafted_review_block_payload_stays_inert() {
		// An unprivileged user can hand-craft a wrapper carrying a malicious
		// payload; it must persist as inert attribute data, never as an active
		// chunk, until an explicit privileged unwrap-and-approve.
		$crafted = $this->engine->wrap_pending_review(
			"<!-- wp:html -->\n<script>document.title = 'crafted';</script>\n<!-- /wp:html -->",
			"<!-- wp:paragraph -->\n<p>Looks harmless.</p>\n<!-- /wp:paragraph -->",
			'crafted-id',
			self::$author_id
		);

		$result = $this->engine->save(
			$this->post_id,
			self::PARAGRAPH . "\n\n" . $crafted,
			$this->engine->get_version( $this->post_id ),
			array(),
			self::$author_id
		);

		$this->assertIsArray( $result );
		$this->assertSame( array(), $result['sequestered'], 'A crafted wrapper with a safe placeholder passes through; its proposed payload is inert.' );
		$this->assertSame( self::PARAGRAPH . "\n\n" . $crafted, $this->stored_content() );
		$this->assertStringNotContainsString( '<script', $this->stored_content(), 'The payload is escaped attribute data, not active markup.' );
	}

	public function test_crafted_review_block_with_dangerous_placeholder_is_resequestered() {
		// The front-end render callback outputs the placeholder, so a wrapper
		// whose placeholder itself carries active markup is dangerous and must
		// be treated as protected, not passed through.
		$crafted = $this->engine->wrap_pending_review(
			"<!-- wp:paragraph -->\n<p>anything</p>\n<!-- /wp:paragraph -->",
			"<!-- wp:html -->\n<script>document.title = 'via-placeholder';</script>\n<!-- /wp:html -->",
			'crafted-danger',
			self::$author_id
		);

		$result = $this->engine->save(
			$this->post_id,
			self::PARAGRAPH . "\n\n" . $crafted,
			$this->engine->get_version( $this->post_id ),
			array(),
			self::$author_id
		);

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result['sequestered'], 'A wrapper with a dangerous placeholder must be re-sequestered.' );

		// The re-sequestering wrapper's own placeholder is kses-clean.
		$wrappers = $this->stored_wrappers();
		$this->assertCount( 1, $wrappers );
		$this->assertSame(
			wp_kses_post( $wrappers[0]['attrs']['placeholder'] ),
			$wrappers[0]['attrs']['placeholder'],
			'The neutralizing wrapper renders a kses-clean placeholder.'
		);
	}

	public function test_pure_protected_deletion_is_allowed_and_reported() {
		$result = $this->engine->save(
			$this->post_id,
			self::PARAGRAPH_EDITED,
			$this->engine->get_version( $this->post_id ),
			array(),
			self::$author_id
		);

		$this->assertIsArray( $result );
		$this->assertSame( 1, $result['deleted_protected'], 'Protected deletions are accepted but reported.' );
		$this->assertSame( self::PARAGRAPH_EDITED, $this->stored_content() );
	}

	public function test_version_tracks_any_accepted_change() {
		$v1 = $this->engine->get_version( $this->post_id );

		$result = $this->engine->save(
			$this->post_id,
			self::PARAGRAPH_EDITED . "\n\n" . self::SCRIPT_BLOCK,
			$v1,
			array(),
			self::$author_id
		);

		$this->assertIsArray( $result );
		$this->assertNotSame( $v1, $result['version'] );
		$this->assertSame( $result['version'], $this->engine->get_version( $this->post_id ) );

		// A change made outside the engine (plugin, direct call) also moves the
		// version, so stale distributed saves cannot clobber it.
		kses_remove_filters();
		wp_update_post(
			array(
				'ID'           => $this->post_id,
				'post_content' => wp_slash( 'external change' ),
			)
		);
		kses_init();
		$this->assertNotSame( $result['version'], $this->engine->get_version( $this->post_id ) );

		$stale = $this->engine->save( $this->post_id, 'anything', $result['version'], array(), self::$author_id );
		$this->assertWPError( $stale );
		$this->assertSame( 'de_stale_base', $stale->get_error_code() );
	}

	public function test_rest_save_roundtrip() {
		// The author must be able to edit_post; the shared fixture post belongs
		// to the admin, so hand this one to the author (the protected script
		// block inside it still belongs to no one — chunks carry no ownership).
		wp_update_post(
			array(
				'ID'          => $this->post_id,
				'post_author' => self::$author_id,
			)
		);
		wp_set_current_user( self::$author_id );

		$state = rest_do_request( new WP_REST_Request( 'GET', '/gutenberg-de/v1/posts/' . $this->post_id . '/state' ) );
		$this->assertSame( 200, $state->get_status() );
		$this->assertArrayHasKey( 'version', $state->get_data() );
		$this->assertTrue(
			in_array(
				true,
				array_column( $state->get_data()['chunks'], 'protected' ),
				true
			),
			'The state must mark protected chunks so clients can use server-provided hashes.'
		);

		$request = new WP_REST_Request( 'POST', '/gutenberg-de/v1/posts/' . $this->post_id . '/save' );
		$request->set_body_params(
			array(
				'content'      => self::PARAGRAPH_EDITED . "\n\n" . self::SCRIPT_BLOCK,
				'base_version' => $state->get_data()['version'],
			)
		);
		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( self::PARAGRAPH_EDITED . "\n\n" . self::SCRIPT_BLOCK, $this->stored_content() );
	}

	public function test_rest_requires_edit_permission() {
		wp_set_current_user( 0 );

		$response = rest_do_request( new WP_REST_Request( 'GET', '/gutenberg-de/v1/posts/' . $this->post_id . '/state' ) );

		$this->assertSame( rest_authorization_required_code(), $response->get_status() );
	}

	/**
	 * Reassigns the fixture post to the author so the author may save it.
	 */
	private function make_author_owned() {
		wp_update_post(
			array(
				'ID'          => $this->post_id,
				'post_author' => self::$author_id,
			)
		);
	}

	/**
	 * Performs a native wp/v2 save of the fixture post.
	 *
	 * @param array $params Body params.
	 * @return WP_REST_Response Response.
	 */
	private function wp_v2_save( $params ) {
		$request = new WP_REST_Request( 'PUT', '/wp/v2/posts/' . $this->post_id );
		$request->set_body_params( $params );
		return rest_do_request( $request );
	}

	public function test_wp_v2_save_with_base_version_preserves_untouched_protected_chunks() {
		$this->make_author_owned();
		wp_set_current_user( self::$author_id );
		kses_init();

		$response = $this->wp_v2_save(
			array(
				'content'         => self::PARAGRAPH_EDITED . "\n\n" . self::SCRIPT_BLOCK,
				'de_base_version' => $this->engine->get_version( $this->post_id ),
			)
		);
		kses_remove_filters();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			self::PARAGRAPH_EDITED . "\n\n" . self::SCRIPT_BLOCK,
			$this->stored_content(),
			'A native save carrying de_base_version must preserve untouched protected chunks even for unprivileged users.'
		);
	}

	public function test_wp_v2_save_without_base_version_applies_legacy_kses() {
		$this->make_author_owned();
		wp_set_current_user( self::$author_id );
		kses_init();

		$response = $this->wp_v2_save(
			array(
				'content' => self::PARAGRAPH_EDITED . "\n\n" . self::SCRIPT_BLOCK,
			)
		);
		kses_remove_filters();

		$this->assertSame( 200, $response->get_status() );
		$this->assertStringNotContainsString( '<script', $this->stored_content(), 'Without de_base_version the legacy kses behavior is untouched.' );
		$this->assertSame( array(), $this->stored_wrappers() );
	}

	public function test_wp_v2_author_protected_change_is_sequestered() {
		$this->make_author_owned();
		wp_set_current_user( self::$author_id );
		kses_init();

		$response = $this->wp_v2_save(
			array(
				'content'         => self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK_EDITED,
				'de_base_version' => $this->engine->get_version( $this->post_id ),
			)
		);
		kses_remove_filters();

		$this->assertSame( 200, $response->get_status() );
		$this->assertStringNotContainsString( '<script', $this->stored_content() );

		$data = $response->get_data();
		$this->assertStringNotContainsString( '<script', $data['content']['raw'], 'The response must reflect the accepted (filtered) content so the editor adopts it.' );

		$wrappers = $this->stored_wrappers();
		$this->assertCount( 1, $wrappers );
		$this->assertSame( self::$author_id, $wrappers[0]['attrs']['proposer'] );
		$this->assertSame( self::SCRIPT_BLOCK_EDITED, $wrappers[0]['attrs']['proposed'] );
	}

	public function test_wp_v2_admin_unapproved_protected_change_is_sequestered() {
		wp_set_current_user( self::$admin_id );

		$response = $this->wp_v2_save(
			array(
				'content'         => self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK_EDITED,
				'de_base_version' => $this->engine->get_version( $this->post_id ),
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertStringNotContainsString( '<script', $this->stored_content() );
		$this->assertCount( 1, $this->stored_wrappers() );
		$this->assertStringContainsString( 'wp:de/pending-review', $response->get_data()['content']['raw'], 'The response must carry the wrapper so the editor renders the review block.' );
	}

	public function test_wp_v2_admin_approved_protected_change_is_accepted() {
		wp_set_current_user( self::$admin_id );

		$response = $this->wp_v2_save(
			array(
				'content'         => self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK_EDITED,
				'de_base_version' => $this->engine->get_version( $this->post_id ),
				'de_approvals'    => array( $this->engine->hash_chunk( self::SCRIPT_BLOCK_EDITED ) ),
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( self::PARAGRAPH . "\n\n" . self::SCRIPT_BLOCK_EDITED, $this->stored_content() );
	}

	public function test_wp_v2_stale_base_version_is_bounced() {
		wp_set_current_user( self::$admin_id );

		$response = $this->wp_v2_save(
			array(
				'content'         => self::PARAGRAPH_EDITED . "\n\n" . self::SCRIPT_BLOCK,
				'de_base_version' => 'v1:not-the-current-version',
			)
		);

		$this->assertSame( 409, $response->get_status() );
		$this->assertSame( 'de_stale_base', $response->get_data()['code'] );
	}

	public function test_wp_v2_kses_filters_are_restored_after_de_save() {
		$this->make_author_owned();
		wp_set_current_user( self::$author_id );
		kses_init();

		$this->wp_v2_save(
			array(
				'content'         => self::PARAGRAPH_EDITED . "\n\n" . self::SCRIPT_BLOCK,
				'de_base_version' => $this->engine->get_version( $this->post_id ),
			)
		);

		// The DE save suspended kses; a subsequent plain update by the same
		// unprivileged user must be filtered again.
		wp_update_post(
			array(
				'ID'           => $this->post_id,
				'post_content' => wp_slash( self::SCRIPT_BLOCK_EDITED ),
			)
		);
		kses_remove_filters();

		$this->assertStringNotContainsString( '<script', $this->stored_content(), 'kses must be restored after a distributed-editing save.' );
	}

	const ID_PARAGRAPH_ONE = "<!-- wp:paragraph {\"metadata\":{\"syncId\":\"p-one\"}} -->\n<p>First.</p>\n<!-- /wp:paragraph -->";

	const ID_PARAGRAPH_TWO = "<!-- wp:paragraph {\"metadata\":{\"syncId\":\"p-two\"}} -->\n<p>Second.</p>\n<!-- /wp:paragraph -->";

	const ID_SCRIPT_BLOCK = "<!-- wp:html {\"metadata\":{\"syncId\":\"s-one\"}} -->\n<script>document.title = 'accepted';</script>\n<!-- /wp:html -->";

	const ID_SCRIPT_BLOCK_EDITED = "<!-- wp:html {\"metadata\":{\"syncId\":\"s-one\"}} -->\n<script>document.title = 'proposed';</script>\n<!-- /wp:html -->";

	/**
	 * Stores content verbatim, bypassing request-time kses.
	 *
	 * @param string $content Content to store.
	 */
	private function store_verbatim( $content ) {
		kses_remove_filters();
		wp_update_post(
			array(
				'ID'           => $this->post_id,
				'post_content' => wp_slash( $content ),
			)
		);
		kses_init();
	}

	public function test_moved_protected_block_with_sync_id_passes_through_unprivileged_save() {
		$base = self::ID_PARAGRAPH_ONE . "\n\n" . self::ID_SCRIPT_BLOCK . "\n\n" . self::ID_PARAGRAPH_TWO;
		$this->store_verbatim( $base );

		// The author moves the protected block to the top; every chunk is
		// byte-identical to accepted content, only the order changed.
		$moved  = self::ID_SCRIPT_BLOCK . "\n\n" . self::ID_PARAGRAPH_ONE . "\n\n" . self::ID_PARAGRAPH_TWO;
		$result = $this->engine->save(
			$this->post_id,
			$moved,
			$this->engine->get_version( $this->post_id ),
			array(),
			self::$author_id
		);

		$this->assertIsArray( $result );
		$this->assertSame( array(), $result['sequestered'], 'A moved, byte-identical protected block must not be sequestered.' );
		$this->assertSame( 0, $result['deleted_protected'], 'A move must not be miscounted as a protected deletion.' );
		$this->assertSame( $moved, $this->stored_content(), 'The reordered content must persist byte for byte.' );
	}

	public function test_edited_protected_block_with_sync_id_is_not_counted_as_deletion() {
		$base = self::ID_PARAGRAPH_ONE . "\n\n" . self::ID_SCRIPT_BLOCK;
		$this->store_verbatim( $base );

		$result = $this->engine->save(
			$this->post_id,
			self::ID_PARAGRAPH_ONE . "\n\n" . self::ID_SCRIPT_BLOCK_EDITED,
			$this->engine->get_version( $this->post_id ),
			array(),
			self::$author_id
		);

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result['sequestered'], 'The identity-paired protected edit must still be sequestered.' );
		$this->assertSame( 0, $result['deleted_protected'], 'An identity-paired edit is an edit, not a deletion of the base chunk.' );
	}
}
