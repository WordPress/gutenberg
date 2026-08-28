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
 * declares, so the server and the editor read one description. The Embed block
 * matches on the text of a paragraph rather than on a selector, and the class
 * names its `save` writes come from the provider list in
 * `packages/block-library/src/embed/variations.js`, so what it would need from
 * `block.json` is not a selector but that list.
 *
 * This is therefore a second implementation of one transform, deliberately
 * kept to one file. `test/integration/embed-provider-table.test.js` fails when
 * the table below and the variations drift apart.
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
	 * `patterns` and `attributes` mirror the block variations the editor
	 * matches a URL against, and are checked against them by a unit test.
	 *
	 * `type` has no counterpart there. The editor learns a URL's oEmbed type
	 * from the provider's response once the preview loads, which conversion
	 * cannot wait for, so the type each provider is known to answer with is
	 * recorded here instead. Providers serving more than one kind of media
	 * answer differently per URL and carry no type at all: the editor fills it
	 * in when the post is next opened, the same as it would for a provider it
	 * does not recognise.
	 *
	 * @return array[] Providers keyed by slug.
	 */
	private static function get_providers() {
		return array(
			'twitter'       => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.)?twitter\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'twitter',
					'responsive'       => true,
				),
				'type'       => 'rich',
			),
			'youtube'       => array(
				'patterns'   => array(
					'#^https?:\/\/((m|www)\.)?youtube\.com\/.+#i',
					'#^https?:\/\/youtu\.be\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'youtube',
					'responsive'       => true,
				),
				'type'       => 'video',
			),
			'soundcloud'    => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.)?soundcloud\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'soundcloud',
					'responsive'       => true,
				),
				'type'       => 'rich',
			),
			'spotify'       => array(
				'patterns'   => array(
					'#^https?:\/\/(open|play)\.spotify\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'spotify',
					'responsive'       => true,
				),
				'type'       => 'rich',
			),
			'flickr'        => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.)?flickr\.com\/.+#i',
					'#^https?:\/\/flic\.kr\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'flickr',
					'responsive'       => true,
				),
			),
			'vimeo'         => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.)?vimeo\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'vimeo',
					'responsive'       => true,
				),
				'type'       => 'video',
			),
			'animoto'       => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.)?(animoto|video214)\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'animoto',
					'responsive'       => true,
				),
				'type'       => 'video',
			),
			'cloudup'       => array(
				'patterns'   => array(
					'#^https?:\/\/cloudup\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'cloudup',
					'responsive'       => true,
				),
			),
			'crowdsignal'   => array(
				'patterns'   => array(
					'#^https?:\/\/((.+\.)?polldaddy\.com|poll\.fm|.+\.crowdsignal\.net|.+\.survey\.fm)\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'crowdsignal',
					'responsive'       => true,
				),
				'type'       => 'rich',
			),
			'dailymotion'   => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.)?dailymotion\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'dailymotion',
					'responsive'       => true,
				),
				'type'       => 'video',
			),
			'imgur'         => array(
				'patterns'   => array(
					'#^https?:\/\/(.+\.)?imgur\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'imgur',
					'responsive'       => true,
				),
				'type'       => 'rich',
			),
			'issuu'         => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.)?issuu\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'issuu',
					'responsive'       => true,
				),
				'type'       => 'rich',
			),
			'kickstarter'   => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.)?kickstarter\.com\/.+#i',
					'#^https?:\/\/kck\.st\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'kickstarter',
					'responsive'       => true,
				),
				'type'       => 'rich',
			),
			'mixcloud'      => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.)?mixcloud\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'mixcloud',
					'responsive'       => true,
				),
				'type'       => 'rich',
			),
			'pocket-casts'  => array(
				'patterns'   => array(
					'#^https:\/\/pca.st\/\w+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'pocket-casts',
					'responsive'       => true,
				),
				'type'       => 'rich',
			),
			'reddit'        => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.)?reddit\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'reddit',
					'responsive'       => true,
				),
				'type'       => 'rich',
			),
			'reverbnation'  => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.)?reverbnation\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'reverbnation',
					'responsive'       => true,
				),
				'type'       => 'rich',
			),
			'scribd'        => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.)?scribd\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'scribd',
					'responsive'       => true,
				),
				'type'       => 'rich',
			),
			'smugmug'       => array(
				'patterns'   => array(
					'#^https?:\/\/(.+\.)?smugmug\.com\/.*#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'smugmug',
					'previewable'      => false,
					'responsive'       => true,
				),
			),
			'speaker-deck'  => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.)?speakerdeck\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'speaker-deck',
					'responsive'       => true,
				),
				'type'       => 'rich',
			),
			'tiktok'        => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.)?tiktok\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'tiktok',
					'responsive'       => true,
				),
				'type'       => 'video',
			),
			'ted'           => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.|embed\.)?ted\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'ted',
					'responsive'       => true,
				),
				'type'       => 'video',
			),
			'tumblr'        => array(
				'patterns'   => array(
					'#^https?:\/\/(.+)\.tumblr\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'tumblr',
					'responsive'       => true,
				),
				'type'       => 'rich',
			),
			'videopress'    => array(
				'patterns'   => array(
					'#^https?:\/\/videopress\.com\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'videopress',
					'responsive'       => true,
				),
				'type'       => 'video',
			),
			'wordpress-tv'  => array(
				'patterns'   => array(
					'#^https?:\/\/wordpress\.tv\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'wordpress-tv',
					'responsive'       => true,
				),
				'type'       => 'video',
			),
			'amazon-kindle' => array(
				'patterns'   => array(
					'#^https?:\/\/([a-z0-9-]+\.)?(amazon|amzn)(\.[a-z]{2,4})+\/.+#i',
					'#^https?:\/\/(www\.)?(a\.co|z\.cn)\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'amazon-kindle',
				),
				'type'       => 'rich',
			),
			'pinterest'     => array(
				'patterns'   => array(
					'#^https?:\/\/([a-z]{2}|www)\.pinterest\.com(\.(au|mx))?\/.*#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'pinterest',
				),
				'type'       => 'rich',
			),
			'wolfram-cloud' => array(
				'patterns'   => array(
					'#^https?:\/\/(www\.)?wolframcloud\.com\/obj\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'wolfram-cloud',
					'responsive'       => true,
				),
				'type'       => 'rich',
			),
			'bluesky'       => array(
				'patterns'   => array(
					'#^https?:\/\/bsky\.app\/profile\/.+\/post\/.+#i',
				),
				'attributes' => array(
					'providerNameSlug' => 'bluesky',
				),
				'type'       => 'rich',
			),
		);
	}

	/**
	 * Turns an element holding nothing but a URL into an Embed block, or null.
	 *
	 * @param Gutenberg_HTML_Element $element Element to convert.
	 * @return array|null Parsed block array, or null when the element is not a standalone URL.
	 */
	public static function convert( $element ) {
		if ( ! self::is_available() || 'p' !== $element->tag_name ) {
			return null;
		}

		$url = self::read_url( $element );

		if ( null === $url ) {
			return null;
		}

		return self::create_block( $url, $element->get_attribute( 'class' ) );
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
		// The authority the editor reads, which holds the port and any
		// credentials, so only a bare `x.com` address is rewritten.
		if ( ! preg_match( '/^[^\/\s:]+:(?:\/\/)?\/?([^\/\s#?]+)[\/#?]{0,1}\S*$/', $url, $matches ) || 'x.com' !== $matches[1] ) {
			return $url;
		}

		$parts = wp_parse_url( $url );

		if ( ! is_array( $parts ) ) {
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
	 * @return array Parsed block array.
	 */
	private static function create_block( $url, $class_name ) {
		$provider = self::find_provider( $url );
		$values   = array( 'url' => $url );

		if ( isset( $provider['type'] ) ) {
			$values['type'] = $provider['type'];
		}

		if ( null !== $provider ) {
			$values = array_merge( $values, $provider['attributes'] );
		}

		$attributes = self::prepare_attributes( $values );

		if ( null !== $class_name && '' !== $class_name ) {
			// Added by block supports, after the attributes the block declares.
			$attributes['className'] = $class_name;
		}

		$markup = sprintf(
			'<figure class="%s"><div class="wp-block-embed__wrapper">%s</div></figure>',
			esc_attr( implode( ' ', self::prepare_class_names( $attributes ) ) ),
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
		$classes = array( 'wp-block-embed' );

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
