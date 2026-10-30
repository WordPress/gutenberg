<?php
/**
 * Generates the WordPress stubs that PHPStan analyzes against, from WordPress core trunk or from a
 * wordpress-develop pull request.
 *
 * Gutenberg tracks core trunk, so the stubs released for each WordPress version lack the functions,
 * classes, and types that were added since. Until php-stubs/wordpress-stubs publishes stubs built
 * from trunk, they are generated here with its generator, and installed through the path repository
 * in composer.json in place of the released package.
 *
 * The stubs are not committed. The package's composer.json records the source that they are generated
 * from, and `composer phpstan` runs this script with no option first, which generates them when they
 * are missing or were generated from another source.
 *
 * This is temporary. Once php-stubs/wordpress-stubs publishes builds from trunk, require a pinned one
 * instead, and remove this script, the wordpress-stubs/ package, and the path repository.
 *
 * Usage, through `composer phpstan:generate-wordpress-stubs -- <option>`:
 *
 *   (no option)          Generate the stubs from the source recorded in wordpress-stubs/composer.json,
 *                        unless they already were. Add `--force` to generate them anyway.
 *   --commit=<ref>       Generate from a commit of wordpress-develop, such as `trunk`.
 *   --pr=<number|url>    Generate from the head of a wordpress-develop pull request, for a Gutenberg
 *                        pull request that depends on it. Before the Gutenberg pull request is
 *                        merged, regenerate with `--commit=trunk` once the core change is committed.
 *   --checkout[=<path>]  Generate from the working tree of a wordpress-develop checkout, including
 *                        changes to tracked files that are not committed yet. By default, this is the
 *                        checkout that Gutenberg is in, such as at src/wp-content/plugins/gutenberg.
 *                        Add `--pr` to name the pull request that the checkout is working on. Stubs
 *                        generated from uncommitted changes cannot be generated again elsewhere, such
 *                        as in CI, so generate them with `--pr` or `--commit` before pushing.
 *
 * A commit is read from the wordpress-develop checkout that Gutenberg is in when it has the commit,
 * and is fetched from GitHub otherwise. The options record the new source in composer.json, which is
 * what gets committed. After using one, run `composer update` and `composer phpstan:baselines`.
 *
 * This needs PHP, Composer, and Git, and runs commands without a shell, so that it works on Windows
 * too. It reports on standard error, since `composer phpstan` runs it before the analysis, whose
 * report may be read from standard output.
 */

namespace Gutenberg\PHPStan\WordPressStubs;

use RuntimeException;

/**
 * The header that the generator's generate.sh passes, which is replaced afterward.
 */
const GENERATOR_HEADER = "/**\n * Generated stub declarations for WordPress.\n * @see https://wordpress.org\n * @see https://github.com/php-stubs/wordpress-stubs\n */";

/**
 * Writes a line of progress to standard error.
 *
 * @param string $message The message.
 */
function report( string $message ): void {
	fwrite( STDERR, $message . "\n" );
}

/**
 * Prints the usage from this file's docblock, and exits.
 *
 * @param int<0, 1> $status The exit status.
 * @return never
 */
function usage( int $status = 1 ): void {
	$contents = (string) file_get_contents( __FILE__ );
	if ( preg_match( '/\n \* (Usage.*?)\n \* A commit/s', $contents, $matches ) ) {
		report( rtrim( (string) preg_replace( '/^ \*(?: |$)/m', '', $matches[1] ) ) );
	}
	exit( $status );
}

/**
 * Reads an environment variable, which can override a setting.
 *
 * @param non-empty-string $name          The name of the variable.
 * @param non-empty-string $default_value The value when the variable is not set or is empty.
 * @return non-empty-string The value.
 */
function setting( string $name, string $default_value ): string {
	$value = getenv( $name );
	if ( false === $value || '' === $value ) {
		return $default_value;
	}
	return $value;
}

/**
 * Runs a command without a shell, so that its arguments need no quoting on any platform.
 *
 * @param non-empty-list<string>          $command The program and its arguments.
 * @param 'pass'|'capture'|'quiet'        $mode    'pass' to pass its output to standard error,
 *                                                 'capture' to return its standard output, or 'quiet'
 *                                                 to also discard its standard error.
 * @param non-empty-string|null           $cwd     The working directory.
 * @param array<non-empty-string, string> $env     Environment variables to set in addition to the
 *                                                 current ones.
 * @return array{int, string} The exit status, and the standard output when captured.
 */
