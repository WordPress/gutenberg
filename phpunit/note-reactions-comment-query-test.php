<?php
/**
 * Tests that reactions stay out of comment queries and the last comment
 * modified date unless they are asked for.
 *
 * @package gutenberg
 */
class Tests_Note_Reactions_Comment_Query extends WP_UnitTestCase {

	/**
	 * A regular comment can be queried alongside reactions via `type__in`.
	 */
	public function test_reactions_are_returned_when_requested_via_type__in() {
		$post_id     = self::factory()->post->create();
		$note_id     = self::factory()->comment->create(
			array(
				'comment_post_ID' => $post_id,
				'comment_type'    => 'note',
			)
		);
		$reaction_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_parent'   => $note_id,
				'comment_type'     => 'reaction',
				'comment_content'  => '2764',
				'comment_approved' => '1',
			)
		);
		$comment_id  = self::factory()->comment->create( array( 'comment_post_ID' => $post_id ) );

		$this->assertSame(
			array( $comment_id ),
			array_map( 'intval', get_comments( array( 'fields' => 'ids' ) ) ),
			'Reactions should be excluded when no type is requested.'
		);

		$this->assertEqualSets(
			array( $comment_id, $reaction_id ),
			array_map(
				'intval',
				get_comments(
					array(
						'fields'   => 'ids',
						'type__in' => array( 'comment', 'reaction' ),
					)
				)
			),
			'Reactions should be returned when requested via type__in.'
		);
	}

	/**
	 * Notes and reactions are not user-facing discussion, so they must not
	 * move the last comment modified date.
	 *
	 * @dataProvider data_internal_comment_types_are_excluded_from_lastcommentmodified
	 *
	 * @param string $timezone Timezone argument to pass to get_lastcommentmodified().
	 * @param string $expected Expected date.
	 */
	public function test_internal_comment_types_are_excluded_from_lastcommentmodified( $timezone, $expected ) {
		self::factory()->comment->create(
			array(
				'comment_approved' => '1',
				'comment_date'     => '2000-01-01 11:00:00',
				'comment_date_gmt' => '2000-01-01 10:00:00',
			)
		);

		foreach ( array( 'note', 'reaction' ) as $comment_type ) {
			self::factory()->comment->create(
				array(
					'comment_approved' => '1',
					'comment_type'     => $comment_type,
					'comment_date'     => '2020-01-01 11:00:00',
					'comment_date_gmt' => '2020-01-01 10:00:00',
				)
			);
		}

		$this->assertSame( strtotime( $expected ), strtotime( get_lastcommentmodified( $timezone ) ) );
	}

	public function data_internal_comment_types_are_excluded_from_lastcommentmodified() {
		return array(
			'server timezone' => array( 'server', '2000-01-01 10:00:00' ),
			'blog timezone'   => array( 'blog', '2000-01-01 11:00:00' ),
			'gmt timezone'    => array( 'gmt', '2000-01-01 10:00:00' ),
		);
	}

	/**
	 * With nothing but notes and reactions stored there is no last modified date.
	 */
	public function test_lastcommentmodified_is_false_with_only_internal_comment_types() {
		foreach ( array( 'note', 'reaction' ) as $comment_type ) {
			self::factory()->comment->create(
				array(
					'comment_approved' => '1',
					'comment_type'     => $comment_type,
				)
			);
		}

		$this->assertFalse( get_lastcommentmodified() );
	}
}
