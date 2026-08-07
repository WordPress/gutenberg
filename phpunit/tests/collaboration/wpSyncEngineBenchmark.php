<?php
/**
 * Correctness tests for the sync-engine benchmark harness.
 *
 * These assert what the harness MEASURES, not how fast it runs (timing is
 * for the CLI, not CI): the seam is driven correctly, the policy-correct
 * quality signal behaves (clean scenarios never escalate, contended ones
 * do, no workload loses work), and the relay path reports its quality as
 * unobservable rather than faking a score.
 *
 * @package Gutenberg
 *
 * @group collaboration
 */
class Tests_Collaboration_WpSyncEngineBenchmark extends WP_UnitTestCase {
	public static function set_up_before_class() {
		parent::set_up_before_class();
		$base = dirname( __DIR__, 3 ) . '/test/php/sync-engine-benchmarks/';
		require_once $base . 'class-wp-sync-bench-memory-storage.php';
		require_once $base . 'class-wp-sync-bench-workload.php';
		require_once $base . 'class-wp-sync-bench-runner.php';
	}

	/**
	 * Runs a workload for one scenario against the intent-log engine.
	 *
	 * @param string $scenario Scenario slug.
	 * @return array Report.
	 */
	private function run_intent_log( string $scenario ): array {
		$workload = WP_Sync_Bench_Workload::build( $scenario, 7, 8, 3, 4 );
		$post_id  = self::factory()->post->create(
			array( 'post_content' => $workload['post_content'] )
		);
		$storage  = new WP_Sync_Bench_Memory_Storage();
		$engine   = new WP_Intent_Log_Engine( $storage );
		return WP_Sync_Bench_Runner::run( $engine, $storage, $post_id, $workload );
	}

	public function test_parallel_paragraphs_merge_clean_and_lose_nothing() {
		$report = $this->run_intent_log( 'parallel-paragraphs' );

		$this->assertSame( 'intent-log', $report['engine'] );
		$this->assertGreaterThan( 0, $report['requests'] );
		// Distinct paragraphs never contend: everything applies.
		$this->assertSame( 0, $report['quality']['dispositions']['escalated'] );
		$this->assertSame( 0.0, $report['quality']['escalation_rate'] );
		$this->assertSame( 0, $report['quality']['lost_work'] );
		$this->assertTrue( $report['quality']['converged'] );
		$this->assertGreaterThan( 0, $report['storage']['rows'] );
	}

	public function test_contended_paragraph_escalates_but_loses_nothing() {
		$report = $this->run_intent_log( 'contended-paragraph' );

		// Concurrent same-field authorship must produce review escalations…
		$this->assertGreaterThan( 0, $report['quality']['dispositions']['escalated'] );
		$this->assertGreaterThan( 0, $report['quality']['escalation_rate'] );
		// …and STILL lose nothing (escalated edits are preserved, not dropped).
		$this->assertSame( 0, $report['quality']['lost_work'] );
		$this->assertTrue( $report['quality']['converged'] );
	}

	public function test_solo_typing_is_all_applied() {
		$report = $this->run_intent_log( 'solo-typing' );

		$this->assertSame( $report['requests'], $report['quality']['dispositions']['applied'] );
		$this->assertSame( 0, $report['quality']['dispositions']['escalated'] );
		$this->assertSame( 0, $report['quality']['lost_work'] );
	}

	public function test_cost_and_payload_metrics_are_populated() {
		$report = $this->run_intent_log( 'mixed-newsroom' );

		$this->assertArrayHasKey( 'mean', $report['service_us'] );
		$this->assertGreaterThanOrEqual( 0, $report['service_us']['mean'] );
		$this->assertGreaterThan( 0, $report['payload_bytes']['request_p50'] );
		$this->assertGreaterThan( 0, $report['storage']['bytes'] );
	}

	public function test_relay_reports_quality_as_unobservable_but_measures_cost() {
		$workload = WP_Sync_Bench_Workload::build( 'parallel-paragraphs', 7, 8, 3, 4 );
		$post_id  = self::factory()->post->create(
			array( 'post_content' => $workload['post_content'] )
		);
		$storage  = new WP_Sync_Bench_Memory_Storage();
		$engine   = new WP_Yjs_Relay_Engine( $storage );

		$report = WP_Sync_Bench_Runner::run( $engine, $storage, $post_id, $workload );

		$this->assertSame( 'yjs-relay', $report['engine'] );
		// The relay merges on the client: the server cannot score quality.
		$this->assertFalse( $report['quality']['observable'] );
		$this->assertNull( $report['quality']['converged'] );
		// Cost and growth ARE measured.
		$this->assertGreaterThan( 0, $report['requests'] );
		$this->assertGreaterThan( 0, $report['storage']['rows'] );
	}

	public function test_workload_generation_is_deterministic() {
		$a = WP_Sync_Bench_Workload::build( 'mixed-newsroom', 123, 10, 3, 5 );
		$b = WP_Sync_Bench_Workload::build( 'mixed-newsroom', 123, 10, 3, 5 );
		$this->assertSame( $a['rounds'], $b['rounds'] );

		$c = WP_Sync_Bench_Workload::build( 'mixed-newsroom', 124, 10, 3, 5 );
		$this->assertNotSame( $a['rounds'], $c['rounds'] );
	}
}
