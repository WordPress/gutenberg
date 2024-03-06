<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Description: Printing since 1440. This is the development plugin for the block editor, site editor, and other future WordPress core functionality.
 * Requires at least: 6.3
 * Requires PHP: 7.0
 * Version: 18.0.0-rc.1
 * Author: Gutenberg Team
 * Text Domain: gutenberg
 *
 * @package gutenberg
 */

### BEGIN AUTO-GENERATED DEFINES
defined( 'GUTENBERG_DEVELOPMENT_MODE' ) or define( 'GUTENBERG_DEVELOPMENT_MODE', true );
### END AUTO-GENERATED DEFINES

gutenberg_pre_init();

/**
 * Display a version notice and deactivate the Gutenberg plugin.
 *
 * @since 0.1.0
 */
function gutenberg_wordpress_version_notice() {
	echo '<div class="error"><p>';
	/* translators: %s: Minimum required version */
	printf( __( 'Gutenberg requires WordPress %s or later to function properly. Please upgrade WordPress before activating Gutenberg.', 'gutenberg' ), '5.9' );
	echo '</p></div>';

	deactivate_plugins( array( 'gutenberg/gutenberg.php' ) );
}

/**
 * Display a build notice.
 *
 * @since 0.1.0
 */
function gutenberg_build_files_notice() {
	echo '<div class="error"><p>';
	_e( 'Gutenberg development mode requires files to be built. Run <code>npm install</code> to install dependencies, <code>npm run build</code> to build the files or <code>npm run dev</code> to build the files and watch for changes. Read the <a href="https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/getting-started-with-code-contribution.md">contributing</a> file for more information.', 'gutenberg' );
	echo '</p></div>';
}

/**
 * Verify that we can initialize the Gutenberg editor , then load it.
 *
 * @since 1.5.0
 *
 * @global string $wp_version             The WordPress version string.
 *
 */
function gutenberg_pre_init() {
	global $wp_version;
	if ( defined( 'GUTENBERG_DEVELOPMENT_MODE' ) && GUTENBERG_DEVELOPMENT_MODE && ! file_exists( __DIR__ . '/build/blocks' ) ) {
		add_action( 'admin_notices', 'gutenberg_build_files_notice' );
		return;
	}

	// Get unmodified $wp_version.
	include ABSPATH . WPINC . '/version.php';

	// Strip '-src' from the version string. Messes up version_compare().
	$version = str_replace( '-src', '', $wp_version );

	// Compare against major release versions (X.Y) rather than minor (X.Y.Z)
	// unless a minor release is the actual minimum requirement. WordPress reports
	// X.Y for its major releases.
	if ( version_compare( $version, '5.9', '<' ) ) {
		add_action( 'admin_notices', 'gutenberg_wordpress_version_notice' );
		return;
	}

	require_once __DIR__ . '/lib/load.php';
}

register_meta(
	'post',
	'text_custom_field',
	array(
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'string',
		'default'	   => '(008) Custom Field / Default value',
	)
);
register_meta(
	'post',
	'url_custom_field',
	array(
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'string',
		// 'default'	   => 'https://wpmovies.dev/wp-content/uploads/2023/04/goncharov-poster-original-1-682x1024.jpeg',
		'default'	   => 'https://wpmovies.dev/wp-content/uploads/2023/03/3bhkrj58Vtu7enYsRolD1fZdja1-683x1024.jpg',

	)
);

register_meta(
	'post',
	'movie_title',
	array(
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'string',
		'default'      => 'Goncharov',
	)
);
register_meta(
	'post',
	'poster_url',
	array(
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'string',
		'default'      => 'https://wpmovies.dev/wp-content/uploads/2023/03/3bhkrj58Vtu7enYsRolD1fZdja1-683x1024.jpg',
	)
);
register_meta(
	'post',
	'homepage_url',
	array(
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'string',
		'default'      => 'https://wpmovies.dev/movies/12-angry-men/',
	)
);
register_meta(
	'post',
	'runtime',
	array(
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'string',
		'default'      => '1h 37m',
	)
);
register_meta(
	'post',
	'release',
	array(
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'string',
		'default'      => 'Release date',
	)
);
register_meta(
	'post',
	'trailer_url',
	array(
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'string',
		'default'      => 'https://www.youtube.com/watch?v=Z4Dl1bMG_MA',
	)
);

$id_the_godfather            = 88;
$id_goncharov                = 94;
$id_the_shawshank_redemption = 96;
$id_schindlers_list          = 98;
$id_spirited_away            = 100;
$id_12_angry_men             = 102;
$id_demo_movie               = 90;

