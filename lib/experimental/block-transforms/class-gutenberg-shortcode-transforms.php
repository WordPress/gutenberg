<?php
/**
 * Server-side conversion of shortcodes into blocks.
 *
 * @package gutenberg
 */

/**
 * Turns the shortcodes in a run of markup into blocks.
 *
 * The PHP counterpart of `segmentHTMLToShortcodeBlock()` in
 * `@wordpress/blocks`, reading the same `shortcode` transforms out of
 * `WP_Block_Type::$transforms` that the editor reads from block settings.
 *
 * @access private
 */
class Gutenberg_Shortcode_Transforms {
	/**
	 * Markup a shortcode has to follow to stand on its own line.
	 *
	 * @var string
	 */
	const BEFORE_LINE = '/(\n|<p>|<br\s*\/?>)\s*$/';

	/**
	 * Markup a shortcode has to precede to stand on its own line.
	 *
	 * @var string
	 */
	const AFTER_LINE = '#^\s*(\n|</p>|<br\s*/?>)#';

	/**
	 * Splits markup into the runs between its shortcodes and the blocks they become.
	 *
	 * @param string  $html                  Markup to split.
	 * @param int     $offset                Where to start looking for a shortcode.
	 * @param array   $excluded_block_names  Blocks whose transform already declined this markup.
	 * @return array Markup strings and parsed block arrays, in document order.
	 */
	public static function segment( $html, $offset = 0, $excluded_block_names = array() ) {
		$transform = self::find_transform( $html, $excluded_block_names );

		if ( null === $transform ) {
			return array( $html );
		}

		$shortcode = self::next( $transform['tag'], $html, $offset );

		if ( null === $shortcode ) {
			return array( $html );
		}

		$last_index = $shortcode['index'] + strlen( $shortcode['text'] );
		$before     = substr( $html, 0, $shortcode['index'] );
		$after      = substr( $html, $last_index );

		/*
		 * A shortcode reading as part of a sentence stays in the sentence.
		 * Only one holding markup of its own, or standing on its own line,
		 * becomes a block.
		 */
		$holds_markup = isset( $shortcode['content'] ) && false !== strpos( $shortcode['content'], '<' );

		if ( ! $holds_markup && ! ( preg_match( self::BEFORE_LINE, $before ) && preg_match( self::AFTER_LINE, $after ) ) ) {
			return self::segment( $html, $last_index );
		}

		/*
		 * A PHP-registered transform may attach an `isMatch` callable, which
		 * the editor calls with the shortcode's parsed attributes; a refusal
		 * leaves the shortcode to the next transform that wants it.
		 */
		if (
			isset( $transform['isMatch'] )
			&& Gutenberg_Block_Transforms::is_runnable_callback( $transform['isMatch'] )
			&& ! call_user_func( $transform['isMatch'], $shortcode['attrs'] )
		) {
			$excluded_block_names[] = $transform['blockName'];

			return self::segment( $html, $offset, $excluded_block_names );
		}

		$block = self::create_block( $transform, $shortcode );

		if ( null === $block ) {
			/*
			 * The block is not registered, or rebuilds its own markup, so the
			 * shortcode is left for the next transform that wants it.
			 */
			$excluded_block_names[] = $transform['blockName'];

			return self::segment( $html, $offset, $excluded_block_names );
		}

		return array_merge(
			self::segment( preg_replace( self::BEFORE_LINE, '', $before ) ),
			array( $block ),
			self::segment( preg_replace( self::AFTER_LINE, '', $after ) )
		);
	}

	/**
	 * Returns the first shortcode transform matching the markup, or null.
	 *
	 * @param string   $html                 Markup to match against.
	 * @param string[] $excluded_block_names Blocks to skip.
	 * @return array|null Matching transform, or null.
	 */
	private static function find_transform( $html, $excluded_block_names ) {
		foreach ( self::get_transforms() as $transform ) {
			if ( in_array( $transform['blockName'], $excluded_block_names, true ) ) {
				continue;
			}

			if ( isset( $transform['serverConversion'] ) && false === $transform['serverConversion'] ) {
				continue;
			}

			/*
			 * A transform may declare one tag or a list of aliases. The first
			 * alias whose pattern matches is the one the shortcode is read
			 * with, the same as `segmentHTMLToShortcodeBlock()` in
			 * `@wordpress/blocks`.
			 */
			foreach ( (array) $transform['tag'] as $tag ) {
				$pattern = self::regexp( $tag );

				if ( null !== $pattern && preg_match( $pattern, $html ) ) {
					$transform['tag'] = $tag;

					return $transform;
				}
			}
		}

		return null;
	}

