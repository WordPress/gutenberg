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
	private $file;

	private $version;

	private $inside_defines_block;

	public function __construct( $path ) {
		$this->file = fopen( $path, 'r' );

		$this->version              = null;
		$this->inside_defines_block = false;
	}

	public function print_header() {
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
					$this->print_production_defines();
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

	private function print_production_defines() {
		echo "define( 'GUTENBERG_VERSION', '{$this->version}' );\n";

		$git_commit = trim( shell_exec( 'git rev-parse HEAD' ) );

		echo "define( 'GUTENBERG_GIT_COMMIT', '{$git_commit}' );\n";
	}

	public function __destruct() {
		fclose( $this->file );
	}
}

$gutenberg_header_generator = new Gutenberg_Header_File_Generator( dirname( __DIR__ ) . '/gutenberg.php' );
$gutenberg_header_generator->print_header();
