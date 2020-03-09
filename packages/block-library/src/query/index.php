<?php

/**
 * Server-side rendering of the `core/query` block.
 *
 * @package WordPress
 */
class Blocks_Query {
	/**
	 * @var array
	 */
	public static $displayedPostIds = array();
}

/**
 * Registers the `core/query` block on server.
*/
function register_block_core_query() {
	$path = __DIR__ . '/query/block.json';
	$metadata = json_decode( file_get_contents( $path), true);
	register_block_type(
		$metadata['name'],
		array_merge(
			$metadata,
			array(
				'render_callback' => 'render_block_core_query',
			)
		)
	);
}

/**
 * Convert criteria object into args ready for use in WP_Query
 *
 * @param array $criteria A criteria object.
 *
 * @return array Return an array of args.
 */
function core_query_attributes_to_critera( $criteria ) {
	if ( $criteria[ 'specificMode' ] == 1 ) {
		$args = array(
			'post_status' => 'publish',
			'p' => $criteria[ 'singleId' ],
		);
		return $args;
	}

	$args = array(
		'posts_per_page'      => ! empty( $criteria['per_page'] ) ? intval( $criteria['per_page'] ) : 3,
		'post_status'         => 'publish',
		'suppress_filters'    => false,
		'ignore_sticky_posts' => true,
	);

	if ( ! empty( $criteria['author'] ) ) {
		$args['author'] = implode( ",", $criteria['author'] );
	}
	if ( ! empty( $criteria['categories'] ) ) {
		$args['cat'] = implode( ",", $criteria['categories'] );
	}
	if ( ! empty( $criteria['tags'] ) ) {
		$args['tag_in'] = intval( $criteria['tags'] );
	}
	if ( ! empty( $criteria['search'] ) ) {
		$args['s'] = sanitize_text_field( $criteria['search'] );
	}
	return $args;
}

function render_block_core_query( $attributes ) {
	$blocks = ! empty( $attributes['blocks'] ) ? $attributes['blocks'] : array();
	$args = core_query_attributes_to_critera( $attributes['criteria'] );
	$args['posts_per_page'] = $args['posts_per_page'] + count( Blocks_Query::$displayedPostIds );

	$query = new WP_Query( $args );

	ob_start();
	?>
	<div class="<?php echo esc_attr( $attributes['className']); ?>">
		<?php if ( $query->have_posts() ) : ?>
			<?php while ( $query->have_posts() ) : ?>
				<?php
					$query->the_post();
					$id = get_the_ID();
					if ( in_array( $id, Blocks_Query::$displayedPostIds ) ) {
						continue;
					} else {
						array_push( Blocks_Query::$displayedPostIds, $id );
					}
				?>
				<div class="entry-wrapper">
				<?php
				foreach ( $blocks as $block ) {
					$block_data = array(
						'blockName'    => $block['name'],
						'attrs'        => $block['attributes'],
						'innerContent' => array(),
					);

					$allowed_html         = wp_kses_allowed_html( 'post' );
					$allowed_html['time'] = array(
						'class'    => true,
						'datetime' => true,
					);

					echo wp_kses( render_block( $block_data ), $allowed_html );
				}
				?>
				</div>
				<?php endwhile; ?>
			<?php endif; ?>
	</div>
	<?php
	return ob_get_clean();
}

add_action( 'init', 'register_block_core_query' );
