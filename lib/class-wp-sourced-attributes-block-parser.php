<?php
/**
 * Block Serialization Parser
 *
 * @package Gutenberg
 */

/**
 * Class WP_Sourced_Attributes_Block_Parser
 *
 * Parses a document and constructs a list of parsed block objects
 *
 * @since 6.9.0
 */
class WP_Sourced_Attributes_Block_Parser extends WP_Block_Parser {

	/**
	 * Parses a document and returns a list of block structures
	 *
	 * When encountering an invalid parse will return a best-effort
	 * parse. In contrast to the specification parser this does not
	 * return an error on invalid inputs.
	 *
	 * @since 6.9.0
	 *
	 * @param string                 $document Input document being parsed.
	 * @param WP_Block_Type_Registry $registry Block type registry from which
	 *                                         block attributes schema can be
	 *                                         retrieved.
	 * @param int|null               $post_id  Optional post ID.
	 * @return WP_Block_Parser_Block[]
	 */
	function parse( $document, $registry = null, $post_id = null ) {
		if ( is_null( $registry ) ) {
			$registry = WP_Block_Type_Registry::get_instance();
		}

		$blocks = parent::parse( $document );

		foreach ( $blocks as $i => $block ) {
			$block_type = $registry->get_registered( $block['blockName'] );
			if ( is_null( $block_type ) || ! isset( $block_type->attributes ) ) {
				continue;
			}

			$sourced_attributes = $this->get_sourced_attributes(
				$block,
				$block_type->attributes,
				$post_id
			);

			$blocks[ $i ]['attrs'] = array_merge( $block['attrs'], $sourced_attributes );
		}

		return $blocks;
	}

	/**
	 * Returns an array of sourced attribute values for a block.
	 *
	 * @param WP_Block_Parser_Block $block             Parsed block object.
	 * @param array                 $attributes_schema Attributes of registered
	 *                                                 block type for block.
	 * @param int|null              $post_id           Optional post ID.
	 * @return array                                   Sourced attribute values.
	 */
	function get_sourced_attributes( $block, $attributes_schema, $post_id ) {
		$attributes = array();

		foreach ( $attributes_schema as $key => $attribute_schema ) {
			if ( isset( $attribute_schema['source'] ) ) {
				$attributes[ $key ] = $this->get_sourced_attribute(
					$block,
					$attribute_schema,
					$post_id
				);
			}
		}

		return $attributes;
	}

	/**
	 * Returns a sourced attribute value for a block, for attribute type which
	 * sources from HTML.
	 *
	 * @param WP_Block_Parser_Block $block            Parsed block object.
	 * @param array                 $attribute_schema Attribute schema for
	 *                                                individual attribute to
	 *                                                be parsed.
	 * @return mixed                                  Sourced attribute value.
	 */
	function get_html_sourced_attribute( $block, $attribute_schema ) {
		$document = new DOMDocument();
		try {
			$document->loadHTML( '<html><body>' . $block['innerHTML'] . '</body></html>' );
		} catch ( Exception $e ) {
			return null;
		}

		$selector = 'body';
		if ( isset( $attribute_schema['selector'] ) ) {
			$selector .= ' ' . $attribute_schema['selector'];
		}

		$xpath_selector = _wp_css_selector_to_xpath( $selector );
		$xpath          = new DOMXpath( $document );
		$match          = $xpath->evaluate( $xpath_selector );

		if ( 0 === $match->count() ) {
			return null;
		}

		$element = $match->item( 0 );

		switch ( $attribute_schema['source'] ) {
			case 'text':
				/*
				 * See: https://github.com/WordPress/WordPress-Coding-Standards/issues/574
				 */
				// phpcs:ignore
				return $element->textContent;

			case 'html':
				$inner_html = '';

				/*
				 * See: https://github.com/WordPress/WordPress-Coding-Standards/issues/574
				 */
				// phpcs:ignore
				foreach ( $element->childNodes as $child ) {
					/*
					 * See: https://github.com/WordPress/WordPress-Coding-Standards/issues/574
					 */
					// phpcs:ignore
					$inner_html .= $child->ownerDocument->saveXML( $child );
				}

				return $inner_html;

			case 'attribute':
				if ( ! isset( $attribute_schema['attribute'] ) ||
						is_null( $element->attributes ) ) {
					return null;
				}

				$attribute = $element->attributes->getNamedItem( $attribute_schema['attribute'] );

				/*
				 * See: https://github.com/WordPress/WordPress-Coding-Standards/issues/574
				 */
				// phpcs:ignore
				return is_null( $attribute ) ? null : $attribute->nodeValue;
		}

		return null;
	}

	/**
	 * Returns a sourced attribute value for a block.
	 *
	 * @param WP_Block_Parser_Block $block            Parsed block object.
	 * @param array                 $attribute_schema Attribute schema for
	 *                                                individual attribute to
	 *                                                be parsed.
	 * @param int|null              $post_id          Optional post ID.
	 * @return mixed                                  Sourced attribute value.
	 */
	function get_sourced_attribute( $block, $attribute_schema, $post_id ) {
		switch ( $attribute_schema['source'] ) {
			case 'text':
			case 'html':
			case 'attribute':
				return $this->get_html_sourced_attribute( $block, $attribute_schema );

			case 'query':
				// TODO: Implement.
				return null;

			case 'property':
			case 'node':
			case 'children':
			case 'tag':
				// Unsupported or deprecated.
				return null;

			case 'meta':
				if ( ! is_null( $post_id ) && isset( $attribute_schema['meta'] ) ) {
					return get_post_meta( $post_id, $attribute_schema['meta'] );
				}

				return null;
		}

		return null;
	}

}