// Update movie title
update_post_meta( $id_demo_movie, 'movie_title', 'The Godfather' );
update_post_meta( $id_the_godfather, 'movie_title', 'The Godfather' );
update_post_meta( $id_goncharov, 'movie_title', 'Goncharov' );
update_post_meta( $id_the_shawshank_redemption, 'movie_title', 'The Shawshank Redemption' );
update_post_meta( $id_schindlers_list, 'movie_title', 'Schindler\'s List' );
update_post_meta( $id_spirited_away, 'movie_title', 'Spirited Away' );
update_post_meta( $id_12_angry_men, 'movie_title', '12 Angry Men' );

// Update release date
update_post_meta( $id_demo_movie, 'release', '14th March 1972' );
update_post_meta( $id_the_godfather, 'release', '14th March 1972' );
update_post_meta( $id_goncharov, 'release', '15th January 1973' );
update_post_meta( $id_the_shawshank_redemption, 'release', '23rd September 1994' );
update_post_meta( $id_schindlers_list, 'release', '15th December 1993' );
update_post_meta( $id_spirited_away, 'release', '20th July 2001' );
update_post_meta( $id_12_angry_men, 'release', '10th April 1957' );

// Update poster url
update_post_meta( $id_demo_movie, 'poster_url', 'https://wpmovies.dev/wp-content/uploads/2023/03/3bhkrj58Vtu7enYsRolD1fZdja1-683x1024.jpg' );
update_post_meta( $id_the_godfather, 'poster_url', 'https://wpmovies.dev/wp-content/uploads/2023/03/3bhkrj58Vtu7enYsRolD1fZdja1-683x1024.jpg' );
update_post_meta( $id_goncharov, 'poster_url', 'https://wpmovies.dev/wp-content/uploads/2023/04/goncharov-poster-original-1-682x1024.jpeg' );
update_post_meta( $id_the_shawshank_redemption, 'poster_url', 'https://wpmovies.dev/wp-content/uploads/2023/04/q6y0Go1tsGEsmtFryDOJo3dEmqu-683x1024.jpg' );
update_post_meta( $id_schindlers_list, 'poster_url', 'https://wpmovies.dev/wp-content/uploads/2023/03/sF1U4EUQS8YHUYjNl3pMGNIQyr0-683x1024.jpg' );
update_post_meta( $id_spirited_away, 'poster_url', 'https://wpmovies.dev/wp-content/uploads/2023/03/39wmItIWsg5sZMyRUHLkWBcuVCM-683x1024.jpg' );
update_post_meta( $id_12_angry_men, 'poster_url', 'https://wpmovies.dev/wp-content/uploads/2023/03/ppd84D2i9W8jXmsyInGyihiSyqz-682x1024.jpg' );

// Update homepage url
update_post_meta( $id_demo_movie, 'homepage_url', 'https://wpmovies.dev/movies/the-godfather/' );
update_post_meta( $id_the_godfather, 'homepage_url', 'https://wpmovies.dev/movies/the-godfather/' );
update_post_meta( $id_goncharov, 'homepage_url', 'https://wpmovies.dev/movies/goncharov/' );
update_post_meta( $id_the_shawshank_redemption, 'homepage_url', 'https://wpmovies.dev/movies/the-shawshank-redemption/' );
update_post_meta( $id_schindlers_list, 'homepage_url', 'https://wpmovies.dev/movies/schindlers-list/' );
update_post_meta( $id_spirited_away, 'homepage_url', 'https://wpmovies.dev/movies/spirited-away/' );
update_post_meta( $id_12_angry_men, 'homepage_url', 'https://wpmovies.dev/movies/12-angry-men/' );

// Update runtime
update_post_meta( $id_demo_movie, 'runtime', '2h 55m' );
update_post_meta( $id_the_godfather, 'runtime', '2h 55m' );
update_post_meta( $id_goncharov, 'runtime', '3h 32m' );
update_post_meta( $id_the_shawshank_redemption, 'runtime', '2h 22m' );
update_post_meta( $id_schindlers_list, 'runtime', '3h 15m' );
update_post_meta( $id_spirited_away, 'runtime', '2h 5m' );
update_post_meta( $id_12_angry_men, 'runtime', '1h 37m' );

// Update trailer url
update_post_meta( $id_demo_movie, 'trailer_url', 'https://www.youtube.com/watch?v=Ew9ngL1GZvs' );
update_post_meta( $id_the_godfather, 'trailer_url', 'https://www.youtube.com/watch?v=Ew9ngL1GZvs' );
update_post_meta( $id_goncharov, 'trailer_url', 'https://www.youtube.com/watch?v=Z4Dl1bMG_MA' );
update_post_meta( $id_the_shawshank_redemption, 'trailer_url', 'https://www.youtube.com/watch?v=PLl99DlL6b4' );
update_post_meta( $id_schindlers_list, 'trailer_url', 'https://www.youtube.com/watch?v=mxphAlJID9U' );
update_post_meta( $id_spirited_away, 'trailer_url', 'https://www.youtube.com/watch?v=ByXuk9QqQkk' );
update_post_meta( $id_12_angry_men, 'trailer_url', 'https://www.youtube.com/watch?v=TEN-2uTi2c0' );