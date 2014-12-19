<?php

/**
 * @group formatting
 * @covers ::wp_trim_excerpt
 */
class Tests_Formatting_WpTrimExcerpt extends WP_UnitTestCase {
	/**
	 * @ticket 25349
	 */
	public function test_secondary_loop_respect_more() {
		$post1 = $this->factory->post->create( array(
			'post_content' => 'Post 1 Page 1<!--more-->Post 1 Page 2',
		) );
		$post2 = $this->factory->post->create( array(
			'post_content' => 'Post 2 Page 1<!--more-->Post 2 Page 2',
		) );

		$this->go_to( '/?p=' . $post1 );
		setup_postdata( get_post( $post1 ) );

		$q = new WP_Query( array(
			'post__in' => array( $post2 ),
		) );
		if ( $q->have_posts() ) {
			while ( $q->have_posts() ) {
				$q->the_post();
				$this->assertSame( 'Post 2 Page 1', wp_trim_excerpt() );
			}
		}
	}

	/**
	 * @ticket 25349
	 */
	public function test_secondary_loop_respect_nextpage() {
		$post1 = $this->factory->post->create( array(
			'post_content' => 'Post 1 Page 1<!--nextpage-->Post 1 Page 2',
		) );
		$post2 = $this->factory->post->create( array(
			'post_content' => 'Post 2 Page 1<!--nextpage-->Post 2 Page 2',
		) );

		$this->go_to( '/?p=' . $post1 );
		setup_postdata( get_post( $post1 ) );

		$q = new WP_Query( array(
			'post__in' => array( $post2 ),
		) );
		if ( $q->have_posts() ) {
			while ( $q->have_posts() ) {
				$q->the_post();
				$this->assertSame( 'Post 2 Page 1', wp_trim_excerpt() );
			}
		}
	}
}
