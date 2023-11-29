<?php
/**
 * Define the mechanism to replpace the HTML depending on the block attributes.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'block_bindings_replace_html' ) ) {
	/**
	 * Depending on the block attributes, replace the proper HTML based on the value returned by the source.
	 *
	 * @param string $block_content Block Content.
	 * @param string $block_name The name of the block to process.
	 * @param string $block_attr The attribute of the block we want to process.
	 * @param string $source_value The value used to replace the HTML.
	 */
	function block_bindings_replace_html( $block_content, $block_name, $block_attr, $source_value ) {
		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );
		if ( null === $block_type ) {
			return;
		}

		// Depending on the attribute source, the processing will be different.
		switch ( $block_type->attributes[ $block_attr ]['source'] ) {
			case 'html':
				$p = new WP_HTML_Tag_Processor( $block_content );
				if ( ! $p->next_tag(
					array(
						// TODO: build the query from CSS selector.
						'tag_name' => $block_type->attributes[ $block_attr ]['selector'],
					)
				) ) {
					return $block_content;
				}
				// TODO: We should use a `set_inner_html` method once available.
				$tag_name = $p->get_tag();
				$markup   = "<$tag_name>" . esc_html( $source_value ) . "</$tag_name>";
				$p2       = new WP_HTML_Tag_Processor( $markup );
				$p2->next_tag();
				$names = $p->get_attribute_names_with_prefix( '' );
				foreach ( $names as $name ) {
					$p2->set_attribute( $name, $p->get_attribute( $name ) );
				}
				return $p2->get_updated_html();
				break;

			case 'attribute':
				$p = new WP_HTML_Tag_Processor( $block_content );
				if ( ! $p->next_tag(
					array(
						// TODO: build the query from CSS selector.
						'tag_name' => $block_type->attributes[ $block_attr ]['selector'],
					)
				) ) {
					return $block_content;
				}
				$p->set_attribute( $block_type->attributes[ $block_attr ]['attribute'], esc_attr( $source_value ) );
				return $p->get_updated_html();
				break;

			default:
				return $block_content;
				break;
		}
		return;
	}
}
