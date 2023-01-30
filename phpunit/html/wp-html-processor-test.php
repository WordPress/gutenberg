<?php

/**
 * Unit tests covering WP_HTML_Processor functionality.
 *
 * @package WordPress
 * @subpackage HTML
 */

require_once __DIR__ . '/../../lib/experimental/html/wp-html.php';

if ( ! function_exists( 'esc_attr' ) ) {
	function esc_attr( $s ) {
		return htmlentities( $s, ENT_QUOTES, null, false ); }
}

if ( ! class_exists( 'WP_UnitTestCase' ) ) {
	class WP_UnitTestCase extends PHPUnit\Framework\TestCase {}
}

/**
 * @group html-processor
 *
 * @coversDefaultClass WP_HTML_Processor
 */
class WP_HTML_Processor_Test extends WP_UnitTestCase {
	public function test_find_descendant_tag() {
		$tags = new WP_HTML_Processor( '<div>outside</div><section><div><img>inside</div></section>' );

		$tags->next_tag( 'div' );
		$state = $tags->new_state();
		$this->assertFalse( $tags->balanced_next( $state, 'img' ) );

		$this->assertTrue( $tags->next_tag( 'div' ) );
		$state = $tags->new_state();
		$this->assertTrue( $tags->balanced_next( $state, 'img' ) );
	}

	public function test_find_immediate_child_tag() {
		$tags = new WP_HTML_Processor( '<div><div><div><img></div></div></div>' );

		$tags->next_tag( 'div' );
		$state              = $tags->new_state();
		$state->match_depth = 1;
		$this->assertFalse( $tags->balanced_next( $state, 'img' ) );
	}

	public function test_find_immediate_child_tag2() {
		$tags = new WP_HTML_Processor( '<div><div><div><img></div></div><img wanted></div>' );

		$tags->next_tag( 'div' );
		$state              = $tags->new_state();
		$state->match_depth = 1;
		$this->assertTrue( $tags->balanced_next( $state, 'img' ), 'Did not find the wanted <img>' );
		$this->assertTrue( $tags->get_attribute( 'wanted' ), 'Found the wrong <img>' );
	}

	public function test_find_child_tag() {
		$tags = new WP_HTML_Processor( '<div><div><div><img></div></div></div>' );

		$tags->next_tag( 'div' );
		$state              = $tags->new_state();
		$state->match_depth = 3;
		$this->assertTrue( $tags->balanced_next( $state, 'img' ) );
	}

	public function test_flushes_up_to_close_tag_from_deep_within() {
		$tags = new WP_HTML_Processor(
			<<<HTML
			<main>
				<section>
					<h2>Cows</h2>
					<div>
						<p start>Cows are clever.</p>
						<p>Cows eat grass.</p>
					</div>
					<h3>Things cows can't do</h3>
					<ul>
						<li><p>Pilot aeroplanes</p></li>
						<li><p>Drive race cars</p></li>
						<li><p>Captain ships</p></li>
					</ul>
					<p>This concludes our discussion of cows.</p>
				</section>
				<section>
					<h2>Oxen</h2>
					<div>
						<p wanted>Oxen are strong.</p>
					</div>
				</section>
			</main>
HTML
		);

		$tags->next_tag( 'section' );
		$state = $tags->new_state();

		// Jump inside this tag.
		$tags->balanced_next( $state, 'p' );
		$this->assertTrue( $tags->get_attribute( 'start' ) );
		// Then exit the outer section we were scanning.
		while ( $tags->balanced_next( $state ) ) {
			continue;
		}

		$this->assertEquals( 'SECTION', $tags->get_tag() );
		$tags->next_tag( 'p' );
		$this->assertTrue( $tags->get_attribute( 'wanted' ) );
	}

	public function test_can_navigate_with_unique_state_throughout_structure() {
		$tags = new WP_HTML_Processor(
			<<<HTML
			<main>
				<section>
					<h2>Cows</h2>
					<div>
						<p start>Cows are clever.</p>
						<p>Cows eat grass.</p>
					</div>
					<h3>Things cows can't do</h3>
					<ul>
						<li><p>Pilot aeroplanes</p></li>
						<li><p>Drive race cars</p></li>
						<li><p>Captain ships</p></li>
					</ul>
					<p inner>This concludes our discussion of cows.</p>
				</section>
				<section>
					<h2>Oxen</h2>
					<div>
						<p wanted>Oxen are strong.</p>
					</div>
				</section>
			</main>
HTML
		);

		$tags->next_tag( 'section' );
		$state = $tags->new_state();

		// Jump inside this tag.
		$tags->balanced_next( $state, 'p' );
		$this->assertTrue( $tags->get_attribute( 'start' ) );

		// Establish a new state/frame for navigating inside the outer structure.
		$tags->balanced_next( $state, 'ul' );
		$li_count = 0;
		$li_state = $tags->new_state();
		while ( $tags->balanced_next( $li_state, 'li' ) ) {
			$li_count++;
		}
		$this->assertEquals( 3, $li_count );

		// Ensure that we ended up where we expected.
		$this->assertEquals( 'UL', $tags->get_tag() );
		$this->assertTrue( $tags->is_tag_closer() );
		$tags->next_tag();
		$this->assertTrue( $tags->get_attribute( 'inner' ) );

		// And now flush out the previous stack/frame.
		while ( $tags->balanced_next( $state ) ) {
			continue;
		}

		// Ensure that we're back where we want to be after exiting two separate frames.
		$this->assertEquals( 'P', $tags->get_tag() );
		$this->assertTrue( $tags->is_tag_closer() );
		$tags->next_tag( 'p' );
		$this->assertTrue( $tags->get_attribute( 'wanted' ) );
	}

	public function test_can_scan_through_tags_at_a_given_depth() {
		$tags = new WP_HTML_Processor(
			<<<HTML
			<main>
				<section>
					<h2>Cows</h2>
					<div>
						<p start>Cows are clever.</p>
						<p>Cows eat grass.</p>
					</div>
					<h3>Things cows can't do</h3>
					<ul>
						<li><p>Pilot aeroplanes</p></li>
						<li><p>Drive race cars</p></li>
						<li><p>Captain ships</p></li>
					</ul>
					<h3>Things cows can do</h3>
					<ul>
						<li><p>Chew cud</p></li>
						<li><p>Moo</p></li>
					</ul>
					<p inner>This concludes our discussion of cows.</p>
				</section>
				<section>
					<h2>Oxen</h2>
					<div>
						<p wanted>Oxen are strong.</p>
					</div>
				</section>
			</main>
HTML
		);

		$tags->next_tag( 'section' );
		$state              = $tags->new_state();
		$state->match_depth = 3;

		$p3_count = 0;
		while ( $tags->balanced_next( $state, 'p' ) ) {
			$p3_count++;
		}

		// Did we only visit the tags inside section > * > * > p?
		$this->assertEquals( 5, $p3_count );

		$state              = $tags->new_state();
		$state->match_depth = 2;

		$p2_count = 0;
		while ( $tags->balanced_next( $state, 'p' ) ) {
			$p2_count++;
		}

		// Did we only visit the tags inside section > * > p?
		$this->assertEquals( 1, $p2_count );
	}
}