function execute( array $command, string $mode = 'pass', ?string $cwd = null, array $env = array() ): array {
	$null_device = '\\' === DIRECTORY_SEPARATOR ? 'NUL' : '/dev/null';
	$descriptors = array( 0 => array( 'file', $null_device, 'r' ) );
	if ( 'pass' === $mode ) {
		$descriptors[1] = STDERR;
		$descriptors[2] = STDERR;
	} else {
		$descriptors[1] = array( 'pipe', 'w' );
		$descriptors[2] = 'quiet' === $mode ? array( 'file', $null_device, 'w' ) : STDERR;
	}

	$process = proc_open( $command, $descriptors, $pipes, $cwd, array() !== $env ? array_merge( getenv(), $env ) : null );
	if ( ! is_resource( $process ) ) {
		throw new RuntimeException( "Unable to run $command[0]." );
	}
	$output = '';
	if ( isset( $pipes[1] ) ) {
		$output = (string) stream_get_contents( $pipes[1] );
		fclose( $pipes[1] );
	}
	return array( proc_close( $process ), $output );
}

/**
 * Runs a command, passing its output to standard error, and throws when it fails.
 *
 * @param non-empty-list<string>          $command The program and its arguments.
 * @param non-empty-string|null           $cwd     The working directory.
 * @param array<non-empty-string, string> $env     Environment variables to set in addition to the
 *                                                 current ones.
 */
function run( array $command, ?string $cwd = null, array $env = array() ): void {
	list( $status ) = execute( $command, 'pass', $cwd, $env );
	if ( 0 !== $status ) {
		throw new RuntimeException( "Exited with status $status: " . implode( ' ', $command ) );
	}
}

/**
 * Runs a command, and returns its standard output without surrounding whitespace.
 *
 * @param non-empty-list<string> $command The program and its arguments.
 * @param bool                   $check   Whether to throw when the command fails, rather than return its output.
 * @return string The output.
 */
function capture( array $command, bool $check = true ): string {
	list( $status, $output ) = execute( $command, $check ? 'capture' : 'quiet' );
	if ( $check && 0 !== $status ) {
		throw new RuntimeException( "Exited with status $status: " . implode( ' ', $command ) );
	}
	return trim( $output );
}

/**
 * Runs a command quietly, and returns whether it succeeded.
 *
 * @param non-empty-list<string> $command The program and its arguments.
 * @return bool Whether it exited with status 0.
 */
function succeeds( array $command ): bool {
	list( $status ) = execute( $command, 'quiet' );
	return 0 === $status;
}

/**
 * Returns the command that runs Composer: the one running this script, when Composer runs it.
 *
 * @return non-empty-list<string> The program and its leading arguments.
 */
function composer(): array {
	$binary = getenv( 'COMPOSER_BINARY' );
	if ( false === $binary || '' === $binary ) {
		return array( 'composer' );
	}
	return array( PHP_BINARY, $binary );
}

/**
 * Creates a new, empty directory in the given one.
 *
 * @param string           $parent_dir The directory to create it in.
 * @param non-empty-string $prefix     The prefix of its name.
 * @return non-empty-string The path of the new directory.
 * @throws RuntimeException When the directory cannot be created.
 */
function create_directory( string $parent_dir, string $prefix ): string {
	$dir = rtrim( $parent_dir, '/\\' ) . '/' . str_replace( '.', '', uniqid( $prefix, true ) );
	if ( ! mkdir( $dir, 0777, true ) ) {
		throw new RuntimeException( "Unable to create $dir." );
	}
	return $dir;
}

/**
 * Removes a file, or a directory with everything in it, including the read-only files that Git writes.
 *
 * @param non-empty-string $path The file or directory, which need not exist.
 */
function remove_path( string $path ): void {
	if ( is_dir( $path ) && ! is_link( $path ) ) {
		$names = scandir( $path );
		foreach ( false !== $names ? $names : array() as $name ) {
			if ( '.' !== $name && '..' !== $name ) {
				remove_path( "$path/$name" );
			}
		}
		rmdir( $path );
	} elseif ( is_link( $path ) ) {
		unlink( $path );
	} elseif ( file_exists( $path ) ) {
		chmod( $path, 0666 );
		unlink( $path );
	}
}

