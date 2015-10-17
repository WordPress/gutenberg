<?php

class Tests_Get_Comment_Excerpt extends WP_UnitTestCase {
	protected static $bacon_comment;

	public static function setUpBeforeClass() {
		parent::setUpBeforeClass();

		self::$bacon_comment = 'Bacon ipsum dolor amet porchetta capicola sirloin prosciutto brisket shankle jerky. Ham hock filet mignon boudin ground round, prosciutto alcatra spare ribs meatball turducken pork beef ribs ham beef. Bacon pastrami short loin, venison tri-tip ham short ribs doner swine. Tenderloin pig tongue pork jowl doner. Pork loin rump t-bone, beef strip steak flank drumstick tri-tip short loin capicola jowl. Cow filet mignon hamburger doner rump. Short loin jowl drumstick, tongue tail beef ribs pancetta flank brisket landjaeger chuck venison frankfurter turkey.

Brisket shank rump, tongue beef ribs swine fatback turducken capicola meatball picanha chicken cupim meatloaf turkey. Bacon biltong shoulder tail frankfurter boudin cupim turkey drumstick. Porchetta pig shoulder, jerky flank pork tail meatball hamburger. Doner ham hock ribeye tail jerky swine. Leberkas ribeye pancetta, tenderloin capicola doner turducken chicken venison ground round boudin pork chop. Tail pork loin pig spare ribs, biltong ribeye brisket pork chop cupim. Short loin leberkas spare ribs jowl landjaeger tongue kevin flank bacon prosciutto.

Shankle pork chop prosciutto ribeye ham hock pastrami. T-bone shank brisket bacon pork chop. Cupim hamburger pork loin short loin. Boudin ball tip cupim ground round ham shoulder. Sausage rump cow tongue bresaola pork pancetta biltong tail chicken turkey hamburger. Kevin flank pork loin salami biltong. Alcatra landjaeger pastrami andouille kielbasa ham tenderloin drumstick sausage turducken tongue corned beef.';
	}

	public function test_get_comment_excerpt() {
		$comment_id = self::factory()->comment->create( array(
			'comment_content' => self::$bacon_comment
		) );

		$excerpt = get_comment_excerpt( $comment_id );

		$this->assertEquals( 20, count( explode( ' ', $excerpt ) ) );
	}

	public function test_get_comment_excerpt_filtered() {
		$comment_id = self::factory()->comment->create( array(
			'comment_content' => self::$bacon_comment
		) );

		add_filter( 'comment_excerpt_length', array( $this, '_filter_comment_excerpt_length' ) );

		$excerpt = get_comment_excerpt( $comment_id );

		$this->assertEquals( 10, count( explode( ' ', $excerpt ) ) );
	}

	public function _filter_comment_excerpt_length() {
		remove_filter( 'comment_excerpt_length', array( $this, __METHOD__ ) );

		return 10;
	}
}
