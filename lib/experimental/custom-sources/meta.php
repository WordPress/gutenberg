<?php
/**
 * Meta Custom Source
 *
 * @package gutenberg
 */

return array(
	'name'         => 'meta',
	'apply_source' => function ( $block_content, $block_instance, $meta_field, $attribute_config ) {
		$meta_value = get_post_meta( $block_instance->context['postId'], $meta_field, true );
		$p          = new WP_HTML_Tag_Processor( $block_content );
		$found      = $p->next_tag(
			array(
				// TODO: build the query from CSS selector.
				'tag_name' => $attribute_config['selector'],
			)
		);
		if ( ! $found ) {
			return $block_content;
		}
		$tag_name = $p->get_tag();
		$markup   = "<$tag_name>$meta_value</$tag_name>";
		$p2       = new WP_HTML_Tag_Processor( $markup );
		$p2->next_tag();
		$names = $p->get_attribute_names_with_prefix( '' );
		foreach ( $names as $name ) {
			$p2->set_attribute( $name, $p->get_attribute( $name ) );
		}

		return $p2 . '';
	},
);
