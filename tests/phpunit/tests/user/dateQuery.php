<?php

/**
 * @group user
 * @group datequery
 */
class Tests_User_DateQuery extends WP_UnitTestCase {
	/**
	 * @ticket 27283
	 */
	public function test_user_registered() {
		$u1 = $this->factory->user->create( array(
			'user_registered' => '2012-02-14 05:05:05',
		) );
		$u2 = $this->factory->user->create( array(
			'user_registered' => '2013-02-14 05:05:05',
		) );

		$uq = new WP_User_Query( array(
			'date_query' => array(
				array(
					'year' => 2012,
				),
			),
		) );

		$this->assertEqualSets( array( $u1 ), wp_list_pluck( $uq->results, 'ID' ) );
	}

	/**
	 * @ticket 27283
	 */
	public function test_user_registered_relation_or() {
		$u1 = $this->factory->user->create( array(
			'user_registered' => '2012-02-14 05:05:05',
		) );
		$u2 = $this->factory->user->create( array(
			'user_registered' => '2013-02-14 05:05:05',
		) );
		$u3 = $this->factory->user->create( array(
			'user_registered' => '2014-02-14 05:05:05',
		) );

		$uq = new WP_User_Query( array(
			'date_query' => array(
				'relation' => 'OR',
				array(
					'year' => 2013,
				),
				array(
					'before' => '2012-03-01 00:00:00',
				),
			),
		) );

		$this->assertEqualSets( array( $u1, $u2 ), wp_list_pluck( $uq->results, 'ID' ) );
	}
}
