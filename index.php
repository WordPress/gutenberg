<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://wordpress.github.io/gutenberg/
 * Description: Prototyping since 1440. Development plugin for the editor focus in core.
 * Version: 0.1.0
 *
 * @package gutenberg
 */

/**
 * Gutenberg's Menu.
 *
 * Adds a new wp-admin menu page for the Gutenberg editor.
 *
 * @since 0.1.0
 */
function gutenberg_menu() {
	add_menu_page(
		'Gutenberg',
		'Gutenberg',
		'manage_options',
		'gutenberg',
		'the_gutenberg_project'
	);
}

add_action( 'admin_menu', 'gutenberg_menu' );

/**
 * Registers common scripts to be used as dependencies of the editor and plugins.
 *
 * @since 0.1.0
 */
function gutenberg_register_scripts() {
	$suffix = SCRIPT_DEBUG ? '' : '.min';

	// Vendor
	wp_register_script( 'react', 'https://unpkg.com/react@15/dist/react' . $suffix . '.js' );
	wp_register_script( 'react-dom', 'https://unpkg.com/react-dom@15/dist/react-dom' . $suffix . '.js', array( 'react' ) );

	// Editor
	wp_register_script( 'wp-element', plugins_url( 'modules/element/build/index.js', __FILE__ ), array( 'react', 'react-dom' ) );
	wp_register_script( 'wp-blocks', plugins_url( 'modules/blocks/build/index.js', __FILE__ ), array( 'wp-element' ) );
}
add_action( 'init', 'gutenberg_register_scripts' );

/**
 * Scripts & Styles.
 *
 * Enqueues the needed scripts and styles when visiting the top-level page of
 * the Gutenberg editor.
 *
 * @param string $hook Screen name.
 * @since 0.1.0
 */
function gutenberg_scripts_and_styles( $hook ) {
	if ( 'toplevel_page_gutenberg' === $hook ) {
		// Scripts
		wp_enqueue_script( 'wp-editor', plugins_url( 'modules/editor/build/index.js', __FILE__ ), array( 'wp-blocks', 'wp-element' ), false, true );
		wp_add_inline_script( 'wp-editor', 'wp.editor.createEditorInstance( \'editor\', { content: window.content } );' );

		// Styles
		wp_enqueue_style( 'wp-editor', plugins_url( 'modules/editor/build/style.css', __FILE__ ) );
	}
}

add_action( 'admin_enqueue_scripts', 'gutenberg_scripts_and_styles' );

/**
 * Project.
 *
 * The main entry point for the Gutenberg editor. Renders the editor on the
 * wp-admin page for the plugin.
 *
 * @since 0.1.0
 */
function the_gutenberg_project() {
	?>
	<div class="gutenberg">
		<section id="editor" class="gutenberg__editor" contenteditable="true">
			<!-- wp:heading -->
			<h1>1.0 Is The Loneliest Number</h1>
			<!-- /wp:heading -->

			<!-- wp:text -->
			<p>I imagine prior to the launch of the iPod, or the iPhone, there were teams saying the same thing: the copy + paste guys are <em>so close</em> to being ready and we know Walt Mossberg is going to ding us for this so let's just not ship to the manufacturers in China for just a few more weeks… The Apple teams were probably embarrassed. But <strong>if you're not embarrassed when you ship your first version you waited too long</strong>.</p>
			<!-- /wp:text -->

			<!-- wp:image -->
			<figure><img src="https://cldup.com/Bc9YxmqFnJ.jpg" /></figure>
			<!-- /wp:image -->

			<!-- wp:text -->
			<p>A beautiful thing about Apple is how quickly they obsolete their own products. I imagine this also makes the discipline of getting things out there easier. Like I mentioned before, the longer it’s been since the last release the more pressure there is, but if you know that if your bit of code doesn’t make this version but there’s the +0.1 coming out in 6 weeks, then it’s not that bad. It’s like flights from San Francisco to LA, if you miss one you know there’s another one an hour later so it’s not a big deal. Amazon has done a fantastic job of this with the Kindle as well, with a new model every year.</p>
			<!-- /wp:text -->

			<!-- wp:quote -->
			<blockquote><p>Real artists ship.</p><footer><p><a href="http://www.folklore.org/StoryView.py?story=Real_Artists_Ship.txt">Steve Jobs, 1983</a></p></footer></blockquote>
			<!-- /wp:quote -->

			<!-- wp:image -->
			<figure><img src="https://cldup.com/vuGcj2VB8M.jpg" /><figcaption>Beautiful landscape</figcaption></figure>
			<!-- /wp:image -->

			<!-- wp:text -->
			<p>By shipping early and often you have the unique competitive advantage of hearing from real people what they think of your work, which in best case helps you anticipate market direction, and in worst case gives you a few people rooting for you that you can email when your team pivots to a new idea. Nothing can recreate the crucible of real usage.</p>
			<!-- /wp:text -->

			<!-- wp:embed -->
			<iframe width="560" height="315" src="//www.youtube.com/embed/Nl6U7UotA-M" frameborder="0" allowfullscreen></iframe>
			<!-- /wp:embed -->
		</section>
	</div>
	<?php
}

/**
 * Registers a block.
 *
 * @param  string $name Block name including namespace.
 * @param  array  $args Optional. Array of settings for the block. Default
 *                      empty array.
 * @return bool         True on success, false on error.
 */
function register_block( $name, $args = array() ) {
	// Not implemented yet.
}