	/**
	 * Returns every registered shortcode transform, ordered by priority.
	 *
	 * @return array[] Shortcode transforms, each carrying the `blockName` it belongs to.
	 */
	private static function get_transforms() {
		return array_values(
			array_filter(
				Gutenberg_Block_Transforms::get_declared_transforms( 'shortcode' ),
				static function ( $transform ) {
					return isset( $transform['tag'] );
				}
			)
		);
	}

	/**
	 * Builds the block a matched shortcode becomes, or null.
	 *
	 * @param array $transform Matching transform.
	 * @param array $shortcode Matched shortcode.
	 * @return array|null Parsed block array, or null when the block is not registered.
	 */
	private static function create_block( $transform, $shortcode ) {
		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $transform['blockName'] );

		if ( ! $block_type instanceof WP_Block_Type ) {
			return null;
		}

		$attributes  = array();
		$definitions = isset( $transform['attributes'] ) && is_array( $transform['attributes'] ) ? $transform['attributes'] : array();

		foreach ( $definitions as $name => $definition ) {
			if ( ! is_array( $definition ) || ! isset( $definition['source'] ) ) {
				continue;
			}

			$value = self::read_attribute( $definition, $shortcode );

			/*
			 * The editor validates a sourced shortcode value against the
			 * declared `type` and `enum` and falls back to the declared
			 * default, so the server has to as well or the two runtimes
			 * store different attribute values.
			 */
			$value = Gutenberg_Block_Attributes_Parser::validate( $value, $definition );

			if ( null === $value && isset( $definition['default'] ) ) {
				$value = $definition['default'];
			}

			if ( null !== $value ) {
				$attributes[ $name ] = $value;
			}
		}

		$markup = self::raw_markup( $block_type, $attributes );

		/*
		 * A block rebuilding its markup from attributes cannot be produced
		 * without its `save`, the same as a raw transform whose block rewrites
		 * the source. Declining leaves the shortcode to the next transform
		 * that wants it, which is the Shortcode block.
		 */
		if ( null === $markup ) {
			return null;
		}

