<?php
/**
 * Server-side conversion of standalone URLs into embed blocks.
 *
 * @package gutenberg
 */

/**
 * Turns a paragraph holding nothing but a URL into an Embed block.
 *
 * Every other block here is converted by the `raw` transform its `block.json`
 * declares. The Embed block matches on the text of a paragraph rather than on
 * a selector, so what it declares instead is its provider list: each block
 * variation carries the URL `patterns` that attribute an address to it, and
 * both this conversion and the editor's `findMoreSuitableBlock()` read the
 * same declaration. A provider registered from PHP — a variation added
 * through the `get_block_type_variations` filter — is matched here the same
 * as a declared one.
 *
 * What cannot be declared is how a URL is read: that a paragraph holds one
 * address and nothing else, the file extensions that disqualify it, and the
 * `x.com` rewrite. Those stay here, matching the transform the block
 * registers in JavaScript.
 *
 * @access private
 */
class Gutenberg_Embed_Transforms {
	/**
	 * Block a standalone URL becomes.
	 *
	 * @var string
	 */
	const BLOCK_NAME = 'core/embed';

	/**
	 * Returns the embed providers, in the order the editor tries them.
	 *
	 * Each provider is a block variation declaring URL `patterns` — regular
	 * expression sources without delimiters, matched case-insensitively, the
	 * same way `matchesPatterns()` compiles them in the editor — and the
	 * `attributes` the matched block stores.
	 *
	 * Among those attributes may be the oEmbed `type` the provider is known
	 * to answer with. The editor confirms it from the provider's response
	 * once the preview loads, which conversion cannot wait for. Providers
	 * serving more than one kind of media answer differently per URL and
	 * declare none: the editor fills the type in when the post is next
	 * opened, the same as it would for a provider it does not recognise.
	 *
	 * @return array[] Providers keyed by variation name.
	 */
	private static function get_providers() {
		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( self::BLOCK_NAME );
		$providers  = array();

		if ( ! $block_type instanceof WP_Block_Type || ! is_array( $block_type->variations ) ) {
			return $providers;
		}

		foreach ( $block_type->variations as $variation ) {
			if (
				! is_array( $variation )
				|| ! isset( $variation['name'] ) || ! is_string( $variation['name'] )
				|| empty( $variation['patterns'] ) || ! is_array( $variation['patterns'] )
			) {
				continue;
			}

			$patterns = array();

			foreach ( $variation['patterns'] as $pattern ) {
				$compiled = self::compile_pattern( $pattern );

				if ( null !== $compiled ) {
					$patterns[] = $compiled;
				}
			}

			if ( array() === $patterns ) {
				continue;
			}

			$providers[ $variation['name'] ] = array(
				'patterns'   => $patterns,
				'attributes' => isset( $variation['attributes'] ) && is_array( $variation['attributes'] ) ? $variation['attributes'] : array(),
			);
		}

		return $providers;
	}

