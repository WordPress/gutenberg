<?php
/**
 * Tests for the guideline-row reservation guard: forced type, slug uniqueness,
 * no slug suffixing, scope-title restamping, and content sanitization on the
 * REST insert path.
 *
 * @package gutenberg
 *
 * @group knowledge
 * @group restapi
 */
class Gutenberg_Guideline_Reservation_Test extends WP_Test_REST_TestCase {

	/**
	 * @var int Administrator user ID.
	 */
	protected static $admin_id;

	/**
	 * Set up class fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Clean up class fixtures.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	/**
	 * Helper: create a knowledge row via REST.
	 *
	 * @param array $body Request body params.
	 * @return WP_REST_Response Response object.
	 */
	private function create_row( array $body ): WP_REST_Response {
		$request = new WP_REST_Request( 'POST', '/wp/v2/knowledge' );
		$request->set_body_params( $body );
		return rest_get_server()->dispatch( $request );
	}

	/**
	 * A row created with a `guideline-` slug is forced onto the `guideline`
	 * type and keeps its slug verbatim (no `-2` suffix).
	 */
	public function test_prefixed_slug_forces_guideline_term_and_keeps_slug() {
		wp_set_current_user( self::$admin_id );

		$response = $this->create_row(
			array(
				'slug'    => 'guideline-copy',
				'content' => 'Use active voice.',
				'status'  => 'publish',
			)
		);

		$this->assertSame( 201, $response->get_status() );
		$id = $response->get_data()['id'];

		$this->assertSame( 'guideline-copy', get_post( $id )->post_name );

		$terms = wp_get_object_terms( $id, 'wp_knowledge_type', array( 'fields' => 'slugs' ) );
		$this->assertSame( array( 'guideline' ), $terms );
	}

	/**
	 * A second create with an already-used `guideline-` slug is rejected.
	 */
	public function test_duplicate_prefixed_slug_rejected() {
		wp_set_current_user( self::$admin_id );

		$first = $this->create_row(
			array(
				'slug'    => 'guideline-site',
				'content' => 'First.',
				'status'  => 'publish',
			)
		);
		$this->assertSame( 201, $first->get_status() );

		$second = $this->create_row(
			array(
				'slug'    => 'guideline-site',
				'content' => 'Second.',
				'status'  => 'publish',
			)
		);

		$this->assertSame( 409, $second->get_status() );
		$this->assertSame( 'rest_knowledge_slug_exists', $second->get_data()['code'] );
	}

	/**
	 * Registry scope titles are re-stamped from `wp_guideline_scopes()`,
	 * ignoring any client-provided title.
	 */
	public function test_scope_title_restamped_from_registry() {
		wp_set_current_user( self::$admin_id );

		$response = $this->create_row(
			array(
				'slug'    => 'guideline-images',
				'title'   => 'Bogus client title',
				'content' => 'Square images only.',
				'status'  => 'publish',
			)
		);

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'Images', get_post( $response->get_data()['id'] )->post_title );
	}

	/**
	 * Block rows keep the client-provided canonical block name as the title.
	 */
	public function test_block_row_keeps_canonical_title() {
		wp_set_current_user( self::$admin_id );

		$response = $this->create_row(
			array(
				'slug'    => 'guideline-block-core-paragraph',
				'title'   => 'core/paragraph',
				'content' => 'Keep paragraphs short.',
				'status'  => 'publish',
			)
		);

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'core/paragraph', get_post( $response->get_data()['id'] )->post_title );
	}

	/**
	 * Content is sanitized to plain text and capped at the guideline length.
	 */
	public function test_content_sanitized_and_capped() {
		wp_set_current_user( self::$admin_id );

		$long = str_repeat( 'a', 6000 );

		$response = $this->create_row(
			array(
				'slug'    => 'guideline-additional',
				'content' => '<script>alert(1)</script>' . $long,
				'status'  => 'publish',
			)
		);

		$this->assertSame( 201, $response->get_status() );
		$content = get_post( $response->get_data()['id'] )->post_content;

		$this->assertStringNotContainsString( '<script', $content );
		$this->assertLessThanOrEqual( 5000, mb_strlen( $content, 'UTF-8' ) );
	}
}