		return array(
			'blockName'    => $block_type->name,
			'attrs'        => Gutenberg_Block_Transforms::remove_implied_attributes( $block_type, $attributes ),
			'innerBlocks'  => array(),
			'innerHTML'    => $markup,
			'innerContent' => array( $markup ),
		);
	}

	/**
	 * Reads one attribute value out of a matched shortcode.
	 *
	 * @param array $definition Attribute definition.
	 * @param array $shortcode      Matched shortcode.
	 * @return mixed Attribute value, or null when the shortcode does not carry it.
	 */
	private static function read_attribute( $definition, $shortcode ) {
		if ( 'shortcodeText' === $definition['source'] ) {
			/*
			 * The matched text as the editor stores it: classic content
			 * arrives wrapped in the paragraphs `wpautop()` added, which the
			 * block saves back verbatim. `createShortcodeAttributes()` in
			 * `@wordpress/blocks` reads the same source as
			 * `removep( autop( text ) )`, so the round trip here has to match
			 * or the two runtimes store different post content.
			 */
			return self::remove_paragraphs( wpautop( $shortcode['text'] ) );
		}

		if ( 'shortcodeAttribute' !== $definition['source'] || ! isset( $definition['attribute'] ) ) {
			return null;
		}

		// A list names the attributes a shortcode may carry the value under,
		// in the order they win.
		foreach ( (array) $definition['attribute'] as $attribute ) {
			if ( isset( $shortcode['attrs']['named'][ $attribute ] ) ) {
				return $shortcode['attrs']['named'][ $attribute ];
			}
		}

		return null;
	}

	/**
	 * Replaces `<p>` tags with two line breaks — the opposite of `wpautop()`.
	 *
	 * A line-for-line port of `removep()` in `@wordpress/autop`, so that a
	 * `shortcodeText` attribute reads the same on the server as in the editor.
	 *
	 * @param string $html Markup to strip paragraph tags from.
	 * @return string The content with stripped paragraph tags.
	 */
	private static function remove_paragraphs( $html ) {
		$blocklist           = 'blockquote|ul|ol|li|dl|dt|dd|table|thead|tbody|tfoot|tr|th|td|h[1-6]|fieldset|figure';
		$blocklist1          = $blocklist . '|div|p';
		$blocklist2          = $blocklist . '|pre';
		$preserve            = array();
		$preserve_linebreaks = false;
		$preserve_br         = false;

		if ( ! is_string( $html ) || '' === $html ) {
			return '';
		}

		// Protect script and style tags.
		if ( false !== strpos( $html, '<script' ) || false !== strpos( $html, '<style' ) ) {
			$html = preg_replace_callback(
				'/<(script|style)[^>]*>[\s\S]*?<\/\1>/',
				static function ( $matches ) use ( &$preserve ) {
					$preserve[] = $matches[0];

					return '<wp-preserve>';
				},
				$html
			);
		}

		// Protect pre tags.
		if ( false !== strpos( $html, '<pre' ) ) {
			$preserve_linebreaks = true;

			$html = preg_replace_callback(
				'/<pre[^>]*>[\s\S]+?<\/pre>/',
				static function ( $matches ) {
					$tag = preg_replace( '/<br ?\/?>(\r\n|\n)?/', '<wp-line-break>', $matches[0] );
					$tag = preg_replace( '/<\/?p( [^>]*)?>(\r\n|\n)?/', '<wp-line-break>', $tag );

					return preg_replace( '/\r?\n/', '<wp-line-break>', $tag );
				},
				$html
			);
		}

		// Remove line breaks but keep <br> tags inside image captions.
		if ( false !== strpos( $html, '[caption' ) ) {
			$preserve_br = true;

			$html = preg_replace_callback(
				'/\[caption[\s\S]+?\[\/caption\]/',
				static function ( $matches ) {
					$tag = preg_replace( '/<br([^>]*)>/', '<wp-temp-br$1>', $matches[0] );

					return preg_replace( '/[\r\n\t]+/', '', $tag, 1 );
				},
				$html
			);
		}

		// Normalize white space characters before and after block tags.
		$html = preg_replace( '/\s*<\/(' . $blocklist1 . ')>\s*/', '</$1>' . "\n", $html );
		$html = preg_replace( '/\s*<((?:' . $blocklist1 . ')(?: [^>]*)?)>/', "\n" . '<$1>', $html );

		// Mark </p> if it has any attributes.
		$html = preg_replace( '/(<p [^>]+>[\s\S]*?)<\/p>/', '$1</p#>', $html );

		// Preserve the first <p> inside a <div>.
		$html = preg_replace( '/<div( [^>]*)?>\s*<p>/i', '<div$1>' . "\n\n", $html );

		// Remove paragraph tags.
		$html = preg_replace( '/\s*<p>/i', '', $html );
		$html = preg_replace( '/\s*<\/p>\s*/i', "\n\n", $html );

		/*
		 * Normalize white space chars and remove multiple line breaks. The
		 * pattern needs the `u` modifier for the no-break space, and a `u`
		 * pattern returns null for a subject that is not valid UTF-8 — legacy
		 * Latin-1 content, say — where the content has to survive rather than
		 * cascade into an empty string. ASCII white space, whose bytes never
		 * occur inside a multibyte character, is still normalized then.
		 */
		$normalized = preg_replace( '/\n[\s\x{00A0}]+\n/u', "\n\n", $html );
		$html       = null === $normalized ? preg_replace( '/\n\s+\n/', "\n\n", $html ) : $normalized;

		// Replace <br> tags with line breaks.
		$html = preg_replace_callback(
			'/(\s*)<br ?\/?>\s*/i',
			static function ( $matches ) {
				return '' !== $matches[1] && false !== strpos( $matches[1], "\n" ) ? "\n\n" : "\n";
			},
			$html
		);

		// Fix line breaks around <div>.
		$html = preg_replace( '/\s*<div/', "\n" . '<div', $html );
		$html = preg_replace( '/<\/div>\s*/', '</div>' . "\n", $html );

		// Fix line breaks around caption shortcodes.
		$html = preg_replace( '/\s*\[caption([^\[]+)\[\/caption\]\s*/i', "\n\n" . '[caption$1[/caption]' . "\n\n", $html );
		$html = preg_replace( '/caption\]\n\n+\[caption/', 'caption]' . "\n\n" . '[caption', $html );

		// Pad block elements tags with a line break.
		$html = preg_replace( '/\s*<((?:' . $blocklist2 . ')(?: [^>]*)?)\s*>/', "\n" . '<$1>', $html );
		$html = preg_replace( '/\s*<\/(' . $blocklist2 . ')>\s*/', '</$1>' . "\n", $html );

		// Indent <li>, <dt> and <dd> tags.
		$html = preg_replace( '/<((li|dt|dd)[^>]*)>/', ' ' . "\t" . '<$1>', $html );

		// Fix line breaks around <select> and <option>.
		if ( false !== strpos( $html, '<option' ) ) {
			$html = preg_replace( '/\s*<option/', "\n" . '<option', $html );
			$html = preg_replace( '/\s*<\/select>/', "\n" . '</select>', $html );
		}

		// Pad <hr> with two line breaks.
		if ( false !== strpos( $html, '<hr' ) ) {
			$html = preg_replace( '/\s*<hr( [^>]*)?>\s*/', "\n\n" . '<hr$1>' . "\n\n", $html );
		}

		// Remove line breaks in <object> tags.
		if ( false !== strpos( $html, '<object' ) ) {
			$html = preg_replace_callback(
				'/<object[\s\S]+?<\/object>/',
				static function ( $matches ) {
					return preg_replace( '/[\r\n]+/', '', $matches[0] );
				},
				$html
			);
		}

		// Unmark special paragraph closing tags.
		$html = str_replace( '</p#>', '</p>' . "\n", $html );

		// Pad remaining <p> tags with a line break.
		$html = preg_replace( '/\s*(<p [^>]+>[\s\S]*?<\/p>)/', "\n" . '$1', $html );

		// Trim. The `u` pattern returns null for invalid UTF-8; see above.
		$html       = preg_replace( '/^\s+/', '', $html );
		$normalized = preg_replace( '/[\s\x{00A0}]+$/u', '', $html );
		$html       = null === $normalized ? preg_replace( '/\s+$/', '', $html ) : $normalized;

		if ( $preserve_linebreaks ) {
			$html = str_replace( '<wp-line-break>', "\n", $html );
		}

		if ( $preserve_br ) {
			$html = preg_replace( '/<wp-temp-br([^>]*)>/', '<br$1>', $html );
		}

		// Restore preserved tags.
		if ( array() !== $preserve ) {
			$html = preg_replace_callback(
				'/<wp-preserve>/',
				static function () use ( &$preserve ) {
					return array_shift( $preserve );
				},
				$html
			);
		}

		return $html;
	}

	/**
	 * Returns the markup a block saves for a shortcode, or null.
	 *
	 * A block sourcing an attribute with `raw` saves that attribute and nothing
	 * else, which is what the Shortcode block does with the shortcode's own
	 * text. That is the one shape the server can write without running a
	 * block's `save`.
	 *
	 * @param WP_Block_Type $block_type Block type.
	 * @param array         $attributes Attribute values.
	 * @return string|null Saved markup, or null when the block rebuilds its own.
	 */
	private static function raw_markup( $block_type, $attributes ) {
		foreach ( (array) $block_type->attributes as $name => $definition ) {
			if (
				isset( $definition['source'], $attributes[ $name ] )
				&& 'raw' === $definition['source']
				&& is_string( $attributes[ $name ] )
			) {
				return $attributes[ $name ];
			}
		}

		return null;
	}

	/**
	 * Returns the pattern matching a shortcode tag.
	 *
	 * The same pattern `get_shortcode_regex()` builds, with the tag left as
	 * written so a transform can match a family of tags rather than one name.
	 *
	 * @param string $tag Shortcode tag, or a pattern matching several.
	 * @return string|null Regular expression, or null when the tag cannot be written into one.
	 */
	private static function regexp( $tag ) {
		static $checked = array();

		// A non-string cannot index the cache, so it shares a per-type slot —
		// checked once, reported once — rather than throwing a TypeError.
		$key = is_string( $tag ) ? $tag : "\0" . gettype( $tag );

		if ( ! isset( $checked[ $key ] ) ) {
			$checked[ $key ] = self::is_usable_tag( $tag );
		}

		if ( ! $checked[ $key ] ) {
			return null;
		}

		return self::compose_regexp( $tag );
	}

	/**
	 * Writes a tag into the shortcode pattern.
	 *
	 * The same pattern `regexp()` in `@wordpress/shortcode` builds, so the two
	 * runtimes match the same text and number their groups the same way. The
	 * content atoms are possessive (`*+`), as in core's `get_shortcode_regex()`,
	 * which JavaScript cannot express: a run of non-brackets is always followed
	 * by a bracket or the end, so giving characters back can never produce a
	 * match and the possessive form matches the same text without the
	 * pathological backtracking.
	 *
	 * @param string $tag Shortcode tag, or a pattern matching several.
	 * @return string Regular expression, which may or may not compile.
	 */
	private static function compose_regexp( $tag ) {
		return '#\[(\[?)(' . $tag . ')(?![\w-])([^\]\/]*(?:\/(?!\])[^\]\/]*)*?)(?:(\/)\]|\](?:([^\[]*+(?:\[(?!\/\2\])[^\[]*+)*+)(\[\/\2\]))?)(\]?)#s';
	}

	/**
	 * Determines whether a tag can be written into the shortcode pattern.
	 *
	 * The tag goes in as written, so that a transform can match a family of
	 * tags rather than one name. That leaves three ways to break the pattern
	 * it goes into, all of them silent: a `#` ends it early, a capturing group
	 * renumbers every group after it, and anything else invalid stops it
	 * compiling at all.
	 *
	 * @param string $tag Shortcode tag, or a pattern matching several.
	 * @return bool Whether the tag is usable.
	 */
	private static function is_usable_tag( $tag ) {
		$reason = '';

		if ( ! is_string( $tag ) ) {
			$reason = __( 'it is not a string', 'gutenberg' );
		} elseif ( '' === $tag ) {
			$reason = __( 'it is empty', 'gutenberg' );
		} elseif ( false !== strpos( $tag, '#' ) ) {
			$reason = __( 'it contains a "#"', 'gutenberg' );
		} elseif ( preg_match( '/\((?!\?)/', $tag ) ) {
			$reason = __( 'it opens a capturing group, which has to be written "(?:" instead', 'gutenberg' );
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- An invalid pattern is reported below rather than as a PHP warning.
		} elseif ( false === @preg_match( self::compose_regexp( $tag ), '' ) ) {
			$reason = __( 'it is not a valid pattern', 'gutenberg' );
		}

		if ( '' === $reason ) {
			return true;
		}

		_doing_it_wrong(
			__METHOD__,
			sprintf(
				/* translators: 1: Shortcode tag declared by a block. 2: Why it cannot be used, for example "it contains a "#"". */
				__( 'The shortcode tag "%1$s" cannot be matched because %2$s.', 'gutenberg' ),
				is_string( $tag ) ? $tag : gettype( $tag ),
				$reason
			),
			'23.9.0'
		);

		return false;
	}

	/**
	 * Finds the next shortcode in the markup, or null.
	 *
	 * @param string $tag    Shortcode tag, or a pattern matching several.
	 * @param string $html   Markup to search.
	 * @param int    $offset Where to start looking.
	 * @return array|null Match details, or null when there is no shortcode left.
	 */
	private static function next( $tag, $html, $offset = 0 ) {
		if ( $offset >= strlen( $html ) ) {
			return null;
		}

		$pattern = self::regexp( $tag );

		if ( null === $pattern ) {
			return null;
		}

		if ( ! preg_match( $pattern, $html, $matches, PREG_OFFSET_CAPTURE, $offset ) ) {
			return null;
		}

		$text  = $matches[0][0];
		$index = $matches[0][1];

		// An escaped shortcode, `[[tag]]`, is text rather than a shortcode.
		if ( '[' === $matches[1][0] && ']' === ( isset( $matches[7] ) ? $matches[7][0] : '' ) ) {
			return self::next( $tag, $html, $index + strlen( $text ) );
		}

		/*
		 * A single bracket either side is the text around the shortcode rather
		 * than part of it, and `next()` in `@wordpress/shortcode` trims it off
		 * the match and moves the index past it.
		 */
		if ( '' !== $matches[1][0] ) {
			$text = substr( $text, 1 );
			++$index;
		}

		if ( isset( $matches[7] ) && '' !== $matches[7][0] ) {
			$text = substr( $text, 0, -1 );
		}

		return array(
			'index'   => $index,
			'text'    => $text,
			'tag'     => $matches[2][0],
			'attrs'   => self::parse_attributes( $matches[3][0] ),
			'content' => isset( $matches[5] ) && -1 !== $matches[5][1] ? $matches[5][0] : null,
		);
	}

	/**
	 * Splits a shortcode's attribute string into named and positional values.
	 *
	 * @param string $text Attribute string.
	 * @return array Attributes, under `named` and `numeric`.
	 */
	private static function parse_attributes( $text ) {
		$parsed = shortcode_parse_atts( $text );

		$attrs = array(
			'named'   => array(),
			'numeric' => array(),
		);

		if ( ! is_array( $parsed ) ) {
			return $attrs;
		}

		foreach ( $parsed as $key => $value ) {
			if ( is_int( $key ) ) {
				$attrs['numeric'][] = $value;
				continue;
			}

			$attrs['named'][ $key ] = $value;
		}

		return $attrs;
	}
}
