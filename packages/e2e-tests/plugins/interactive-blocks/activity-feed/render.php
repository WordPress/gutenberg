<?php
/**
 * HTML for testing `renderHTML()` in a generic activity-feed shape.
 *
 * The feed is a router region whose server content is per-filter post
 * cards. Filter tabs navigate between pages (swapping the whole region via
 * the interactivity router). "Load more" appends older posts fetched as a
 * fragment; "Post" prepends a new card fetched as a fragment.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */
?>

<?php $identity = $attributes['identity'] ?? 'data-wp-key'; ?>

<section data-wp-interactive="test/activity-feed">
	<nav data-testid="filter-tabs">
		<?php foreach ( $attributes['tabs'] ?? array() as $label => $href ) : ?>
			<a
				data-testid="tab-<?php echo esc_attr( $label ); ?>"
				data-wp-on--click="actions.navigate"
				href="<?php echo esc_url( $href ); ?>"
			><?php echo esc_html( $label ); ?></a>
		<?php endforeach; ?>
	</nav>

	<div
		data-testid="feed-region"
		data-wp-interactive="test/activity-feed"
		data-wp-router-region="activity-feed"
	>
		<div data-testid="feed-list">
			<?php foreach ( $attributes['posts'] ?? array() as $post ) : ?>
				<?php echo gutenberg_e2e_activity_feed_card( $post, $identity ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			<?php endforeach; ?>
		</div>
	</div>

	<button
		data-testid="load-more"
		data-wp-on--click="actions.loadMore"
		data-identity="<?php echo esc_attr( $identity ); ?>"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/activity-feed/v1/feed' ) ); ?>"
	>Load more</button>

	<input data-testid="new-post-title" type="text" />
	<button
		data-testid="create-post"
		data-wp-on--click="actions.createPost"
		data-identity="<?php echo esc_attr( $identity ); ?>"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/activity-feed/v1/post' ) ); ?>"
	>Post</button>

	<p
		data-testid="init-total"
		data-wp-text="state.initCount"
	>0</p>
</section>
