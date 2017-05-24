<?php

function gutenberg_block_core_latest_posts( $attributes ) {
	$postsToShow = 5;

	if ( array_key_exists( 'poststoshow', $attributes ) ) {
		$postsToShow = $attributes['poststoshow'];
	}

	$recent_posts = wp_get_recent_posts( array(
		'numberposts' => $postsToShow,
		'post_status' => 'publish'
	) );

	$posts_content = '';

	foreach( $recent_posts as $post ) {
		$post_permalink = get_permalink( $post['ID'] );

		$posts_content .= "<li><a href='{$post_permalink}'>{$post['post_title']}</a></li>\n";
	}

	$block_content = <<<CONTENT
<div class="blocks-latest-posts">
	<ul>
		{$posts_content}
	</ul>
</div>

CONTENT;

	return $block_content;
}

register_block( 'core/latestposts', array(
	'render' => 'gutenberg_block_core_latest_posts'
) );
