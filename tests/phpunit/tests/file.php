<?php

/**
 * @group file
 */
class Tests_File extends WP_UnitTestCase {

	function setUp() {
		parent::setUp();

		$file = tempnam( '/tmp', 'foo') ;
		$this->dir = dirname( $file );
		unlink( $file );

		$this->badchars = '"\'[]*&?$';
	}

	/**
	 * @group plugins
	 * @group themes
	 */
	function test_get_file_data() {
		$theme_headers = array(
			'Name' => 'Theme Name',
			'ThemeURI' => 'Theme URI',
			'Description' => 'Description',
			'Version' => 'Version',
			'Author' => 'Author',
			'AuthorURI' => 'Author URI',
		);

		$actual = get_file_data( DIR_TESTDATA . '/themedir1/default/style.css', $theme_headers );

		$expected = array(
			'Name' => 'WordPress Default',
			'ThemeURI' => 'http://wordpress.org/',
			'Description' => 'The default WordPress theme based on the famous <a href="http://binarybonsai.com/kubrick/">Kubrick</a>.',
			'Version' => '1.6',
			'Author' => 'Michael Heilemann',
			'AuthorURI' => 'http://binarybonsai.com/',
		);

		foreach ( $actual as $header => $value )
			$this->assertEquals( $expected[ $header ], $value, $header );
	}

	/**
	 * @group plugins
	 * @group themes
	 */
	function test_get_file_data_cr_line_endings() {
		$headers = array( 'SomeHeader' => 'Some Header', 'Description' => 'Description', 'Author' => 'Author' );
		$actual = get_file_data( DIR_TESTDATA . '/formatting/cr-line-endings-file-header.php', $headers );
		$expected = array(
			'SomeHeader' => 'Some header value!',
			'Description' => 'This file is using CR line endings for a testcase.',
			'Author' => 'A Very Old Mac',
		);

		foreach ( $actual as $header => $value )
			$this->assertEquals( $expected[ $header ], $value, $header );
	}

	function is_unique_writable_file($path, $filename) {
		$fullpath = $path . DIRECTORY_SEPARATOR . $filename;

		$fp = fopen( $fullpath, 'x' );
		// file already exists?
		if (!$fp)
			return false;

		// write some random contents
		$c = rand_str();
		fwrite($fp, $c);
		fclose($fp);

		if ( file_get_contents($fullpath) === $c )
			$result = true;
		else
			$result = false;

		return $result;
	}

	function test_unique_filename_is_valid() {
		// make sure it produces a valid, writable, unique filename
		$filename = wp_unique_filename( $this->dir, rand_str() . '.txt' );

		$this->assertTrue( $this->is_unique_writable_file($this->dir, $filename) );

		unlink($this->dir . DIRECTORY_SEPARATOR . $filename);
	}

	function test_unique_filename_is_unique() {
		// make sure it produces two unique filenames
		$name = rand_str();

		$filename1 = wp_unique_filename( $this->dir, $name . '.txt' );
		$this->assertTrue( $this->is_unique_writable_file($this->dir, $filename1) );
		$filename2 = wp_unique_filename( $this->dir, $name . '.txt' );
		$this->assertTrue( $this->is_unique_writable_file($this->dir, $filename2) );

		// the two should be different
		$this->assertNotEquals( $filename1, $filename2 );

		unlink($this->dir . DIRECTORY_SEPARATOR . $filename1);
		unlink($this->dir . DIRECTORY_SEPARATOR . $filename2);
	}

	function test_unique_filename_is_sanitized() {
		$name = rand_str();
		$filename = wp_unique_filename( $this->dir, $name . $this->badchars .  '.txt' );

		// make sure the bad characters were all stripped out
		$this->assertEquals( $name . '.txt', $filename );

		$this->assertTrue( $this->is_unique_writable_file($this->dir, $filename) );

		unlink($this->dir . DIRECTORY_SEPARATOR . $filename);
	}

	function test_unique_filename_with_slashes() {
		$name = rand_str();
		// "foo/foo.txt"
		$filename = wp_unique_filename( $this->dir, $name . '/' . $name .  '.txt' );

		// the slash should be removed, i.e. "foofoo.txt"
		$this->assertEquals( $name . $name . '.txt', $filename );

		$this->assertTrue( $this->is_unique_writable_file($this->dir, $filename) );

		unlink($this->dir . DIRECTORY_SEPARATOR . $filename);
	}

	function test_unique_filename_multiple_ext() {
		$name = rand_str();
		$filename = wp_unique_filename( $this->dir, $name . '.php.txt' );

		// "foo.php.txt" becomes "foo.php_.txt"
		$this->assertEquals( $name . '.php_.txt', $filename );

		$this->assertTrue( $this->is_unique_writable_file($this->dir, $filename) );

		unlink($this->dir . DIRECTORY_SEPARATOR . $filename);
	}

	function test_unique_filename_no_ext() {
		$name = rand_str();
		$filename = wp_unique_filename( $this->dir, $name );

		$this->assertEquals( $name, $filename );

		$this->assertTrue( $this->is_unique_writable_file($this->dir, $filename) );

		unlink($this->dir . DIRECTORY_SEPARATOR . $filename);
	}

	/**
	 * @dataProvider data_wp_tempnam_filenames
	 */
	function test_wp_tempnam( $case ) {
		$file = wp_tempnam( $case );
		unlink( $file );

		$this->assertNotEmpty( basename( basename( $file, '.tmp' ), '.zip' ) );
	}
	function data_wp_tempnam_filenames() {
		return array(
			array( '0.zip' ),
			array( '0.1.2.3.zip' ),
			array( 'filename.zip' ),
			array( 'directory/0.zip' ),
			array( 'directory/filename.zip' ),
			array( 'directory/0/0.zip' ),
		);
	}

}