	/**
	 * Compiles a declared URL pattern, or refuses it.
	 *
	 * A pattern that does not compile matches nothing rather than taking the
	 * conversion down, and is warned about once, the way an unsupported
	 * selector is.
	 *
	 * @param mixed $pattern Declared pattern.
	 * @return string|null Compiled pattern, or null when it cannot be used.
	 */
	private static function compile_pattern( $pattern ) {
		static $checked = array();

		if ( ! is_string( $pattern ) || '' === $pattern ) {
			return null;
		}

		$compiled = '#' . str_replace( '#', '\\#', $pattern ) . '#i';

		if ( ! array_key_exists( $pattern, $checked ) ) {
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- An invalid pattern raises a warning as well as returning false; the warning is replaced with `_doing_it_wrong()` below.
			$checked[ $pattern ] = false !== @preg_match( $compiled, '' );

			if ( ! $checked[ $pattern ] ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: %s: URL pattern, for example "^https?://example\\.com/.+". */
						__( 'The "%s" pattern is not a valid regular expression, so it matches nothing.', 'gutenberg' ),
						$pattern
					),
					'23.9.0'
				);
			}
		}

		return $checked[ $pattern ] ? $compiled : null;
	}

	/**
	 * Turns an element holding nothing but a URL into an Embed block, or null.
	 *
	 * @param Gutenberg_HTML_Element $element Element to convert.
	 * @return array|null Parsed block array, or null when the element is not a standalone URL.
	 */
	public static function convert( $element ) {
		if ( 'p' !== $element->tag_name || ! self::is_available() ) {
			return null;
		}

		$url = self::read_url( $element );

		if ( null === $url ) {
			return null;
		}

		/*
		 * Read the way `get_block_supports_attributes()` reads them for every
		 * other block: `get_attribute()` answers `true` for a valueless
		 * attribute, which is no class at all, not a class named "1".
		 */
		$class_names = $element->get_class_names();
		$anchor      = $element->get_attribute( 'id' );

		return self::create_block(
			$url,
			array() === $class_names ? null : implode( ' ', $class_names ),
			is_string( $anchor ) && '' !== $anchor ? $anchor : null
		);
	}

	/**
	 * Determines whether the Embed block is registered.
	 *
	 * @return bool Whether the block is available.
	 */
	private static function is_available() {
		return WP_Block_Type_Registry::get_instance()->get_registered( self::BLOCK_NAME ) instanceof WP_Block_Type;
	}

	/**
	 * Reads the URL an element stands for, or null.
	 *
	 * @param Gutenberg_HTML_Element $element Element to read.
	 * @return string|null URL, or null when the element holds anything else.
	 */
	private static function read_url( $element ) {
		// The text of the element rather than its markup, so a URL someone
		// linked or emphasised reads the same as a bare one.
		$url = self::trim( $element->get_text_content() );

		if ( ! preg_match( '#^https://#i', $url ) ) {
			return null;
		}

		// Text mentioning a second address is prose about a link rather than
		// a link standing on its own.
		if ( 1 !== preg_match_all( '#https://#i', $url ) ) {
			return null;
		}

		$parts = wp_parse_url( $url );

		if ( ! is_array( $parts ) || empty( $parts['host'] ) || preg_match( '/[\pZ\s]/u', $url ) ) {
			return null;
		}

		// An address ending in a file name is a file to link to rather than
		// something a provider can embed, unless the extension is one that
		// permalinks are built from.
		$path     = isset( $parts['path'] ) ? $parts['path'] : '';
		$segments = explode( '/', $path );

		if ( preg_match( '/\.(?!(html?|php)$)[a-z0-9]+$/iD', end( $segments ) ) ) {
			return null;
		}

		return self::rewrite_x_to_twitter( $url );
	}

	/**
	 * Removes the whitespace at both ends of a string.
	 *
	 * `trim()` leaves the non-breaking spaces and byte order marks that
	 * JavaScript's `String.prototype.trim` removes, which decide whether a
	 * paragraph reads as holding nothing but a URL.
	 *
	 * @param string $text Text to trim.
	 * @return string Trimmed text.
	 */
	private static function trim( $text ) {
		return (string) preg_replace( '/^[\pZ\s\x{feff}]+|[\pZ\s\x{feff}]+$/u', '', $text );
	}

	/**
	 * Rewrites an `x.com` address to `twitter.com`.
	 *
	 * The editor does the same while the WordPress oEmbed registry has no X
	 * provider.
	 *
	 * @see https://core.trac.wordpress.org/ticket/59142
	 *
	 * @param string $url URL to rewrite.
	 * @return string Rewritten URL.
	 */
	private static function rewrite_x_to_twitter( $url ) {
		$parts = wp_parse_url( $url );

		/*
		 * Only a bare `x.com` authority is rewritten: a port or credentials
		 * mean the address is not the one the editor rewrites, and the
		 * editor's comparison is exact, so the host's case is too.
		 */
		if (
			! is_array( $parts )
			|| ! isset( $parts['host'] )
			|| 'x.com' !== $parts['host']
			|| isset( $parts['port'] )
			|| isset( $parts['user'] )
			|| isset( $parts['pass'] )
		) {
			return $url;
		}

		// An address with no path of its own gains one, the way the URL
		// parser the editor rebuilds it with writes it back out.
		$rewritten  = ( isset( $parts['scheme'] ) ? $parts['scheme'] : 'https' ) . '://twitter.com';
		$rewritten .= isset( $parts['path'] ) && '' !== $parts['path'] ? $parts['path'] : '/';

		if ( isset( $parts['query'] ) ) {
			$rewritten .= '?' . $parts['query'];
		}

		if ( isset( $parts['fragment'] ) ) {
			$rewritten .= '#' . $parts['fragment'];
		}

		return $rewritten;
	}

	/**
	 * Returns the provider serving a URL, or null.
	 *
	 * @param string $url URL to match.
	 * @return array|null Provider, carrying its slug, or null when none matches.
	 */
	private static function find_provider( $url ) {
		foreach ( self::get_providers() as $slug => $provider ) {
			foreach ( $provider['patterns'] as $pattern ) {
				if ( preg_match( $pattern, $url ) ) {
					$provider['slug'] = $slug;

					return $provider;
				}
			}
		}

		return null;
	}

	/**
	 * Builds the Embed block a URL becomes.
	 *
	 * @param string      $url        URL to embed.
	 * @param string|null $class_name Class the source element carried.
	 * @param string|null $anchor     Id the source element carried.
	 * @return array Parsed block array.
	 */
	private static function create_block( $url, $class_name, $anchor = null ) {
		$provider = self::find_provider( $url );
		$values   = array( 'url' => $url );

		if ( null !== $provider ) {
			$values = array_merge( $values, $provider['attributes'] );
		}

		$attributes = self::prepare_attributes( $values );

		if ( null !== $class_name && '' !== $class_name ) {
			// Added by block supports, after the attributes the block declares.
			$attributes['className'] = $class_name;
		}

		// The block declares `anchor` support, so the source's `id` survives
		// the same way it does for every other converted block.
		if ( null !== $anchor ) {
			$attributes['anchor'] = $anchor;
		}

		$markup = sprintf(
			'<figure class="%s"%s><div class="wp-block-embed__wrapper">%s</div></figure>',
			esc_attr( implode( ' ', self::prepare_class_names( $attributes ) ) ),
			null === $anchor ? '' : ' id="' . esc_attr( $anchor ) . '"',
			"\n" . self::escape_text( $url ) . "\n"
		);

		return array(
			'blockName'    => self::BLOCK_NAME,
			'attrs'        => $attributes,
			'innerBlocks'  => array(),
			'innerHTML'    => $markup,
			'innerContent' => array( $markup ),
		);
	}

	/**
	 * Keeps the attribute values worth writing into the block delimiter.
	 *
	 * The block decides which those are and what order they are written in, so
	 * a value it reads out of the markup, or one it would have assumed anyway,
	 * is left out.
	 *
	 * @param array $values Attribute values.
	 * @return array Attribute values, in the order the block declares them.
	 */
	private static function prepare_attributes( $values ) {
		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( self::BLOCK_NAME );
		$attributes = array();

		foreach ( (array) $block_type->attributes as $name => $definition ) {
			if ( ! array_key_exists( $name, $values ) || isset( $definition['source'] ) ) {
				continue;
			}

			if ( array_key_exists( 'default', $definition ) && $definition['default'] === $values[ $name ] ) {
				continue;
			}

			$attributes[ $name ] = $values[ $name ];
		}

		return $attributes;
	}

	/**
	 * Escapes a string for a text node, the way the block's `save` does.
	 *
	 * The URL is written into the markup as text, so an address carrying an
	 * `&` has to be encoded or the block will not match what `save` produces.
	 * These are the characters, and the forms, React escapes text with.
	 *
	 * @param string $text Text to escape.
	 * @return string Escaped text.
	 */
	private static function escape_text( $text ) {
		return strtr(
			$text,
			array(
				'&' => '&amp;',
				'<' => '&lt;',
				'>' => '&gt;',
				'"' => '&quot;',
				"'" => '&#x27;',
			)
		);
	}

	/**
	 * Builds the class names the Embed block saves for a set of attributes.
	 *
	 * @param array $attributes Attribute values.
	 * @return string[] Class names.
	 */
	private static function prepare_class_names( $attributes ) {
		$default = wp_get_block_default_classname( self::BLOCK_NAME );
		$classes = is_string( $default ) && '' !== $default ? array( $default ) : array();

		if ( isset( $attributes['type'] ) ) {
			$classes[] = 'is-type-' . $attributes['type'];
		}

		if ( isset( $attributes['providerNameSlug'] ) ) {
			$classes[] = 'is-provider-' . $attributes['providerNameSlug'];
			$classes[] = 'wp-block-embed-' . $attributes['providerNameSlug'];
		}

		if ( isset( $attributes['className'] ) ) {
			$classes[] = $attributes['className'];
		}

		return $classes;
	}
}