/**
 * Returns the directory of the wordpress-develop checkout that contains the given directory, if any.
 *
 * @param non-empty-string $dir The directory.
 * @return non-empty-string|null The checkout's directory.
 */
function find_checkout( string $dir ): ?string {
	while ( dirname( $dir ) !== $dir ) {
		$dir = dirname( $dir );
		if ( is_file( "$dir/src/wp-includes/version.php" ) && is_file( "$dir/wp-tests-config-sample.php" ) ) {
			return $dir;
		}
	}
	return null;
}

/**
 * Reads the source that the package's composer.json records.
 *
 * @param non-empty-string $file The package's composer.json.
 * @return array{commit: string, pull_request: ''|numeric-string, uncommitted_changes: bool} The recorded source.
 */
function read_recorded( string $file ): array {
	$json   = json_decode( (string) file_get_contents( $file ), true );
	$extra  = is_array( $json ) && isset( $json['extra'] ) && is_array( $json['extra'] ) ? $json['extra'] : array();
	$source = isset( $extra['source'] ) && is_array( $extra['source'] ) ? $extra['source'] : array();
	return array(
		'commit'              => isset( $source['commit'] ) && is_string( $source['commit'] ) ? $source['commit'] : '',
		'pull_request'        => isset( $source['pull-request'] ) && is_int( $source['pull-request'] ) && $source['pull-request'] > 0 ? (string) $source['pull-request'] : '',
		'uncommitted_changes' => ! empty( $source['uncommitted-changes'] ),
	);
}

/**
 * Fetches a single commit of a GitHub repository into a directory, limited to the given paths.
 *
 * @param non-empty-string                 $dir      The directory, which is created or must be empty.
 * @param non-empty-string                 $repo     The repository, such as WordPress/wordpress-develop.
 * @param non-empty-string                 $commit   The commit or ref to fetch.
 * @param non-empty-list<non-empty-string> $patterns The sparse checkout patterns.
 */
function fetch_commit( string $dir, string $repo, string $commit, array $patterns ): void {
	run( array( 'git', 'init', '--quiet', $dir ) );
	run( array( 'git', '-C', $dir, 'remote', 'add', 'origin', "https://github.com/$repo.git" ) );
	run( array( 'git', '-C', $dir, 'sparse-checkout', 'set', '--no-cone', ...$patterns ) );
	run( array( 'git', '-C', $dir, 'fetch', '--quiet', '--depth=1', '--filter=blob:none', 'origin', $commit ) );
	run( array( 'git', '-C', $dir, '-c', 'advice.detachedHead=false', '-c', 'core.autocrlf=false', 'checkout', '--quiet', 'FETCH_HEAD' ) );
}

/**
 * Returns the full hash of a commit.
 *
 * @param non-empty-string $dir The repository.
 * @param non-empty-string $ref The commit, branch, or other ref.
 * @return non-empty-string The hash.
 * @throws RuntimeException When the ref is not a commit in the repository.
 */
function resolve_commit( string $dir, string $ref ): string {
	$hash = capture( array( 'git', '-C', $dir, 'rev-parse', '--verify', '--quiet', "$ref^{commit}" ) );
	if ( '' === $hash ) {
		throw new RuntimeException( "$ref is not a commit in $dir." );
	}
	return $hash;
}

/**
 * Returns the SVN revision of the most recent trunk commit in the history of a commit, that is, the
 * revision of the commit itself when it is on trunk. A shallow clone is deepened until one is found.
 *
 * @param non-empty-string $dir    The repository.
 * @param non-empty-string $commit The commit.
 * @return positive-int|null The revision.
 */
function find_revision( string $dir, string $commit ): ?int {
	for ( $i = 0; $i < 20; $i++ ) {
		$message = capture( array( 'git', '-C', $dir, 'log', '-1', '--format=%B', '--grep=^git-svn-id: ', $commit ) );
		if ( preg_match( '/^git-svn-id: [^@]*@(\d+) /m', $message, $matches ) && (int) $matches[1] > 0 ) {
			return (int) $matches[1];
		}
		if ( 'true' !== capture( array( 'git', '-C', $dir, 'rev-parse', '--is-shallow-repository' ) ) ) {
			break;
		}
		run( array( 'git', '-C', $dir, 'fetch', '--quiet', '--deepen=100', '--filter=blob:none', 'origin', $commit ) );
	}
	return null;
}

