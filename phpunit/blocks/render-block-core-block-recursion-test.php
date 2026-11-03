<?php
/**
 * Tests for synced pattern (`core/block`) render expansion and its budget guard.
 *
 * The static `$seen_refs` array in `render_block_core_block()` only prevents
 * active-stack recursion cycles (A -> ... -> A). It does not dedupe repeated or
 * "diamond" references, so a densely cross-referenced set of synced patterns can
 * expand exponentially (depth x fan-out) and exhaust memory. A per-top-level
 * render budget bounds that expansion while preserving the existing behaviors:
 * non-nested duplicates still render, and self-recursion is still halted.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @group blocks
 * @covers ::render_block_core_block
 */
class Render_Block_Core_Block_Recursion_Test extends WP_UnitTestCase {

	/**
	 * IDs of the chained wp_block posts, shallowest (index 0) -> deepest.
	 *
	 * @var int[]
	 */
	protected static $chain = array();

	/**
	 * ID of a leaf synced pattern containing a single paragraph.
	 *
	 * @var int
	 */
	protected static $leaf_id;

	/**
	 * Per-node fan-out: how many times each pattern embeds the next one.
	 */
	const FAN_OUT = 2;

	/**
	 * Depth of the reference chain. Total chained posts is DEPTH + 1.
	 * At FAN_OUT 2 a full expansion renders FAN_OUT^DEPTH = 256 leaf paragraphs.
	 */
	const DEPTH = 8;

	public static function wpSetUpBeforeClass( $factory ) {
		// Deepest level: a leaf with no child references.
		$child_id      = $factory->post->create(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_title'   => 'Synced pattern leaf',
				'post_content' => '<!-- wp:paragraph --><p>Leaf</p><!-- /wp:paragraph -->',
			)
		);
		self::$leaf_id = $child_id;

		$chain = array( $child_id );

		for ( $level = 0; $level < self::DEPTH; $level++ ) {
			$inner = str_repeat(
				sprintf( '<!-- wp:block {"ref":%d} /-->', $child_id ),
				self::FAN_OUT
			);

			$parent_id = $factory->post->create(
				array(
					'post_type'    => 'wp_block',
					'post_status'  => 'publish',
					'post_title'   => 'Synced pattern level ' . $level,
					'post_content' => $inner,
				)
			);

			$chain[]  = $parent_id;
			$child_id = $parent_id;
		}

