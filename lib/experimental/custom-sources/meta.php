<?php
/**
 * Meta Custom Source
 *
 * @package gutenberg
 */

return array(
	'name'         => 'meta',
	'apply_source' => function ( $block_content, $block_instance, $meta_field, $attribute_config ) {
		// We should probably also check if the meta field exists but for now it's okay because
		// if it doesn't, `get_post_meta()` will just return an empty string.
		$meta_value = get_post_meta( $block_instance->context['postId'], $meta_field, true );

		// If the source is "html", it means that we should replace the whole tag with the meta value.
		if ( 'html' === $attribute_config['source'] ) {
			$tags = new WP_HTML_Tag_Processor( $block_content );

			$block_selector_tag = $tags->next_tag(
				array(
					// TODO: In the future, when blocks other than Paragraph and Image are
					// supported, we should build the full query from CSS selector.
					'tag_name' => $attribute_config['selector'],
				)
			);
			if ( ! $block_selector_tag ) {
				return $block_content;
			}

			$tag_name = $tags->get_tag();
			$markup       = "<$tag_name>$meta_value</$tag_name>";
			$updated_tags = new WP_HTML_Tag_Processor( $markup );
			$updated_tags->next_tag();
			$names = $tags->get_attribute_names_with_prefix( '' );
			foreach ( $names as $name ) {
				$updated_tags->set_attribute( $name, $tags->get_attribute( $name ) );
			}

			return $updated_tags->get_updated_html();
		} elseif ( 'attribute' === $attribute_config['source'] ) {
			$tags = new WP_HTML_Tag_Processor( $block_instance->inner_html );
			$block_selector_tag = $tags->next_tag(
				array(
					'tag_name' => $attribute_config['selector'],
				)
			);
			if ( ! $block_selector_tag ) {
				return $block_content;
			}
			$tags->set_attribute( $attribute_config['attribute'], $meta_value );
			return $tags->get_updated_html();
		} else {
			// We don't support other sources yet.
			return $block_content;
		}
	},
);