/**
 * Returns whether a commit is itself on trunk, rather than based on it.
 *
 * @param non-empty-string $dir    The repository.
 * @param non-empty-string $commit The commit.
 * @return bool Whether the commit has a revision.
 */
function is_trunk_commit( string $dir, string $commit ): bool {
	return 1 === preg_match( '/^git-svn-id: /m', capture( array( 'git', '-C', $dir, 'log', '-1', '--format=%B', $commit ) ) );
}

/**
 * Reads the key that the existing stubs were generated with, if any.
 *
 * @param non-empty-string $file The stubs.
 * @return string The key, or an empty string.
 */
function read_stub_key( string $file ): string {
	if ( ! is_file( $file ) ) {
		return '';
	}
	$head = (string) file_get_contents( $file, false, null, 0, 2048 );
	return preg_match( '/^ \* Generation key: ([0-9a-f]{40})$/m', $head, $matches ) ? $matches[1] : '';
}

/**
 * Generates the stubs.
 *
 * @param list<string> $args The command line arguments.
 */
function main( array $args ): void {
	// Each of the following can be overridden with an environment variable of the same name, such as
	// to try a generator change, or a fork of wordpress-develop.

	// The GitHub repository and commit of the generator, which is cached by its commit, so this needs
	// to be a commit hash rather than a branch. This is the head of
	// https://github.com/php-stubs/wordpress-stubs/pull/498, without which the function map adds a
	// second `@phpstan-return` to the docblocks for which core trunk now has its own.
	$stubs_repo   = setting( 'WORDPRESS_STUBS_REPO', 'php-stubs/wordpress-stubs' );
	$stubs_commit = setting( 'WORDPRESS_STUBS_COMMIT', '7c32aeca37ad7defa54758674ff62a70a521c8b5' );

	// The generator's dependencies that determine its output, pinned to exact versions, as Gutenberg
	// pins its own development tools in composer.json, so that a new release does not change the
	// stubs without a commit. The generator's other dependencies are its own development tools.
	$packages = setting( 'WORDPRESS_STUBS_GENERATOR_PACKAGES', 'php-stubs/generator:0.9.0 nikic/php-parser:5.9.0 phpdocumentor/reflection-docblock:6.0.3 phpdocumentor/type-resolver:2.1.0 phpstan/phpdoc-parser:2.4.0' );

	// The GitHub repository that commits and pull requests are fetched from.
	$develop_repo = setting( 'WORDPRESS_DEVELOP_REPO', 'WordPress/wordpress-develop' );

	$package_dir   = __DIR__ . '/wordpress-stubs';
	$package_file  = $package_dir . '/composer.json';
	$stub_file     = $package_dir . '/wordpress-stubs.stub';
	$gutenberg_dir = dirname( __DIR__, 2 );

	// Where the generator is kept with its dependencies installed, one directory per repository,
	// commit, and set of pinned packages, so that it is only set up once.
	$cache_dir = setting( 'WORDPRESS_STUBS_CACHE_DIR', $gutenberg_dir . '/.cache/wordpress-stubs-generator' );

	// Returns a key for everything that the stubs are generated from, including this script, so that
	// they are generated again when any of it changes. The stubs record the key they were generated
	// with.
	/**
	 * @param non-empty-string  $commit The commit.
	 * @param ''|numeric-string $pr     The pull request number, if any.
	 * @return non-empty-string The key.
	 */
	$generation_key = static function ( string $commit, string $pr ) use ( $develop_repo, $stubs_repo, $stubs_commit, $packages ): string {
		return sha1( implode( "\n", array( $develop_repo, $commit, $pr, $stubs_repo, $stubs_commit, $packages, (string) file_get_contents( __FILE__ ) ) ) );
	};

	$commit       = '';
	$pr           = '';
	$checkout     = '';
	$use_checkout = false;
	$force        = false;
	foreach ( $args as $arg ) {
		if ( preg_match( '/^--(commit|pr|checkout)=(.+)$/', $arg, $matches ) ) {
			if ( 'commit' === $matches[1] ) {
				$commit = $matches[2];
			} elseif ( 'pr' === $matches[1] ) {
				$pr = $matches[2];
			} else {
				$use_checkout = true;
				$checkout     = $matches[2];
			}
		} elseif ( '--checkout' === $arg ) {
			$use_checkout = true;
		} elseif ( '--force' === $arg ) {
			$force = true;
		} elseif ( '--help' === $arg ) {
			usage( 0 );
		} else {
			usage();
		}
	}
	if ( preg_match( '#^(?:https://github\.com/' . preg_quote( $develop_repo, '#' ) . '/pull/)?(\d+)/?$#', $pr, $matches ) ) {
		$pr = $matches[1];
	} elseif ( '' !== $pr ) {
		throw new RuntimeException( "Not a $develop_repo pull request: $pr" );
	}
	if ( '' !== $commit && ( '' !== $pr || $use_checkout ) ) {
		usage();
	}

	// Without an option, generate from the source recorded in composer.json, unless the stubs
	// already were. Uncommitted changes cannot be generated again, since they are not recorded, so
	// stubs generated from them are used as they are.
	$recorded = '' === $commit && '' === $pr && ! $use_checkout;
	if ( $recorded ) {
		$recorded_source = read_recorded( $package_file );
		$commit          = $recorded_source['commit'];
		$pr              = $recorded_source['pull_request'];
		if ( $recorded_source['uncommitted_changes'] ) {
			if ( is_file( $stub_file ) && ! $force ) {
				report( 'Using the WordPress stubs generated from uncommitted changes in a wordpress-develop checkout. Generate them with --pr or --commit before pushing, since they cannot be generated again elsewhere.' );
				return;
			}
			report( 'The WordPress stubs were generated from uncommitted changes in a wordpress-develop checkout, which cannot be generated again. Pass an option.' );
			usage();
		}
		if ( '' === $commit ) {
			report( "No source for the WordPress stubs is recorded in $package_file. Pass an option." );
			usage();
		}
		if ( ! $force && read_stub_key( $stub_file ) === $generation_key( $commit, $pr ) ) {
			return;
		}
	}

	$work_dir = create_directory( sys_get_temp_dir(), 'wordpress-stubs.' );
	register_shutdown_function(
		static function () use ( $work_dir ): void {
			remove_path( $work_dir );
		}
	);

	// The generator's finder reads the WordPress source from a fixed path in its working directory.
	$source_dir = $work_dir . '/source/wordpress';

	$local_checkout = '' !== $checkout ? $checkout : find_checkout( $gutenberg_dir );
	$uncommitted    = false;
	$head_commit    = '';
	$branch         = '';
	if ( $use_checkout ) {
		if ( null === $local_checkout || ! succeeds( array( 'git', '-C', $local_checkout, 'rev-parse', '--git-dir' ) ) ) {
			throw new RuntimeException( 'No wordpress-develop checkout found' . ( '' !== $checkout ? " at $checkout" : '' ) . '.' );
		}
		$local_checkout = realpath( $local_checkout );
		if ( false === $local_checkout ) {
			throw new RuntimeException( 'Unable to resolve the path of the wordpress-develop checkout.' );
		}
		$head_commit = resolve_commit( $local_checkout, 'HEAD' );
		$branch      = capture( array( 'git', '-C', $local_checkout, 'symbolic-ref', '--short', '-q', 'HEAD' ), false );
		// Capture the working tree as a commit without changing the checkout. It is empty when there
		// are no changes to tracked files.
		$commit = capture( array( 'git', '-C', $local_checkout, 'stash', 'create' ) );
		if ( '' !== $commit ) {
			$uncommitted = true;
		} else {
			$commit = $head_commit;
		}
	} elseif ( '' !== $pr && '' === $commit ) {
		$commit = "refs/pull/$pr/head";
	}
	if ( '' === $commit ) {
		throw new RuntimeException( 'No wordpress-develop commit to generate the stubs from.' );
	}

	if ( null !== $local_checkout && preg_match( '/^[0-9a-f]{40}$/', $commit ) && succeeds( array( 'git', '-C', $local_checkout, 'cat-file', '-e', "$commit^{commit}" ) ) ) {
		report( "Reading $develop_repo@$commit from $local_checkout" );
		// Check out the commit's src directory with an index of its own, leaving the checkout as it is.
		$env = array( 'GIT_INDEX_FILE' => $work_dir . '/index' );
		run( array( 'git', '-C', $local_checkout, 'read-tree', "$commit:src" ), null, $env );
		run( array( 'git', '-C', $local_checkout, '-c', 'core.autocrlf=false', 'checkout-index', '--all', "--prefix=$source_dir/" ), null, $env );
		$repo_dir = $local_checkout;
	} else {
		report( "Fetching $develop_repo@$commit" );
		$repo_dir = $work_dir . '/wordpress-develop';
		fetch_commit( $repo_dir, $develop_repo, $commit, array( '/src/' ) );
		$commit = resolve_commit( $repo_dir, 'HEAD' );
		mkdir( dirname( $source_dir ) );
		rename( $repo_dir . '/src', $source_dir );
	}
	$revision = find_revision( $repo_dir, $commit );
	$is_trunk = is_trunk_commit( $repo_dir, $commit );

	// Set up the generator unless it is cached. Its Composer scripts would install the latest
	// WordPress release as the source to generate from, so they are skipped. It is set up in a
	// directory of its own and moved into place once done, so that an interrupted run leaves nothing
	// to be used.
	$generator_dir = $cache_dir . '/' . str_replace( '/', '-', $stubs_repo ) . "-$stubs_commit-" . substr( sha1( $packages ), 0, 12 );
	if ( is_dir( $generator_dir ) ) {
		report( "Using $stubs_repo@$stubs_commit from $generator_dir" );
	} else {
		report( "Fetching $stubs_repo@$stubs_commit" );
		$setup_dir = create_directory( $cache_dir, '.setup-' );
		register_shutdown_function(
			static function () use ( $setup_dir ): void {
				remove_path( $setup_dir );
			}
		);
		fetch_commit( $setup_dir, $stubs_repo, $stubs_commit, array( '/*' ) );
		$package_list = preg_split( '/\s+/', $packages, -1, PREG_SPLIT_NO_EMPTY );
		run( array_merge( composer(), array( "--working-dir=$setup_dir", 'require', '--dev', '--no-update', '--no-interaction' ), false !== $package_list ? $package_list : array() ) );
		run( array_merge( composer(), array( "--working-dir=$setup_dir", 'update', '--no-interaction', '--no-progress', '--no-scripts' ) ) );
		if ( ! rename( $setup_dir, $generator_dir ) ) {
			throw new RuntimeException( "Unable to move the generator to $generator_dir." );
		}
	}

	// Do what the generator's generate.sh does for trunk. Its Requests 1.x step applies only to
	// versions of WordPress that bundle that library, which are not supported here.
	if ( file_exists( $source_dir . '/wp-includes/Requests/Cookie/Jar.php' ) ) {
		throw new RuntimeException( 'Generating the stubs for a version of WordPress with Requests 1.x is not supported.' );
	}

	// Fix the incorrect "binary string" type in the AVIF info class.
	$avif_file = $source_dir . '/wp-includes/class-avif-info.php';
	if ( is_file( $avif_file ) ) {
		file_put_contents( $avif_file, preg_replace( '/@(param|return) binary string/', '@$1 string', (string) file_get_contents( $avif_file ) ) );
	}

	report( 'Generating the WordPress stubs' );
	$generated_file = $work_dir . '/wordpress-stubs.php';
	run(
		array(
			PHP_BINARY,
			$generator_dir . '/vendor/bin/generate-stubs',
			'--force',
			"--finder=$generator_dir/finder.php",
			"--visitor=$generator_dir/visitor.php",
			'--header=' . GENERATOR_HEADER,
			'--functions',
			'--classes',
			'--interfaces',
			'--traits',
			"--out=$generated_file",
		),
		$work_dir
	);
	$stubs = (string) file_get_contents( $generated_file );

	// Shim the global $wpdb declaration, since it is actually set up inside a function call.
	$wpdb = "/**\n * WordPress database abstraction object.\n * @var wpdb\n */\n\$wpdb = \\null;\n";
	if ( preg_match( '/^namespace \{$/m', $stubs ) ) {
		$stubs .= "\nnamespace {\n$wpdb}\n";
	} else {
		$stubs .= "\n$wpdb";
	}

	// The WordPress version at the commit, such as 7.2-beta1-64606-src. A path repository needs an
	// explicit version, which szepeviktor/phpstan-wordpress requires to be at least 6.6.2, so it is
	// derived from this and the revision of the most recent trunk commit, such as 7.2.0-beta1.64757.
	$wp_version = ( static function ( string $file ): string {
		$wp_version = '';
		require $file;
		return $wp_version;
	} )( $source_dir . '/wp-includes/version.php' );
	if ( null === $revision || ! preg_match( '/^(\d+\.\d+)(\.\d+)?-([a-zA-Z]+\d*)-/', $wp_version, $matches ) ) {
		throw new RuntimeException( "Unable to determine the revision ($revision) and version ($wp_version) of the commit." );
	}
	$package_version = $matches[1] . ( '' !== $matches[2] ? $matches[2] : '.0' ) . "-$matches[3].$revision";

	// Describe where the stubs came from: a trunk commit has a revision of its own, while a pull
	// request or a checkout is described by the trunk revision it is based on. A commit in a checkout
	// is not linked unless it is named as the head of a pull request, since it may not have been
	// pushed.
	$commit_url = "https://github.com/$develop_repo/commit/$commit";
	$pr_url     = '' !== $pr ? "https://github.com/$develop_repo/pull/$pr" : '';
	if ( $uncommitted || ( $use_checkout && '' === $pr && ! $is_trunk ) ) {
		$description = ( '' !== $pr_url ? "$pr_url, from " : '' ) . "a wordpress-develop checkout at $head_commit" . ( '' !== $branch ? " (branch $branch)" : '' ) . ( $uncommitted ? ' with uncommitted changes' : '' ) . ", based on r$revision";
	} elseif ( '' !== $pr ) {
		$description = "$pr_url at $commit_url, based on r$revision";
	} elseif ( $is_trunk ) {
		$description = "$commit_url (r$revision)";
	} else {
		$description = "$commit_url, based on r$revision";
	}

	// Replace the generator's header with one that records where the stubs came from.
	$header_end = strpos( $stubs, "\n */\n" );
	if ( false === $header_end ) {
		throw new RuntimeException( 'The generated stubs have no header.' );
	}
	$key    = $generation_key( $commit, $pr );
	$header = <<<HEADER
<?php
/**
 * Generated stub declarations for WordPress trunk, for Gutenberg's PHPStan analysis.
 *
 * Generated from $description
 * with https://github.com/$stubs_repo/commit/$stubs_commit.
 *
 * Do not edit. This file is not committed: `composer phpstan` generates it from the source
 * recorded in composer.json, using tools/phpstan/generate-wordpress-stubs.php.
 *
 * Generation key: $key
 */

HEADER;
	file_put_contents( $stub_file, $header . substr( $stubs, $header_end + strlen( "\n */\n" ) ) );

	// The recorded source is only written when it changes, by an option.
	if ( $recorded ) {
		report( "Generated the WordPress stubs for WordPress $wp_version from $description." );
		return;
	}

	// Write the package, recording the source to generate the stubs from. Uncommitted changes record
	// no commit, since the one that captured them exists only in the checkout.
	$source = $uncommitted ? array( 'uncommitted-changes' => true ) : array( 'commit' => $commit );
	if ( '' !== $pr ) {
		$source['pull-request'] = (int) $pr;
	}
	$source['revision'] = $revision;
	$json               = (string) json_encode(
		array(
			'name'        => 'php-stubs/wordpress-stubs',
			'version'     => $package_version,
			'description' => "WordPress stubs generated from $description, in place of the released package.",
			'license'     => 'GPL-2.0-or-later',
			'extra'       => array( 'source' => $source ),
		),
		JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
	);
	$json               = (string) preg_replace_callback(
		'/^(?: {4})+/m',
		static function ( array $indent ): string {
			return str_repeat( "\t", (int) ( strlen( $indent[0] ) / 4 ) );
		},
		$json
	);
	file_put_contents( $package_file, $json . "\n" );

	report( "Generated the WordPress stubs for WordPress $wp_version from $description, as version $package_version. Run `composer update` and `composer phpstan:baselines`, and commit tools/phpstan/wordpress-stubs/composer.json." );
}

try {
	$arguments = isset( $_SERVER['argv'] ) && is_array( $_SERVER['argv'] ) ? array_slice( $_SERVER['argv'], 1 ) : array();
	main( array_values( array_filter( $arguments, 'is_string' ) ) );
} catch ( RuntimeException $exception ) {
	report( $exception->getMessage() );
	exit( 1 );
}