		// Reverse so index 0 is the top-level (shallowest) pattern.
		self::$chain = array_reverse( $chain );
	}

	public static function wpTearDownAfterClass() {
		foreach ( self::$chain as $id ) {
			wp_delete_post( $id, true );
		}
		self::$chain = array();
	}

	public function tear_down() {
		remove_all_filters( 'block_core_block_render_budget' );
		parent::tear_down();
	}

	/**
	 * Force the budget to a fixed value via the filter.
	 *
	 * @param int $value Budget value.
	 */
	private function set_budget( $value ) {
		add_filter(
			'block_core_block_render_budget',
			static function () use ( $value ) {
				return $value;
			}
		);
	}

	/**
	 * Render a top-level `core/block` reference and count how many leaf paragraphs
	 * appear in the output.
	 *
	 * Every root-to-leaf path through the reference graph renders one copy of the
	 * leaf, so a full expansion yields FAN_OUT^DEPTH leaves. This output-based
	 * metric measures expansion directly and is immune to the fact that the
	 * `render_block` filter fires more than once per `core/block` instance.
	 *
	 * @param int $ref Top-level wp_block ID.
	 * @return int Number of rendered leaf paragraphs.
	 */
	private function count_rendered_leaves( $ref ) {
		$top = new WP_Block(
			array(
				'blockName' => 'core/block',
				'attrs'     => array( 'ref' => $ref ),
			)
		);

		return substr_count( $top->render(), '>Leaf<' );
	}

	/**
	 * Create a single-level synced pattern that references the leaf $count times.
	 *
	 * @param int $count Number of leaf references.
	 * @return int The created wp_block post ID.
	 */
	private function create_wide_pattern( $count ) {
		return self::factory()->post->create(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_title'   => 'Wide synced pattern',
				'post_content' => str_repeat(
					sprintf( '<!-- wp:block {"ref":%d} /-->', self::$leaf_id ),
					$count
				),
			)
		);
	}

	/**
	 * The render budget caps the number of synced pattern expansions, so a
	 * diamond/repeated reference graph cannot expand exponentially. Without a
	 * budget this tree renders 2^DEPTH = 256 leaves.
	 */
	public function test_repeated_references_are_bounded_by_budget() {
		$this->set_budget( 20 );

		$leaves = $this->count_rendered_leaves( self::$chain[0] );

		/*
		 * Each leaf rendered consumes one expansion, so the leaf count cannot
		 * exceed the budget.
		 */
		$this->assertGreaterThan( 0, $leaves, 'Some content should still render.' );
		$this->assertLessThanOrEqual(
			20,
			$leaves,
			'Synced pattern expansion must be capped by the render budget.'
		);
	}

	/**
	 * The default (generous) budget does not truncate ordinary nesting: the full
	 * tree expands to FAN_OUT^DEPTH leaves.
	 */
	public function test_default_budget_does_not_truncate_normal_nesting() {
		$this->assertSame(
			self::FAN_OUT ** self::DEPTH,
			$this->count_rendered_leaves( self::$chain[0] ),
			'At the default budget the tree should render fully (no truncation).'
		);
	}

	/**
	 * The budget caps expansion precisely. A single-level pattern that references
	 * the leaf more times than the budget allows expands exactly (budget - 1)
	 * leaves -- the outermost pattern itself consumes one unit. This pins the
	 * decrement against off-by-one errors rather than only asserting an upper bound.
	 */
	public function test_budget_caps_expansion_at_exact_count() {
		$budget = 4;
		$this->set_budget( $budget );

		$wide_parent = $this->create_wide_pattern( $budget + 5 );

		$this->assertSame(
			$budget - 1,
			$this->count_rendered_leaves( $wide_parent ),
			'A budget of N should expand exactly N - 1 leaves under a single-level pattern.'
		);

		wp_delete_post( $wide_parent, true );
	}

	/**
	 * The budget is per top-level render: exhausting it for one pattern must not
	 * starve a subsequent independent top-level render. Two distinct patterns, so
	 * equal capped counts cannot be explained by per-ref caching.
	 */
	public function test_budget_resets_between_top_level_renders() {
		$budget = 4;
		$this->set_budget( $budget );

		$first_parent  = $this->create_wide_pattern( $budget + 5 );
		$second_parent = $this->create_wide_pattern( $budget + 5 );

		$first  = $this->count_rendered_leaves( $first_parent );
		$second = $this->count_rendered_leaves( $second_parent );

		$this->assertSame( $budget - 1, $first, 'First render should be capped.' );
		$this->assertSame(
			$budget - 1,
			$second,
			'The second top-level render should get a fresh budget, not the drained one.'
		);

		wp_delete_post( $first_parent, true );
		wp_delete_post( $second_parent, true );
	}

	/**
	 * Returning -1 (or any negative value) from the filter removes the limit.
	 */
	public function test_negative_budget_removes_the_limit() {
		$this->set_budget( -1 );

		$this->assertSame(
			self::FAN_OUT ** self::DEPTH,
			$this->count_rendered_leaves( self::$chain[0] ),
			'A budget of -1 should render the full tree.'
		);
	}

	/**
	 * A filter that returns 0 disables synced pattern expansion entirely.
	 */
	public function test_zero_budget_disables_expansion() {
		$this->set_budget( 0 );

		$wide_parent = $this->create_wide_pattern( 4 );

		$this->assertSame(
			0,
			$this->count_rendered_leaves( $wide_parent ),
			'A budget of 0 renders no expansions.'
		);

		wp_delete_post( $wide_parent, true );
	}

	/**
	 * Behavior preserved from PR 28461: the same synced pattern referenced more
	 * than once non-nested must render each time (both copies appear).
	 */
	public function test_non_nested_duplicate_references_both_render() {
		$parent_id = $this->create_wide_pattern( 2 );

		$this->assertSame(
			2,
			$this->count_rendered_leaves( $parent_id ),
			'Both non-nested references should render.'
		);

		wp_delete_post( $parent_id, true );
	}

	/**
	 * Behavior preserved from PR 28405: a synced pattern that references itself
	 * must not recurse infinitely; rendering completes via the cycle guard.
	 */
	public function test_self_reference_is_still_halted() {
		$self_id = self::factory()->post->create(
			array(
				'post_type'   => 'wp_block',
				'post_status' => 'publish',
				'post_title'  => 'Self reference',
			)
		);
		wp_update_post(
			array(
				'ID'           => $self_id,
				'post_content' => sprintf( '<!-- wp:block {"ref":%d} /-->', $self_id ),
			)
		);

		$block = new WP_Block(
			array(
				'blockName' => 'core/block',
				'attrs'     => array( 'ref' => $self_id ),
			)
		);

		// Should return without exhausting memory or stack.
		$output = $block->render();
		$this->assertIsString( $output );

		wp_delete_post( $self_id, true );
	}

	/**
	 * An exception thrown mid-render must not leave the static $seen_refs dirty:
	 * the finally block has to clean it so later renders are not wrongly halted as
	 * recursive in a long-lived process.
	 */
	public function test_seen_refs_cleaned_after_exception_mid_render() {
		$thrower = static function ( $html, $block ) {
			if ( isset( $block['blockName'] ) && 'core/paragraph' === $block['blockName'] ) {
				throw new RuntimeException( 'boom' );
			}
			return $html;
		};
		add_filter( 'render_block', $thrower, 10, 2 );

		$parent = $this->create_wide_pattern( 3 );

		try {
			( new WP_Block(
				array(
					'blockName' => 'core/block',
					'attrs'     => array( 'ref' => $parent ),
				)
			) )->render();
			$this->fail( 'The injected exception should have propagated.' );
		} catch ( RuntimeException $e ) {
			$this->assertSame( 'boom', $e->getMessage() );
		} finally {
			remove_filter( 'render_block', $thrower, 10 );
			wp_delete_post( $parent, true );
		}

		// $seen_refs must be empty again, so a fresh render expands fully.
		$this->assertSame(
			self::FAN_OUT ** self::DEPTH,
			$this->count_rendered_leaves( self::$chain[0] ),
			'After an exception mid-render, the next render must get clean state.'
		);
	}
}
