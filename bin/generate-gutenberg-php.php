#!/usr/bin/env php
<?php
/**
 * Generates the production (plugin build) version of `gutenberg.php`,
 * containing alternate `define` statements from the development version.
 *
 * @package gutenberg-build
 */

/**
 * Prints `define` statements for the production version of `gutenberg.php`
 * (the plugin entry point).
 */
class Gutenberg_Header_File_Generator {
	/**
	 * Resource to a file stream.
	 *
	 * @var resource
	 */
	private $file;

	/**
	 * Gutenberg version.
	 *
	 * @var string|null
	 */
	private $version;

	/**
	 * Defines if the current line is inside a defines block.
	 *
	 * @var bool
	 */
	private $inside_defines_block;

	/**
	 * Constructor.
	 *
	 * @param string $path Absolute file path to gutenberg.php.
	 */
	public function __construct( $path ) {
		$this->file = fopen( $path, 'r' );

		$this->version              = null;
		$this->inside_defines_block = false;
	}

	/**
	 * Prints the header file.
	 */
	public function print_header_file() {
		while ( true ) {
			$line = fgets( $this->file );
			if ( false === $line ) {
				break;
			}

			$matches = array();

			if (
					! $this->version &&
					preg_match( '@^\s*\*\s*Version:\s*([0-9.]+)@', $line, $matches )
			) {
				$this->version = $matches[1];
			}

			switch ( trim( $line ) ) {
				case '### BEGIN AUTO-GENERATED DEFINES':
					$this->inside_defines_block = true;
					echo $line;
					$this->print_version_information();
					break;

				case '### END AUTO-GENERATED DEFINES':
					$this->inside_defines_block = false;
					echo $line;
					break;

				default:
					if ( ! $this->inside_defines_block ) {
						echo $line;
					}
					break;
			}
		}
	}

	/**
	 * Prints plugin header.
	 */
	private function print_version_information() {
		echo "define( 'GUTENBERG_VERSION', '{$this->version}' );\n";

		$git_commit = trim( shell_exec( 'git rev-parse HEAD' ) );

		echo "define( 'GUTENBERG_GIT_COMMIT', '{$git_commit}' );\n";
	}

	/**
	 * Destructor.
	 */
	public function __destruct() {
		fclose( $this->file );
	}
}

$gutenberg_header_generator = new Gutenberg_Header_File_Generator( dirname( __DIR__ ) . '/gutenberg.php' );
$gutenberg_header_generator->print_header_file();
