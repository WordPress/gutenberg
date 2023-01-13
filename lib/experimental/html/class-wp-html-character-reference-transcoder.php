<?php

/**
 * Decodes HTML character references based on their context.
 * Decodes into UTF-8 string. Leaves invalid character references
 * as their raw input instead of replacing with U+FFFD.
 *
 * @see https://html.spec.whatwg.org/entities.json
 *
 * @TODO: Write and commit script to generate the lookup table.
 * @TODO: Add function for searching within string so we can avoid allocating "class" value.
 * @TODO: Add encoder?
 */

class WP_HTML_Character_Reference_Transcoder {
	/**
	 * Replaces HTML character encodings with their corresponding text.
	 *
	 * @param string $context Either "attribute" or "data" depending on where text was encoded.
	 * @param string $input String potentially containing character references.
	 * @return string String with character references replaced by their corresponding text.
	 */
	public static function decode_utf8( $context, $input ) {
		$at     = 0;
		$buffer = '';
		$budget = 1000;
		$end    = strlen( $input );

		while ( $at < $end && $budget-- > 0 ) {
			$next = strpos( $input, '&', $at );
			/*
			 * We have to have at least as many successive characters as
			 * can be used to find the character reference group. The
			 * shortest named character reference is three characters, so
			 * we need at least this many.
			 */
			if ( false === $next || $next + 3 > $end ) {
				break;
			}

			// Grab content up until this point.
			$buffer .= substr( $input, $at, $next - $at );

			// Skip the `&` for continued processing.
			$at = $next + 1;

			// Handle decimal and hex numeric inputs
			if ( '#' === $input[ $at ] ) {
				if ( 'x' === $input[ $at + 1 ] || 'X' === $input[ $at + 1 ] ) {
					$numeric_base   = 16;
					$numeric_digits = '0123456789abcdefABCDEF';
					$max_digits     = 6; // &#x10FFFF;
					$at += 2;
				} else {
					$numeric_base   = 10;
					$numeric_digits = '0123456789';
					$max_digits     = 7; // &#1114111;
					$at += 1;
				}

				// Leading zeros are interpreted as zero values; skip them.
				$at += strspn( $input, '0', $at );
				if ( $at === $end ) {
					$buffer .= substr( $input, $next, $at - $next );
					break;
				}

				// Max legitimate character reference is to U+10FFFF.
				$digit_count = strspn( $input, $numeric_digits, $at );
				if ( 0 === $digit_count || $digit_count > $max_digits ) {
					$at += $digit_count;
					$buffer .= substr( $input, $next, $at - $next );
					continue;
				}
				$digits     = substr( $input, $at, $digit_count );
				$code_point = intval( $digits, $numeric_base );

				/*
				 * While HTML specifies that we replace invalid references like these
				 * with the replacement character U+FFFD, we're going to leave it in
				 * so we can preserve the input as best we can. The browser will still
				 * replace it eventually, but until render we don't want to inject
				 * these replacement characters into the data stream.
				 */
				if (
					// Null character.
					0 === $code_point ||

					// Outside Unicode range.
					$code_point > 0x10FFFF ||

					// Surrogate.
					( $code_point >= 0xD800 && $code_point <= 0xDFFF ) ||

					// Noncharacters.
					( $code_point >= 0xFDD0 && $code_point <= 0xFDEF ) ||
					( 0xFFFE === ( $code_point & 0xFFFE ) ) ||

					// 0x0D or non-ASCII-whitespace control
					0x0D === $code_point ||
					(
						$code_point >= 0 &&
						$code_point <= 0x1F &&
						0x9 !== $code_point &&
						0xA !== $code_point &&
						0xC !== $code_point &&
						0xD !== $code_point
					)
				) {
					$at += $digit_count;
					$buffer .= substr( $input, $next, $at - $next );
					continue;
				}

				if ( $code_point >= 0x80 && $code_point <= 0x9F && array_key_exists( $code_point, self::$c1_replacements ) ) {
					$at += $digit_count;
					if ( $at < $end && ';' === $input[ $at ] ) {
						$at++;
					}
					$buffer .= self::$c1_replacements[ $code_point ];
					continue;
				}

				// Convert code point to UTF-8 bytes.
				if ( $code_point < 0x80 ) {
					$buffer .= sprintf( '%c', $code_point & 0x7F );
				} else if ( $code_point < 0x800 ) {
					$buffer .= sprintf(
						'%c%c',
						0xC0 | ( ( $code_point >> 6 ) & 0x1F ),
						0x80 | ( $code_point & 0x3F )
					);
				} else if ( $code_point < 0x10000 ) {
					$buffer .= sprintf(
						'%c%c%c',
						0xE0 | ( ( $code_point >> 12 ) & 0x0F ),
						0x80 | ( ( $code_point >> 6 ) & 0x3F ),
						0x80 | ( $code_point & 0x3F )
					);
				} else {
					$buffer .= sprintf(
						'%c%c%c%c',
						0xF0 | ( ( $code_point >> 18 ) & 0x07 ),
						0x80 | ( ( $code_point >> 12 ) & 0x3F ),
						0x80 | ( ( $code_point >> 6 ) & 0x3F ),
						0x80 | ( $code_point & 0x3F )
					);
				}

				$at += $digit_count;
				if ( $at < $end && ';' === $input[ $at ] ) {
					$at++;
				}
				continue;
			}

			// &Aacute; -> group "Aa" (skip & since we know it's there).
			$group = substr( $input, $at, 2 );

			if ( array_key_exists( $group, self::$lookup_table ) ) {
				$at += 2;

				$group = self::$lookup_table[ $group ];

				$i = 0;
				while ( $i < strlen( $group ) ) {
					/*
					 * Extract name and substitution information from group string.
					 *
					 * Example:
					 *
					 * For group "qu", during lookup that will find "&quot;"
					 *
					 * ┌─────┬────┬──────┬────┬──────────────┬────┬─────┐
					 * │ ... │ N5 │ Name │ S5 │ Substitution │ N6 │ ... │
					 * ├─────┼────┼──────┼────┼──────────────┼────┼─────┤
					 * │ ... │ 04 │ ote; │ 01 │ "            │ 03 │ ... │
					 * └─────┴────┴──────┴────┴──────────────┴────┴─────┘
					 *         ^^          ^^
					 *          |           |
					 *          |           ╰ The substitution is one byte,
					 *          |             even though it's represented in
					 *          |             the string literal as "\x22", which
					 *          |             is done for the sake of avoiding
					 *          |             quoting issues in PHP.
					 *          |
					 *          ╰ The "ote;" is four bytes (the finishing of &quo̱ṯe̱;̱)
					 *
					 * The part of the group string this represents follows:
					 * > ...\x04ote;\x01\x22\x03...
					 *
					 * So we can see that we read a single character and interpret
					 * it as a byte containing the length of the bytes in the name,
					 * then we read the name, then the byte after that indicates how
					 * many bytes are in the substitution string for that name, then
					 * we start the next name pair until we reach the end of the
					 * group string.
					 *
					 */
					$name_length = ord( $group[ $i++ ] );
					$name = substr( $group, $i, $name_length );
					$i += $name_length;
					$sub_length = ord( $group[ $i++ ] );
					$sub_at = $i;
					$i += $sub_length;

					if ( $at + $name_length > $end || 0 !== substr_compare( $input, $name, $at, $name_length ) ) {
						continue;
					}

					$at += $name_length;

					// If we have an un-ambiguous ampersand we can always safely decode it.
					if ( $name_length > 0 && ';' === $name[ $name_length - 1 ] ) {
						$buffer .= substr( $group, $sub_at, $sub_length );
						continue 2;
					}

					/*
					 * At this point though have matched an entry in the named
					 * character reference table but the match doesn't end in `;`.
					 * We need to determine if the next letter makes it an ambiguous.
					 */
					$ambiguous_follower = (
						$at < $end &&
						(
							ctype_alnum( $input[ $at ] ) ||
							'=' === $input[ $at ]
						)
					);
					if ( ! $ambiguous_follower ) {
						$buffer .= substr( $group, $sub_at, $sub_length );
						continue 2;
					}

					// Ambiguous ampersand is context-sensitive.
					switch ( $context ) {
						case 'attribute':
							$buffer .= substr( $input, $next, $at - $next );
							continue 3;

						case 'data':
							$buffer .= substr( $group, $sub_at, $sub_length );
							continue 3;
					}
				}
			}

			/*
			 * Whether by failing to find a group or failing to find a name,
			 * we have failed to match a character reference name, so we can
			 * continue processing as if this is plain text and leave the
			 * invalid character reference name in place.
			 */
			$buffer .= substr( $input, $next, $at );
		}

		if ( 0 === $at ) {
			return $input;
		}

		if ( $at < $end ) {
			$buffer .= substr( $input, $at );
		}

		return $buffer;
	}

	/**
	 * When numeric character references indicate certain code points
	 * within the C1 control characters, these substitutions are used.
	 *
	 * @see https://html.spec.whatwg.org/#numeric-character-reference-end-state
	 *
	 * @var string[]
	 */
	static $c1_replacements = array(
		0x80 => "€",
		0x82 => "‚",
		0x83 => "ƒ",
		0x84 => "„",
		0x85 => "…",
		0x86 => "†",
		0x87 => "‡",
		0x88 => "ˆ",
		0x89 => "‰",
		0x8A => "Š",
		0x8B => "‹",
		0x8C => "Œ",
		0x8E => "Ž",
		0x91 => "‘",
		0x92 => "’",
		0x93 => "“",
		0x94 => "”",
		0x95 => "•",
		0x96 => "–",
		0x97 => "—",
		0x98 => "˜",
		0x99 => "™",
		0x9A => "š",
		0x9B => "›",
		0x9C => "œ",
		0x9E => "ž",
		0x9F => "Ÿ",
	);

	/**
	 * Autogenerated table of named character references.
	 *
	 * Character reference names are grouped by their first two characters,
	 * then each group is string encoding the names and substitutions in
	 * that group.
	 *  - The first byte represents the length of the following name.
	 *  - The bytes pertaining to the name follow the first byte.
	 *  - The next byte represents the length of the following substitution for the previous name.
	 *  - The bytes pertaining to the substitution follow this byte.
	 *  - The end of the group string indicates that there are no more names in the group.
	 *
	 * The format for this lookup table is the result of an attempt to minimize memory
	 * overhead while maintaining fast lookup. Since every named character reference is
	 * at least three letters long (shortest is one of `&GT`, `&LT`, `&gt`, `&lt`), we
	 * take the first two non-`&` letters as a group, leaving an average of 3.5 names
	 * per group with a median of 2 names per group.
	 *
	 * The small size of each group should preserve memory locality of the group names
	 * while maintaining quick testing of each candidate in the group since we know the
	 * entire group and all its data will occupy consecutive bytes in memory.
	 *
	 * @see https://html.spec.whatwg.org/#named-character-references
	 * @see https://html.spec.whatwg.org/entities.json
	 *
	 * @var string[] named character reference information
	 */
	public static $lookup_table = array(
		"AE" => "\x04lig;\x02Æ\x03lig\x02Æ",               // &AElig; &AElig
		"AM" => "\x02P;\x01&\x01P\x01&",                   // &AMP; &AMP
		"Aa" => "\x05cute;\x02Á\x04cute\x02Á",             // &Aacute; &Aacute
		"Ab" => "\x05reve;\x02Ă",                          // &Abreve;
		"Ac" => "\x04irc;\x02Â\x03irc\x02Â\x02y;\x02А",    // &Acirc; &Acirc &Acy;
		"Af" => "\x02r;\x04𝔄",                             // &Afr;
		"Ag" => "\x05rave;\x02À\x04rave\x02À",             // &Agrave; &Agrave
		"Al" => "\x04pha;\x02Α",                           // &Alpha;
		"Am" => "\x04acr;\x02Ā",                           // &Amacr;
		"An" => "\x02d;\x03⩓",                             // &And;
		"Ao" => "\x04gon;\x02Ą\x03pf;\x04𝔸",               // &Aogon; &Aopf;
		"Ap" => "\x0cplyFunction;\x03\u{2061}",            // &ApplyFunction;
		"Ar" => "\x04ing;\x02Å\x03ing\x02Å",               // &Aring; &Aring
		"As" => "\x05sign;\x03≔\x03cr;\x04𝒜",              // &Assign; &Ascr;
		"At" => "\x05ilde;\x02Ã\x04ilde\x02Ã",             // &Atilde; &Atilde
		"Au" => "\x03ml;\x02Ä\x02ml\x02Ä",                 // &Auml; &Auml
		// &Backslash; &Barwed; &Barv;
		"Ba" => "\x08ckslash;\x03∖\x05rwed;\x03⌆\x03rv;\x03⫧",
		"Bc" => "\x02y;\x02Б",                             // &Bcy;
		// &Bernoullis; &Because; &Beta;
		"Be" => "\x09rnoullis;\x03ℬ\x06cause;\x03∵\x03ta;\x02Β",
		"Bf" => "\x02r;\x04𝔅",                             // &Bfr;
		"Bo" => "\x03pf;\x04𝔹",                            // &Bopf;
		"Br" => "\x04eve;\x02˘",                           // &Breve;
		"Bs" => "\x03cr;\x03ℬ",                            // &Bscr;
		"Bu" => "\x05mpeq;\x03≎",                          // &Bumpeq;
		"CH" => "\x03cy;\x02Ч",                            // &CHcy;
		"CO" => "\x03PY;\x02©\x02PY\x02©",                 // &COPY; &COPY
		// &CapitalDifferentialD; &Cayleys; &Cacute; &Cap;
		"Ca" => "\x13pitalDifferentialD;\x03ⅅ\x06yleys;\x03ℭ\x05cute;\x02Ć\x02p;\x03⋒",
		// &Cconint; &Ccaron; &Ccedil; &Ccedil &Ccirc;
		"Cc" => "\x06onint;\x03∰\x05aron;\x02Č\x05edil;\x02Ç\x04edil\x02Ç\x04irc;\x02Ĉ",
		"Cd" => "\x03ot;\x02Ċ",                            // &Cdot;
		"Ce" => "\x08nterDot;\x02·\x06dilla;\x02¸",        // &CenterDot; &Cedilla;
		"Cf" => "\x02r;\x03ℭ",                             // &Cfr;
		"Ch" => "\x02i;\x02Χ",                             // &Chi;
		// &CircleMinus; &CircleTimes; &CirclePlus; &CircleDot;
		"Ci" => "\x0arcleMinus;\x03⊖\x0arcleTimes;\x03⊗\x09rclePlus;\x03⊕\x08rcleDot;\x03⊙",
		// &ClockwiseContourIntegral; &CloseCurlyDoubleQuote; &CloseCurlyQuote;
		"Cl" => "\x17ockwiseContourIntegral;\x03∲\x14oseCurlyDoubleQuote;\x03”\x0eoseCurlyQuote;\x03’",
		// &CounterClockwiseContourIntegral; &ContourIntegral; &Congruent; &Coproduct; &Colone; &Conint; &Colon; &Copf;
		"Co" => "\x1eunterClockwiseContourIntegral;\x03∳\x0entourIntegral;\x03∮\x08ngruent;\x03≡\x08product;\x03∐\x05lone;\x03⩴\x05nint;\x03∯\x04lon;\x03∷\x03pf;\x03ℂ",
		"Cr" => "\x04oss;\x03⨯",                           // &Cross;
		"Cs" => "\x03cr;\x04𝒞",                            // &Cscr;
		"Cu" => "\x05pCap;\x03≍\x02p;\x03⋓",               // &CupCap; &Cup;
		"DD" => "\x07otrahd;\x03⤑\x01;\x03ⅅ",              // &DDotrahd; &DD;
		"DJ" => "\x03cy;\x02Ђ",                            // &DJcy;
		"DS" => "\x03cy;\x02Ѕ",                            // &DScy;
		"DZ" => "\x03cy;\x02Џ",                            // &DZcy;
		"Da" => "\x05gger;\x03‡\x04shv;\x03⫤\x03rr;\x03↡", // &Dagger; &Dashv; &Darr;
		"Dc" => "\x05aron;\x02Ď\x02y;\x02Д",               // &Dcaron; &Dcy;
		"De" => "\x04lta;\x02Δ\x02l;\x03∇",                // &Delta; &Del;
		"Df" => "\x02r;\x04𝔇",                             // &Dfr;
		// &DiacriticalDoubleAcute; &DiacriticalAcute; &DiacriticalGrave; &DiacriticalTilde; &DiacriticalDot; &DifferentialD; &Diamond;
		"Di" => "\x15acriticalDoubleAcute;\x02˝\x0facriticalAcute;\x02´\x0facriticalGrave;\x01`\x0facriticalTilde;\x02˜\x0dacriticalDot;\x02˙\x0cfferentialD;\x03ⅆ\x06amond;\x03⋄",
		// &DoubleLongLeftRightArrow; &DoubleContourIntegral; &DoubleLeftRightArrow; &DoubleLongRightArrow; &DoubleLongLeftArrow; &DownLeftRightVector; &DownRightTeeVector; &DownRightVectorBar; &DoubleUpDownArrow; &DoubleVerticalBar; &DownLeftTeeVector; &DownLeftVectorBar; &DoubleRightArrow; &DownArrowUpArrow; &DoubleDownArrow; &DoubleLeftArrow; &DownRightVector; &DoubleRightTee; &DownLeftVector; &DoubleLeftTee; &DoubleUpArrow; &DownArrowBar; &DownTeeArrow; &DoubleDot; &DownArrow; &DownBreve; &Downarrow; &DotEqual; &DownTee; &DotDot; &Dopf; &Dot;
		"Do" => "\x17ubleLongLeftRightArrow;\x03⟺\x14ubleContourIntegral;\x03∯\x13ubleLeftRightArrow;\x03⇔\x13ubleLongRightArrow;\x03⟹\x12ubleLongLeftArrow;\x03⟸\x12wnLeftRightVector;\x03⥐\x11wnRightTeeVector;\x03⥟\x11wnRightVectorBar;\x03⥗\x10ubleUpDownArrow;\x03⇕\x10ubleVerticalBar;\x03∥\x10wnLeftTeeVector;\x03⥞\x10wnLeftVectorBar;\x03⥖\x0fubleRightArrow;\x03⇒\x0fwnArrowUpArrow;\x03⇵\x0eubleDownArrow;\x03⇓\x0eubleLeftArrow;\x03⇐\x0ewnRightVector;\x03⇁\x0dubleRightTee;\x03⊨\x0dwnLeftVector;\x03↽\x0cubleLeftTee;\x03⫤\x0cubleUpArrow;\x03⇑\x0bwnArrowBar;\x03⤓\x0bwnTeeArrow;\x03↧\x08ubleDot;\x02¨\x08wnArrow;\x03↓\x08wnBreve;\x02̑\x08wnarrow;\x03⇓\x07tEqual;\x03≐\x06wnTee;\x03⊤\x05tDot;\x03⃜\x03pf;\x04𝔻\x02t;\x02¨",
		"Ds" => "\x05trok;\x02Đ\x03cr;\x04𝒟",              // &Dstrok; &Dscr;
		"EN" => "\x02G;\x02Ŋ",                             // &ENG;
		"ET" => "\x02H;\x02Ð\x01H\x02Ð",                   // &ETH; &ETH
		"Ea" => "\x05cute;\x02É\x04cute\x02É",             // &Eacute; &Eacute
		// &Ecaron; &Ecirc; &Ecirc &Ecy;
		"Ec" => "\x05aron;\x02Ě\x04irc;\x02Ê\x03irc\x02Ê\x02y;\x02Э",
		"Ed" => "\x03ot;\x02Ė",                            // &Edot;
		"Ef" => "\x02r;\x04𝔈",                             // &Efr;
		"Eg" => "\x05rave;\x02È\x04rave\x02È",             // &Egrave; &Egrave
		"El" => "\x06ement;\x03∈",                         // &Element;
		// &EmptyVerySmallSquare; &EmptySmallSquare; &Emacr;
		"Em" => "\x13ptyVerySmallSquare;\x03▫\x0fptySmallSquare;\x03◻\x04acr;\x02Ē",
		"Eo" => "\x04gon;\x02Ę\x03pf;\x04𝔼",               // &Eogon; &Eopf;
		"Ep" => "\x06silon;\x02Ε",                         // &Epsilon;
		// &Equilibrium; &EqualTilde; &Equal;
		"Eq" => "\x0auilibrium;\x03⇌\x09ualTilde;\x03≂\x04ual;\x03⩵",
		"Es" => "\x03cr;\x03ℰ\x03im;\x03⩳",                // &Escr; &Esim;
		"Et" => "\x02a;\x02Η",                             // &Eta;
		"Eu" => "\x03ml;\x02Ë\x02ml\x02Ë",                 // &Euml; &Euml
		"Ex" => "\x0bponentialE;\x03ⅇ\x05ists;\x03∃",      // &ExponentialE; &Exists;
		"Fc" => "\x02y;\x02Ф",                             // &Fcy;
		"Ff" => "\x02r;\x04𝔉",                             // &Ffr;
		// &FilledVerySmallSquare; &FilledSmallSquare;
		"Fi" => "\x14lledVerySmallSquare;\x03▪\x10lledSmallSquare;\x03◼",
		// &Fouriertrf; &ForAll; &Fopf;
		"Fo" => "\x09uriertrf;\x03ℱ\x05rAll;\x03∀\x03pf;\x04𝔽",
		"Fs" => "\x03cr;\x03ℱ",                            // &Fscr;
		"GJ" => "\x03cy;\x02Ѓ",                            // &GJcy;
		"GT" => "\x01;\x01>\x00\x01>",                     // &GT; &GT
		"Ga" => "\x05mmad;\x02Ϝ\x04mma;\x02Γ",             // &Gammad; &Gamma;
		"Gb" => "\x05reve;\x02Ğ",                          // &Gbreve;
		"Gc" => "\x05edil;\x02Ģ\x04irc;\x02Ĝ\x02y;\x02Г",  // &Gcedil; &Gcirc; &Gcy;
		"Gd" => "\x03ot;\x02Ġ",                            // &Gdot;
		"Gf" => "\x02r;\x04𝔊",                             // &Gfr;
		"Gg" => "\x01;\x03⋙",                              // &Gg;
		"Go" => "\x03pf;\x04𝔾",                            // &Gopf;
		// &GreaterSlantEqual; &GreaterEqualLess; &GreaterFullEqual; &GreaterGreater; &GreaterEqual; &GreaterTilde; &GreaterLess;
		"Gr" => "\x10eaterSlantEqual;\x03⩾\x0featerEqualLess;\x03⋛\x0featerFullEqual;\x03≧\x0deaterGreater;\x03⪢\x0beaterEqual;\x03≥\x0beaterTilde;\x03≳\x0aeaterLess;\x03≷",
		"Gs" => "\x03cr;\x04𝒢",                            // &Gscr;
		"Gt" => "\x01;\x03≫",                              // &Gt;
		"HA" => "\x05RDcy;\x02Ъ",                          // &HARDcy;
		"Ha" => "\x04cek;\x02ˇ\x02t;\x01^",                // &Hacek; &Hat;
		"Hc" => "\x04irc;\x02Ĥ",                           // &Hcirc;
		"Hf" => "\x02r;\x03ℌ",                             // &Hfr;
		"Hi" => "\x0blbertSpace;\x03ℋ",                    // &HilbertSpace;
		"Ho" => "\x0drizontalLine;\x03─\x03pf;\x03ℍ",      // &HorizontalLine; &Hopf;
		"Hs" => "\x05trok;\x02Ħ\x03cr;\x03ℋ",              // &Hstrok; &Hscr;
		"Hu" => "\x0bmpDownHump;\x03≎\x08mpEqual;\x03≏",   // &HumpDownHump; &HumpEqual;
		"IE" => "\x03cy;\x02Е",                            // &IEcy;
		"IJ" => "\x04lig;\x02Ĳ",                           // &IJlig;
		"IO" => "\x03cy;\x02Ё",                            // &IOcy;
		"Ia" => "\x05cute;\x02Í\x04cute\x02Í",             // &Iacute; &Iacute
		"Ic" => "\x04irc;\x02Î\x03irc\x02Î\x02y;\x02И",    // &Icirc; &Icirc &Icy;
		"Id" => "\x03ot;\x02İ",                            // &Idot;
		"If" => "\x02r;\x03ℑ",                             // &Ifr;
		"Ig" => "\x05rave;\x02Ì\x04rave\x02Ì",             // &Igrave; &Igrave
		// &ImaginaryI; &Implies; &Imacr; &Im;
		"Im" => "\x09aginaryI;\x03ⅈ\x06plies;\x03⇒\x04acr;\x02Ī\x01;\x03ℑ",
		// &InvisibleComma; &InvisibleTimes; &Intersection; &Integral; &Int;
		"In" => "\x0dvisibleComma;\x03\u{2063}\x0dvisibleTimes;\x03\u{2062}\x0btersection;\x03⋂\x07tegral;\x03∫\x02t;\x03∬",
		"Io" => "\x04gon;\x02Į\x03pf;\x04𝕀\x03ta;\x02Ι",   // &Iogon; &Iopf; &Iota;
		"Is" => "\x03cr;\x03ℐ",                            // &Iscr;
		"It" => "\x05ilde;\x02Ĩ",                          // &Itilde;
		"Iu" => "\x04kcy;\x02І\x03ml;\x02Ï\x02ml\x02Ï",    // &Iukcy; &Iuml; &Iuml
		"Jc" => "\x04irc;\x02Ĵ\x02y;\x02Й",                // &Jcirc; &Jcy;
		"Jf" => "\x02r;\x04𝔍",                             // &Jfr;
		"Jo" => "\x03pf;\x04𝕁",                            // &Jopf;
		"Js" => "\x05ercy;\x02Ј\x03cr;\x04𝒥",              // &Jsercy; &Jscr;
		"Ju" => "\x04kcy;\x02Є",                           // &Jukcy;
		"KH" => "\x03cy;\x02Х",                            // &KHcy;
		"KJ" => "\x03cy;\x02Ќ",                            // &KJcy;
		"Ka" => "\x04ppa;\x02Κ",                           // &Kappa;
		"Kc" => "\x05edil;\x02Ķ\x02y;\x02К",               // &Kcedil; &Kcy;
		"Kf" => "\x02r;\x04𝔎",                             // &Kfr;
		"Ko" => "\x03pf;\x04𝕂",                            // &Kopf;
		"Ks" => "\x03cr;\x04𝒦",                            // &Kscr;
		"LJ" => "\x03cy;\x02Љ",                            // &LJcy;
		"LT" => "\x01;\x01<\x00\x01<",                     // &LT; &LT
		// &Laplacetrf; &Lacute; &Lambda; &Lang; &Larr;
		"La" => "\x09placetrf;\x03ℒ\x05cute;\x02Ĺ\x05mbda;\x02Λ\x03ng;\x03⟪\x03rr;\x03↞",
		"Lc" => "\x05aron;\x02Ľ\x05edil;\x02Ļ\x02y;\x02Л", // &Lcaron; &Lcedil; &Lcy;
		// &LeftArrowRightArrow; &LeftDoubleBracket; &LeftDownTeeVector; &LeftDownVectorBar; &LeftTriangleEqual; &LeftAngleBracket; &LeftUpDownVector; &LessEqualGreater; &LeftRightVector; &LeftTriangleBar; &LeftUpTeeVector; &LeftUpVectorBar; &LeftDownVector; &LeftRightArrow; &Leftrightarrow; &LessSlantEqual; &LeftTeeVector; &LeftVectorBar; &LessFullEqual; &LeftArrowBar; &LeftTeeArrow; &LeftTriangle; &LeftUpVector; &LeftCeiling; &LessGreater; &LeftVector; &LeftArrow; &LeftFloor; &Leftarrow; &LessTilde; &LessLess; &LeftTee;
		"Le" => "\x12ftArrowRightArrow;\x03⇆\x10ftDoubleBracket;\x03⟦\x10ftDownTeeVector;\x03⥡\x10ftDownVectorBar;\x03⥙\x10ftTriangleEqual;\x03⊴\x0fftAngleBracket;\x03⟨\x0fftUpDownVector;\x03⥑\x0fssEqualGreater;\x03⋚\x0eftRightVector;\x03⥎\x0eftTriangleBar;\x03⧏\x0eftUpTeeVector;\x03⥠\x0eftUpVectorBar;\x03⥘\x0dftDownVector;\x03⇃\x0dftRightArrow;\x03↔\x0dftrightarrow;\x03⇔\x0dssSlantEqual;\x03⩽\x0cftTeeVector;\x03⥚\x0cftVectorBar;\x03⥒\x0cssFullEqual;\x03≦\x0bftArrowBar;\x03⇤\x0bftTeeArrow;\x03↤\x0bftTriangle;\x03⊲\x0bftUpVector;\x03↿\x0aftCeiling;\x03⌈\x0assGreater;\x03≶\x09ftVector;\x03↼\x08ftArrow;\x03←\x08ftFloor;\x03⌊\x08ftarrow;\x03⇐\x08ssTilde;\x03≲\x07ssLess;\x03⪡\x06ftTee;\x03⊣",
		"Lf" => "\x02r;\x04𝔏",                             // &Lfr;
		"Ll" => "\x09eftarrow;\x03⇚\x01;\x03⋘",            // &Lleftarrow; &Ll;
		"Lm" => "\x05idot;\x02Ŀ",                          // &Lmidot;
		// &LongLeftRightArrow; &Longleftrightarrow; &LowerRightArrow; &LongRightArrow; &Longrightarrow; &LowerLeftArrow; &LongLeftArrow; &Longleftarrow; &Lopf;
		"Lo" => "\x11ngLeftRightArrow;\x03⟷\x11ngleftrightarrow;\x03⟺\x0ewerRightArrow;\x03↘\x0dngRightArrow;\x03⟶\x0dngrightarrow;\x03⟹\x0dwerLeftArrow;\x03↙\x0cngLeftArrow;\x03⟵\x0cngleftarrow;\x03⟸\x03pf;\x04𝕃",
		"Ls" => "\x05trok;\x02Ł\x03cr;\x03ℒ\x02h;\x03↰",   // &Lstrok; &Lscr; &Lsh;
		"Lt" => "\x01;\x03≪",                              // &Lt;
		"Ma" => "\x02p;\x03⤅",                             // &Map;
		"Mc" => "\x02y;\x02М",                             // &Mcy;
		"Me" => "\x0adiumSpace;\x03 \x08llintrf;\x03ℳ",    // &MediumSpace; &Mellintrf;
		"Mf" => "\x02r;\x04𝔐",                             // &Mfr;
		"Mi" => "\x08nusPlus;\x03∓",                       // &MinusPlus;
		"Mo" => "\x03pf;\x04𝕄",                            // &Mopf;
		"Ms" => "\x03cr;\x03ℳ",                            // &Mscr;
		"Mu" => "\x01;\x02Μ",                              // &Mu;
		"NJ" => "\x03cy;\x02Њ",                            // &NJcy;
		"Na" => "\x05cute;\x02Ń",                          // &Nacute;
		"Nc" => "\x05aron;\x02Ň\x05edil;\x02Ņ\x02y;\x02Н", // &Ncaron; &Ncedil; &Ncy;
		// &NegativeVeryThinSpace; &NestedGreaterGreater; &NegativeMediumSpace; &NegativeThickSpace; &NegativeThinSpace; &NestedLessLess; &NewLine;
		"Ne" => "\x14gativeVeryThinSpace;\x03\u{200B}\x13stedGreaterGreater;\x03≫\x12gativeMediumSpace;\x03\u{200B}\x11gativeThickSpace;\x03\u{200B}\x10gativeThinSpace;\x03\u{200B}\x0dstedLessLess;\x03≪\x06wLine;\x01\u{0A}",
		"Nf" => "\x02r;\x04𝔑",                             // &Nfr;
		// &NotNestedGreaterGreater; &NotSquareSupersetEqual; &NotPrecedesSlantEqual; &NotRightTriangleEqual; &NotSucceedsSlantEqual; &NotDoubleVerticalBar; &NotGreaterSlantEqual; &NotLeftTriangleEqual; &NotSquareSubsetEqual; &NotGreaterFullEqual; &NotRightTriangleBar; &NotLeftTriangleBar; &NotGreaterGreater; &NotLessSlantEqual; &NotNestedLessLess; &NotReverseElement; &NotSquareSuperset; &NotTildeFullEqual; &NonBreakingSpace; &NotPrecedesEqual; &NotRightTriangle; &NotSucceedsEqual; &NotSucceedsTilde; &NotSupersetEqual; &NotGreaterEqual; &NotGreaterTilde; &NotHumpDownHump; &NotLeftTriangle; &NotSquareSubset; &NotGreaterLess; &NotLessGreater; &NotSubsetEqual; &NotVerticalBar; &NotEqualTilde; &NotTildeEqual; &NotTildeTilde; &NotCongruent; &NotHumpEqual; &NotLessEqual; &NotLessTilde; &NotLessLess; &NotPrecedes; &NotSucceeds; &NotSuperset; &NotElement; &NotGreater; &NotCupCap; &NotExists; &NotSubset; &NotEqual; &NotTilde; &NoBreak; &NotLess; &Nopf; &Not;
		"No" => "\x16tNestedGreaterGreater;\x05⪢̸\x15tSquareSupersetEqual;\x03⋣\x14tPrecedesSlantEqual;\x03⋠\x14tRightTriangleEqual;\x03⋭\x14tSucceedsSlantEqual;\x03⋡\x13tDoubleVerticalBar;\x03∦\x13tGreaterSlantEqual;\x05⩾̸\x13tLeftTriangleEqual;\x03⋬\x13tSquareSubsetEqual;\x03⋢\x12tGreaterFullEqual;\x05≧̸\x12tRightTriangleBar;\x05⧐̸\x11tLeftTriangleBar;\x05⧏̸\x10tGreaterGreater;\x05≫̸\x10tLessSlantEqual;\x05⩽̸\x10tNestedLessLess;\x05⪡̸\x10tReverseElement;\x03∌\x10tSquareSuperset;\x05⊐̸\x10tTildeFullEqual;\x03≇\x0fnBreakingSpace;\x02 \x0ftPrecedesEqual;\x05⪯̸\x0ftRightTriangle;\x03⋫\x0ftSucceedsEqual;\x05⪰̸\x0ftSucceedsTilde;\x05≿̸\x0ftSupersetEqual;\x03⊉\x0etGreaterEqual;\x03≱\x0etGreaterTilde;\x03≵\x0etHumpDownHump;\x05≎̸\x0etLeftTriangle;\x03⋪\x0etSquareSubset;\x05⊏̸\x0dtGreaterLess;\x03≹\x0dtLessGreater;\x03≸\x0dtSubsetEqual;\x03⊈\x0dtVerticalBar;\x03∤\x0ctEqualTilde;\x05≂̸\x0ctTildeEqual;\x03≄\x0ctTildeTilde;\x03≉\x0btCongruent;\x03≢\x0btHumpEqual;\x05≏̸\x0btLessEqual;\x03≰\x0btLessTilde;\x03≴\x0atLessLess;\x05≪̸\x0atPrecedes;\x03⊀\x0atSucceeds;\x03⊁\x0atSuperset;\x06⊃⃒\x09tElement;\x03∉\x09tGreater;\x03≯\x08tCupCap;\x03≭\x08tExists;\x03∄\x08tSubset;\x06⊂⃒\x07tEqual;\x03≠\x07tTilde;\x03≁\x06Break;\x03\u{2060}\x06tLess;\x03≮\x03pf;\x03ℕ\x02t;\x03⫬",
		"Ns" => "\x03cr;\x04𝒩",                            // &Nscr;
		"Nt" => "\x05ilde;\x02Ñ\x04ilde\x02Ñ",             // &Ntilde; &Ntilde
		"Nu" => "\x01;\x02Ν",                              // &Nu;
		"OE" => "\x04lig;\x02Œ",                           // &OElig;
		"Oa" => "\x05cute;\x02Ó\x04cute\x02Ó",             // &Oacute; &Oacute
		"Oc" => "\x04irc;\x02Ô\x03irc\x02Ô\x02y;\x02О",    // &Ocirc; &Ocirc &Ocy;
		"Od" => "\x05blac;\x02Ő",                          // &Odblac;
		"Of" => "\x02r;\x04𝔒",                             // &Ofr;
		"Og" => "\x05rave;\x02Ò\x04rave\x02Ò",             // &Ograve; &Ograve
		// &Omicron; &Omacr; &Omega;
		"Om" => "\x06icron;\x02Ο\x04acr;\x02Ō\x04ega;\x02Ω",
		"Oo" => "\x03pf;\x04𝕆",                            // &Oopf;
		// &OpenCurlyDoubleQuote; &OpenCurlyQuote;
		"Op" => "\x13enCurlyDoubleQuote;\x03“\x0denCurlyQuote;\x03‘",
		"Or" => "\x01;\x03⩔",                              // &Or;
		"Os" => "\x05lash;\x02Ø\x04lash\x02Ø\x03cr;\x04𝒪", // &Oslash; &Oslash &Oscr;
		// &Otilde; &Otimes; &Otilde
		"Ot" => "\x05ilde;\x02Õ\x05imes;\x03⨷\x04ilde\x02Õ",
		"Ou" => "\x03ml;\x02Ö\x02ml\x02Ö",                 // &Ouml; &Ouml
		// &OverParenthesis; &OverBracket; &OverBrace; &OverBar;
		"Ov" => "\x0eerParenthesis;\x03⏜\x0aerBracket;\x03⎴\x08erBrace;\x03⏞\x06erBar;\x03‾",
		"Pa" => "\x07rtialD;\x03∂",                        // &PartialD;
		"Pc" => "\x02y;\x02П",                             // &Pcy;
		"Pf" => "\x02r;\x04𝔓",                             // &Pfr;
		"Ph" => "\x02i;\x02Φ",                             // &Phi;
		"Pi" => "\x01;\x02Π",                              // &Pi;
		"Pl" => "\x08usMinus;\x02±",                       // &PlusMinus;
		"Po" => "\x0cincareplane;\x03ℌ\x03pf;\x03ℙ",       // &Poincareplane; &Popf;
		// &PrecedesSlantEqual; &PrecedesEqual; &PrecedesTilde; &Proportional; &Proportion; &Precedes; &Product; &Prime; &Pr;
		"Pr" => "\x11ecedesSlantEqual;\x03≼\x0cecedesEqual;\x03⪯\x0cecedesTilde;\x03≾\x0boportional;\x03∝\x09oportion;\x03∷\x07ecedes;\x03≺\x06oduct;\x03∏\x04ime;\x03″\x01;\x03⪻",
		"Ps" => "\x03cr;\x04𝒫\x02i;\x02Ψ",                 // &Pscr; &Psi;
		"QU" => "\x03OT;\x01\x22\x02OT\x01\x22",           // &QUOT; &QUOT
		"Qf" => "\x02r;\x04𝔔",                             // &Qfr;
		"Qo" => "\x03pf;\x03ℚ",                            // &Qopf;
		"Qs" => "\x03cr;\x04𝒬",                            // &Qscr;
		"RB" => "\x04arr;\x03⤐",                           // &RBarr;
		"RE" => "\x02G;\x02®\x01G\x02®",                   // &REG; &REG
		// &Racute; &Rarrtl; &Rang; &Rarr;
		"Ra" => "\x05cute;\x02Ŕ\x05rrtl;\x03⤖\x03ng;\x03⟫\x03rr;\x03↠",
		"Rc" => "\x05aron;\x02Ř\x05edil;\x02Ŗ\x02y;\x02Р", // &Rcaron; &Rcedil; &Rcy;
		// &ReverseUpEquilibrium; &ReverseEquilibrium; &ReverseElement; &Re;
		"Re" => "\x13verseUpEquilibrium;\x03⥯\x11verseEquilibrium;\x03⇋\x0dverseElement;\x03∋\x01;\x03ℜ",
		"Rf" => "\x02r;\x03ℜ",                             // &Rfr;
		"Rh" => "\x02o;\x02Ρ",                             // &Rho;
		// &RightArrowLeftArrow; &RightDoubleBracket; &RightDownTeeVector; &RightDownVectorBar; &RightTriangleEqual; &RightAngleBracket; &RightUpDownVector; &RightTriangleBar; &RightUpTeeVector; &RightUpVectorBar; &RightDownVector; &RightTeeVector; &RightVectorBar; &RightArrowBar; &RightTeeArrow; &RightTriangle; &RightUpVector; &RightCeiling; &RightVector; &RightArrow; &RightFloor; &Rightarrow; &RightTee;
		"Ri" => "\x12ghtArrowLeftArrow;\x03⇄\x11ghtDoubleBracket;\x03⟧\x11ghtDownTeeVector;\x03⥝\x11ghtDownVectorBar;\x03⥕\x11ghtTriangleEqual;\x03⊵\x10ghtAngleBracket;\x03⟩\x10ghtUpDownVector;\x03⥏\x0fghtTriangleBar;\x03⧐\x0fghtUpTeeVector;\x03⥜\x0fghtUpVectorBar;\x03⥔\x0eghtDownVector;\x03⇂\x0dghtTeeVector;\x03⥛\x0dghtVectorBar;\x03⥓\x0cghtArrowBar;\x03⇥\x0cghtTeeArrow;\x03↦\x0cghtTriangle;\x03⊳\x0cghtUpVector;\x03↾\x0bghtCeiling;\x03⌉\x0aghtVector;\x03⇀\x09ghtArrow;\x03→\x09ghtFloor;\x03⌋\x09ghtarrow;\x03⇒\x07ghtTee;\x03⊢",
		"Ro" => "\x0bundImplies;\x03⥰\x03pf;\x03ℝ",        // &RoundImplies; &Ropf;
		"Rr" => "\x0aightarrow;\x03⇛",                     // &Rrightarrow;
		"Rs" => "\x03cr;\x03ℛ\x02h;\x03↱",                 // &Rscr; &Rsh;
		"Ru" => "\x0aleDelayed;\x03⧴",                     // &RuleDelayed;
		"SH" => "\x05CHcy;\x02Щ\x03cy;\x02Ш",              // &SHCHcy; &SHcy;
		"SO" => "\x05FTcy;\x02Ь",                          // &SOFTcy;
		"Sa" => "\x05cute;\x02Ś",                          // &Sacute;
		// &Scaron; &Scedil; &Scirc; &Scy; &Sc;
		"Sc" => "\x05aron;\x02Š\x05edil;\x02Ş\x04irc;\x02Ŝ\x02y;\x02С\x01;\x03⪼",
		"Sf" => "\x02r;\x04𝔖",                             // &Sfr;
		// &ShortRightArrow; &ShortDownArrow; &ShortLeftArrow; &ShortUpArrow;
		"Sh" => "\x0eortRightArrow;\x03→\x0dortDownArrow;\x03↓\x0dortLeftArrow;\x03←\x0bortUpArrow;\x03↑",
		"Si" => "\x04gma;\x02Σ",                           // &Sigma;
		"Sm" => "\x0aallCircle;\x03∘",                     // &SmallCircle;
		"So" => "\x03pf;\x04𝕊",                            // &Sopf;
		// &SquareSupersetEqual; &SquareIntersection; &SquareSubsetEqual; &SquareSuperset; &SquareSubset; &SquareUnion; &Square; &Sqrt;
		"Sq" => "\x12uareSupersetEqual;\x03⊒\x11uareIntersection;\x03⊓\x10uareSubsetEqual;\x03⊑\x0duareSuperset;\x03⊐\x0buareSubset;\x03⊏\x0auareUnion;\x03⊔\x05uare;\x03□\x03rt;\x03√",
		"Ss" => "\x03cr;\x04𝒮",                            // &Sscr;
		"St" => "\x03ar;\x03⋆",                            // &Star;
		// &SucceedsSlantEqual; &SucceedsEqual; &SucceedsTilde; &SupersetEqual; &SubsetEqual; &Succeeds; &SuchThat; &Superset; &Subset; &Supset; &Sub; &Sum; &Sup;
		"Su" => "\x11cceedsSlantEqual;\x03≽\x0ccceedsEqual;\x03⪰\x0ccceedsTilde;\x03≿\x0cpersetEqual;\x03⊇\x0absetEqual;\x03⊆\x07cceeds;\x03≻\x07chThat;\x03∋\x07perset;\x03⊃\x05bset;\x03⋐\x05pset;\x03⋑\x02b;\x03⋐\x02m;\x03∑\x02p;\x03⋑",
		"TH" => "\x04ORN;\x02Þ\x03ORN\x02Þ",               // &THORN; &THORN
		"TR" => "\x04ADE;\x03™",                           // &TRADE;
		"TS" => "\x04Hcy;\x02Ћ\x03cy;\x02Ц",               // &TSHcy; &TScy;
		"Ta" => "\x02b;\x01\u{09}\x02u;\x02Τ",             // &Tab; &Tau;
		"Tc" => "\x05aron;\x02Ť\x05edil;\x02Ţ\x02y;\x02Т", // &Tcaron; &Tcedil; &Tcy;
		"Tf" => "\x02r;\x04𝔗",                             // &Tfr;
		// &ThickSpace; &Therefore; &ThinSpace; &Theta;
		"Th" => "\x09ickSpace;\x06  \x08erefore;\x03∴\x08inSpace;\x03 \x04eta;\x02Θ",
		// &TildeFullEqual; &TildeEqual; &TildeTilde; &Tilde;
		"Ti" => "\x0dldeFullEqual;\x03≅\x09ldeEqual;\x03≃\x09ldeTilde;\x03≈\x04lde;\x03∼",
		"To" => "\x03pf;\x04𝕋",                            // &Topf;
		"Tr" => "\x08ipleDot;\x03⃛",                       // &TripleDot;
		"Ts" => "\x05trok;\x02Ŧ\x03cr;\x04𝒯",              // &Tstrok; &Tscr;
		// &Uarrocir; &Uacute; &Uacute &Uarr;
		"Ua" => "\x07rrocir;\x03⥉\x05cute;\x02Ú\x04cute\x02Ú\x03rr;\x03↟",
		"Ub" => "\x05reve;\x02Ŭ\x04rcy;\x02Ў",             // &Ubreve; &Ubrcy;
		"Uc" => "\x04irc;\x02Û\x03irc\x02Û\x02y;\x02У",    // &Ucirc; &Ucirc &Ucy;
		"Ud" => "\x05blac;\x02Ű",                          // &Udblac;
		"Uf" => "\x02r;\x04𝔘",                             // &Ufr;
		"Ug" => "\x05rave;\x02Ù\x04rave\x02Ù",             // &Ugrave; &Ugrave
		"Um" => "\x04acr;\x02Ū",                           // &Umacr;
		// &UnderParenthesis; &UnderBracket; &UnderBrace; &UnionPlus; &UnderBar; &Union;
		"Un" => "\x0fderParenthesis;\x03⏝\x0bderBracket;\x03⎵\x09derBrace;\x03⏟\x08ionPlus;\x03⊎\x07derBar;\x01_\x04ion;\x03⋃",
		"Uo" => "\x04gon;\x02Ų\x03pf;\x04𝕌",               // &Uogon; &Uopf;
		// &UpArrowDownArrow; &UpperRightArrow; &UpperLeftArrow; &UpEquilibrium; &UpDownArrow; &Updownarrow; &UpArrowBar; &UpTeeArrow; &UpArrow; &Uparrow; &Upsilon; &UpTee; &Upsi;
		"Up" => "\x0fArrowDownArrow;\x03⇅\x0eperRightArrow;\x03↗\x0dperLeftArrow;\x03↖\x0cEquilibrium;\x03⥮\x0aDownArrow;\x03↕\x0adownarrow;\x03⇕\x09ArrowBar;\x03⤒\x09TeeArrow;\x03↥\x06Arrow;\x03↑\x06arrow;\x03⇑\x06silon;\x02Υ\x04Tee;\x03⊥\x03si;\x02ϒ",
		"Ur" => "\x04ing;\x02Ů",                           // &Uring;
		"Us" => "\x03cr;\x04𝒰",                            // &Uscr;
		"Ut" => "\x05ilde;\x02Ũ",                          // &Utilde;
		"Uu" => "\x03ml;\x02Ü\x02ml\x02Ü",                 // &Uuml; &Uuml
		"VD" => "\x04ash;\x03⊫",                           // &VDash;
		"Vb" => "\x03ar;\x03⫫",                            // &Vbar;
		"Vc" => "\x02y;\x02В",                             // &Vcy;
		"Vd" => "\x05ashl;\x03⫦\x04ash;\x03⊩",             // &Vdashl; &Vdash;
		// &VerticalSeparator; &VerticalTilde; &VeryThinSpace; &VerticalLine; &VerticalBar; &Verbar; &Vert; &Vee;
		"Ve" => "\x10rticalSeparator;\x03❘\x0crticalTilde;\x03≀\x0cryThinSpace;\x03 \x0brticalLine;\x01|\x0articalBar;\x03∣\x05rbar;\x03‖\x03rt;\x03‖\x02e;\x03⋁",
		"Vf" => "\x02r;\x04𝔙",                             // &Vfr;
		"Vo" => "\x03pf;\x04𝕍",                            // &Vopf;
		"Vs" => "\x03cr;\x04𝒱",                            // &Vscr;
		"Vv" => "\x05dash;\x03⊪",                          // &Vvdash;
		"Wc" => "\x04irc;\x02Ŵ",                           // &Wcirc;
		"We" => "\x04dge;\x03⋀",                           // &Wedge;
		"Wf" => "\x02r;\x04𝔚",                             // &Wfr;
		"Wo" => "\x03pf;\x04𝕎",                            // &Wopf;
		"Ws" => "\x03cr;\x04𝒲",                            // &Wscr;
		"Xf" => "\x02r;\x04𝔛",                             // &Xfr;
		"Xi" => "\x01;\x02Ξ",                              // &Xi;
		"Xo" => "\x03pf;\x04𝕏",                            // &Xopf;
		"Xs" => "\x03cr;\x04𝒳",                            // &Xscr;
		"YA" => "\x03cy;\x02Я",                            // &YAcy;
		"YI" => "\x03cy;\x02Ї",                            // &YIcy;
		"YU" => "\x03cy;\x02Ю",                            // &YUcy;
		"Ya" => "\x05cute;\x02Ý\x04cute\x02Ý",             // &Yacute; &Yacute
		"Yc" => "\x04irc;\x02Ŷ\x02y;\x02Ы",                // &Ycirc; &Ycy;
		"Yf" => "\x02r;\x04𝔜",                             // &Yfr;
		"Yo" => "\x03pf;\x04𝕐",                            // &Yopf;
		"Ys" => "\x03cr;\x04𝒴",                            // &Yscr;
		"Yu" => "\x03ml;\x02Ÿ",                            // &Yuml;
		"ZH" => "\x03cy;\x02Ж",                            // &ZHcy;
		"Za" => "\x05cute;\x02Ź",                          // &Zacute;
		"Zc" => "\x05aron;\x02Ž\x02y;\x02З",               // &Zcaron; &Zcy;
		"Zd" => "\x03ot;\x02Ż",                            // &Zdot;
		// &ZeroWidthSpace; &Zeta;
		"Ze" => "\x0droWidthSpace;\x03\u{200B}\x03ta;\x02Ζ",
		"Zf" => "\x02r;\x03ℨ",                             // &Zfr;
		"Zo" => "\x03pf;\x03ℤ",                            // &Zopf;
		"Zs" => "\x03cr;\x04𝒵",                            // &Zscr;
		"aa" => "\x05cute;\x02á\x04cute\x02á",             // &aacute; &aacute
		"ab" => "\x05reve;\x02ă",                          // &abreve;
		// &acirc; &acute; &acirc &acute &acE; &acd; &acy; &ac;
		"ac" => "\x04irc;\x02â\x04ute;\x02´\x03irc\x02â\x03ute\x02´\x02E;\x05∾̳\x02d;\x03∿\x02y;\x02а\x01;\x03∾",
		"ae" => "\x04lig;\x02æ\x03lig\x02æ",               // &aelig; &aelig
		"af" => "\x02r;\x04𝔞\x01;\x03\u{2061}",            // &afr; &af;
		"ag" => "\x05rave;\x02à\x04rave\x02à",             // &agrave; &agrave
		// &alefsym; &aleph; &alpha;
		"al" => "\x06efsym;\x03ℵ\x04eph;\x03ℵ\x04pha;\x02α",
		// &amacr; &amalg; &amp; &amp
		"am" => "\x04acr;\x02ā\x04alg;\x03⨿\x02p;\x01&\x01p\x01&",
		// &andslope; &angmsdaa; &angmsdab; &angmsdac; &angmsdad; &angmsdae; &angmsdaf; &angmsdag; &angmsdah; &angrtvbd; &angrtvb; &angzarr; &andand; &angmsd; &angsph; &angle; &angrt; &angst; &andd; &andv; &ange; &and; &ang;
		"an" => "\x07dslope;\x03⩘\x07gmsdaa;\x03⦨\x07gmsdab;\x03⦩\x07gmsdac;\x03⦪\x07gmsdad;\x03⦫\x07gmsdae;\x03⦬\x07gmsdaf;\x03⦭\x07gmsdag;\x03⦮\x07gmsdah;\x03⦯\x07grtvbd;\x03⦝\x06grtvb;\x03⊾\x06gzarr;\x03⍼\x05dand;\x03⩕\x05gmsd;\x03∡\x05gsph;\x03∢\x04gle;\x03∠\x04grt;\x03∟\x04gst;\x02Å\x03dd;\x03⩜\x03dv;\x03⩚\x03ge;\x03⦤\x02d;\x03∧\x02g;\x03∠",
		"ao" => "\x04gon;\x02ą\x03pf;\x04𝕒",               // &aogon; &aopf;
		// &approxeq; &apacir; &approx; &apid; &apos; &apE; &ape; &ap;
		"ap" => "\x07proxeq;\x03≊\x05acir;\x03⩯\x05prox;\x03≈\x03id;\x03≋\x03os;\x01'\x02E;\x03⩰\x02e;\x03≊\x01;\x03≈",
		"ar" => "\x04ing;\x02å\x03ing\x02å",               // &aring; &aring
		// &asympeq; &asymp; &ascr; &ast;
		"as" => "\x06ympeq;\x03≍\x04ymp;\x03≈\x03cr;\x04𝒶\x02t;\x01*",
		"at" => "\x05ilde;\x02ã\x04ilde\x02ã",             // &atilde; &atilde
		"au" => "\x03ml;\x02ä\x02ml\x02ä",                 // &auml; &auml
		"aw" => "\x07conint;\x03∳\x04int;\x03⨑",           // &awconint; &awint;
		"bN" => "\x03ot;\x03⫭",                            // &bNot;
		// &backepsilon; &backprime; &backsimeq; &backcong; &barwedge; &backsim; &barvee; &barwed;
		"ba" => "\x0ackepsilon;\x02϶\x08ckprime;\x03‵\x08cksimeq;\x03⋍\x07ckcong;\x03≌\x07rwedge;\x03⌅\x06cksim;\x03∽\x05rvee;\x03⊽\x05rwed;\x03⌅",
		"bb" => "\x07rktbrk;\x03⎶\x03rk;\x03⎵",            // &bbrktbrk; &bbrk;
		"bc" => "\x04ong;\x03≌\x02y;\x02б",                // &bcong; &bcy;
		"bd" => "\x04quo;\x03„",                           // &bdquo;
		// &because; &bemptyv; &between; &becaus; &bernou; &bepsi; &beta; &beth;
		"be" => "\x06cause;\x03∵\x06mptyv;\x03⦰\x06tween;\x03≬\x05caus;\x03∵\x05rnou;\x03ℬ\x04psi;\x02϶\x03ta;\x02β\x03th;\x03ℶ",
		"bf" => "\x02r;\x04𝔟",                             // &bfr;
		// &bigtriangledown; &bigtriangleup; &bigotimes; &bigoplus; &bigsqcup; &biguplus; &bigwedge; &bigcirc; &bigodot; &bigstar; &bigcap; &bigcup; &bigvee;
		"bi" => "\x0egtriangledown;\x03▽\x0cgtriangleup;\x03△\x08gotimes;\x03⨂\x07goplus;\x03⨁\x07gsqcup;\x03⨆\x07guplus;\x03⨄\x07gwedge;\x03⋀\x06gcirc;\x03◯\x06godot;\x03⨀\x06gstar;\x03★\x05gcap;\x03⋂\x05gcup;\x03⋃\x05gvee;\x03⋁",
		"bk" => "\x05arow;\x03⤍",                          // &bkarow;
		// &blacktriangleright; &blacktriangledown; &blacktriangleleft; &blacktriangle; &blacklozenge; &blacksquare; &blank; &blk12; &blk14; &blk34; &block;
		"bl" => "\x11acktriangleright;\x03▸\x10acktriangledown;\x03▾\x10acktriangleleft;\x03◂\x0cacktriangle;\x03▴\x0backlozenge;\x03⧫\x0aacksquare;\x03▪\x04ank;\x03␣\x04k12;\x03▒\x04k14;\x03░\x04k34;\x03▓\x04ock;\x03█",
		"bn" => "\x06equiv;\x06≡⃥\x03ot;\x03⌐\x02e;\x04=⃥",// &bnequiv; &bnot; &bne;
		// &boxminus; &boxtimes; &boxplus; &bottom; &bowtie; &boxbox; &boxDL; &boxDR; &boxDl; &boxDr; &boxHD; &boxHU; &boxHd; &boxHu; &boxUL; &boxUR; &boxUl; &boxUr; &boxVH; &boxVL; &boxVR; &boxVh; &boxVl; &boxVr; &boxdL; &boxdR; &boxdl; &boxdr; &boxhD; &boxhU; &boxhd; &boxhu; &boxuL; &boxuR; &boxul; &boxur; &boxvH; &boxvL; &boxvR; &boxvh; &boxvl; &boxvr; &bopf; &boxH; &boxV; &boxh; &boxv; &bot;
		"bo" => "\x07xminus;\x03⊟\x07xtimes;\x03⊠\x06xplus;\x03⊞\x05ttom;\x03⊥\x05wtie;\x03⋈\x05xbox;\x03⧉\x04xDL;\x03╗\x04xDR;\x03╔\x04xDl;\x03╖\x04xDr;\x03╓\x04xHD;\x03╦\x04xHU;\x03╩\x04xHd;\x03╤\x04xHu;\x03╧\x04xUL;\x03╝\x04xUR;\x03╚\x04xUl;\x03╜\x04xUr;\x03╙\x04xVH;\x03╬\x04xVL;\x03╣\x04xVR;\x03╠\x04xVh;\x03╫\x04xVl;\x03╢\x04xVr;\x03╟\x04xdL;\x03╕\x04xdR;\x03╒\x04xdl;\x03┐\x04xdr;\x03┌\x04xhD;\x03╥\x04xhU;\x03╨\x04xhd;\x03┬\x04xhu;\x03┴\x04xuL;\x03╛\x04xuR;\x03╘\x04xul;\x03┘\x04xur;\x03└\x04xvH;\x03╪\x04xvL;\x03╡\x04xvR;\x03╞\x04xvh;\x03┼\x04xvl;\x03┤\x04xvr;\x03├\x03pf;\x04𝕓\x03xH;\x03═\x03xV;\x03║\x03xh;\x03─\x03xv;\x03│\x02t;\x03⊥",
		"bp" => "\x05rime;\x03‵",                          // &bprime;
		// &brvbar; &breve; &brvbar
		"br" => "\x05vbar;\x02¦\x04eve;\x02˘\x04vbar\x02¦",
		// &bsolhsub; &bsemi; &bsime; &bsolb; &bscr; &bsim; &bsol;
		"bs" => "\x07olhsub;\x03⟈\x04emi;\x03⁏\x04ime;\x03⋍\x04olb;\x03⧅\x03cr;\x04𝒷\x03im;\x03∽\x03ol;\x01\\",
		// &bullet; &bumpeq; &bumpE; &bumpe; &bull; &bump;
		"bu" => "\x05llet;\x03•\x05mpeq;\x03≏\x04mpE;\x03⪮\x04mpe;\x03≏\x03ll;\x03•\x03mp;\x03≎",
		// &capbrcup; &cacute; &capand; &capcap; &capcup; &capdot; &caret; &caron; &caps; &cap;
		"ca" => "\x07pbrcup;\x03⩉\x05cute;\x02ć\x05pand;\x03⩄\x05pcap;\x03⩋\x05pcup;\x03⩇\x05pdot;\x03⩀\x04ret;\x03⁁\x04ron;\x02ˇ\x03ps;\x06∩︀\x02p;\x03∩",
		// &ccupssm; &ccaron; &ccedil; &ccaps; &ccedil &ccirc; &ccups;
		"cc" => "\x06upssm;\x03⩐\x05aron;\x02č\x05edil;\x02ç\x04aps;\x03⩍\x04edil\x02ç\x04irc;\x02ĉ\x04ups;\x03⩌",
		"cd" => "\x03ot;\x02ċ",                            // &cdot;
		// &centerdot; &cemptyv; &cedil; &cedil &cent; &cent
		"ce" => "\x08nterdot;\x02·\x06mptyv;\x03⦲\x04dil;\x02¸\x03dil\x02¸\x03nt;\x02¢\x02nt\x02¢",
		"cf" => "\x02r;\x04𝔠",                             // &cfr;
		// &checkmark; &check; &chcy; &chi;
		"ch" => "\x08eckmark;\x03✓\x04eck;\x03✓\x03cy;\x02ч\x02i;\x02χ",
		// &circlearrowright; &circlearrowleft; &circledcirc; &circleddash; &circledast; &circledR; &circledS; &cirfnint; &cirscir; &circeq; &cirmid; &cirE; &circ; &cire; &cir;
		"ci" => "\x0frclearrowright;\x03↻\x0erclearrowleft;\x03↺\x0arcledcirc;\x03⊚\x0arcleddash;\x03⊝\x09rcledast;\x03⊛\x07rcledR;\x02®\x07rcledS;\x03Ⓢ\x07rfnint;\x03⨐\x06rscir;\x03⧂\x05rceq;\x03≗\x05rmid;\x03⫯\x03rE;\x03⧃\x03rc;\x02ˆ\x03re;\x03≗\x02r;\x03○",
		"cl" => "\x07ubsuit;\x03♣\x04ubs;\x03♣",           // &clubsuit; &clubs;
		// &complement; &complexes; &coloneq; &congdot; &colone; &commat; &compfn; &conint; &coprod; &copysr; &colon; &comma; &comp; &cong; &copf; &copy; &copy
		"co" => "\x09mplement;\x03∁\x08mplexes;\x03ℂ\x06loneq;\x03≔\x06ngdot;\x03⩭\x05lone;\x03≔\x05mmat;\x01@\x05mpfn;\x03∘\x05nint;\x03∮\x05prod;\x03∐\x05pysr;\x03℗\x04lon;\x01:\x04mma;\x01,\x03mp;\x03∁\x03ng;\x03≅\x03pf;\x04𝕔\x03py;\x02©\x02py\x02©",
		"cr" => "\x04arr;\x03↵\x04oss;\x03✗",              // &crarr; &cross;
		// &csube; &csupe; &cscr; &csub; &csup;
		"cs" => "\x04ube;\x03⫑\x04upe;\x03⫒\x03cr;\x04𝒸\x03ub;\x03⫏\x03up;\x03⫐",
		"ct" => "\x04dot;\x03⋯",                           // &ctdot;
		// &curvearrowright; &curvearrowleft; &curlyeqprec; &curlyeqsucc; &curlywedge; &cupbrcap; &curlyvee; &cudarrl; &cudarrr; &cularrp; &curarrm; &cularr; &cupcap; &cupcup; &cupdot; &curarr; &curren; &cuepr; &cuesc; &cupor; &curren &cuvee; &cuwed; &cups; &cup;
		"cu" => "\x0ervearrowright;\x03↷\x0drvearrowleft;\x03↶\x0arlyeqprec;\x03⋞\x0arlyeqsucc;\x03⋟\x09rlywedge;\x03⋏\x07pbrcap;\x03⩈\x07rlyvee;\x03⋎\x06darrl;\x03⤸\x06darrr;\x03⤵\x06larrp;\x03⤽\x06rarrm;\x03⤼\x05larr;\x03↶\x05pcap;\x03⩆\x05pcup;\x03⩊\x05pdot;\x03⊍\x05rarr;\x03↷\x05rren;\x02¤\x04epr;\x03⋞\x04esc;\x03⋟\x04por;\x03⩅\x04rren\x02¤\x04vee;\x03⋎\x04wed;\x03⋏\x03ps;\x06∪︀\x02p;\x03∪",
		"cw" => "\x07conint;\x03∲\x04int;\x03∱",           // &cwconint; &cwint;
		"cy" => "\x05lcty;\x03⌭",                          // &cylcty;
		"dA" => "\x03rr;\x03⇓",                            // &dArr;
		"dH" => "\x03ar;\x03⥥",                            // &dHar;
		// &dagger; &daleth; &dashv; &darr; &dash;
		"da" => "\x05gger;\x03†\x05leth;\x03ℸ\x04shv;\x03⊣\x03rr;\x03↓\x03sh;\x03‐",
		"db" => "\x06karow;\x03⤏\x04lac;\x02˝",            // &dbkarow; &dblac;
		"dc" => "\x05aron;\x02ď\x02y;\x02д",               // &dcaron; &dcy;
		// &ddagger; &ddotseq; &ddarr; &dd;
		"dd" => "\x06agger;\x03‡\x06otseq;\x03⩷\x04arr;\x03⇊\x01;\x03ⅆ",
		// &demptyv; &delta; &deg; &deg
		"de" => "\x06mptyv;\x03⦱\x04lta;\x02δ\x02g;\x02°\x01g\x02°",
		"df" => "\x05isht;\x03⥿\x02r;\x04𝔡",               // &dfisht; &dfr;
		"dh" => "\x04arl;\x03⇃\x04arr;\x03⇂",              // &dharl; &dharr;
		// &divideontimes; &diamondsuit; &diamond; &digamma; &divide; &divonx; &diams; &disin; &divide &diam; &die; &div;
		"di" => "\x0cvideontimes;\x03⋇\x0aamondsuit;\x03♦\x06amond;\x03⋄\x06gamma;\x02ϝ\x05vide;\x02÷\x05vonx;\x03⋇\x04ams;\x03♦\x04sin;\x03⋲\x04vide\x02÷\x03am;\x03⋄\x02e;\x02¨\x02v;\x02÷",
		"dj" => "\x03cy;\x02ђ",                            // &djcy;
		"dl" => "\x05corn;\x03⌞\x05crop;\x03⌍",            // &dlcorn; &dlcrop;
		// &downharpoonright; &downharpoonleft; &doublebarwedge; &downdownarrows; &dotsquare; &downarrow; &doteqdot; &dotminus; &dotplus; &dollar; &doteq; &dopf; &dot;
		"do" => "\x0fwnharpoonright;\x03⇂\x0ewnharpoonleft;\x03⇃\x0dublebarwedge;\x03⌆\x0dwndownarrows;\x03⇊\x08tsquare;\x03⊡\x08wnarrow;\x03↓\x07teqdot;\x03≑\x07tminus;\x03∸\x06tplus;\x03∔\x05llar;\x01$\x04teq;\x03≐\x03pf;\x04𝕕\x02t;\x02˙",
		// &drbkarow; &drcorn; &drcrop;
		"dr" => "\x07bkarow;\x03⤐\x05corn;\x03⌟\x05crop;\x03⌌",
		// &dstrok; &dscr; &dscy; &dsol;
		"ds" => "\x05trok;\x02đ\x03cr;\x04𝒹\x03cy;\x02ѕ\x03ol;\x03⧶",
		"dt" => "\x04dot;\x03⋱\x04rif;\x03▾\x03ri;\x03▿",  // &dtdot; &dtrif; &dtri;
		"du" => "\x04arr;\x03⇵\x04har;\x03⥯",              // &duarr; &duhar;
		"dw" => "\x06angle;\x03⦦",                         // &dwangle;
		"dz" => "\x07igrarr;\x03⟿\x03cy;\x02џ",            // &dzigrarr; &dzcy;
		"eD" => "\x04Dot;\x03⩷\x03ot;\x03≑",               // &eDDot; &eDot;
		// &eacute; &easter; &eacute
		"ea" => "\x05cute;\x02é\x05ster;\x03⩮\x04cute\x02é",
		// &ecaron; &ecolon; &ecirc; &ecir; &ecirc &ecy;
		"ec" => "\x05aron;\x02ě\x05olon;\x03≕\x04irc;\x02ê\x03ir;\x03≖\x03irc\x02ê\x02y;\x02э",
		"ed" => "\x03ot;\x02ė",                            // &edot;
		"ee" => "\x01;\x03ⅇ",                              // &ee;
		"ef" => "\x04Dot;\x03≒\x02r;\x04𝔢",                // &efDot; &efr;
		// &egrave; &egsdot; &egrave &egs; &eg;
		"eg" => "\x05rave;\x02è\x05sdot;\x03⪘\x04rave\x02è\x02s;\x03⪖\x01;\x03⪚",
		// &elinters; &elsdot; &ell; &els; &el;
		"el" => "\x07inters;\x03⏧\x05sdot;\x03⪗\x02l;\x03ℓ\x02s;\x03⪕\x01;\x03⪙",
		// &emptyset; &emptyv; &emsp13; &emsp14; &emacr; &empty; &emsp;
		"em" => "\x07ptyset;\x03∅\x05ptyv;\x03∅\x05sp13;\x03 \x05sp14;\x03 \x04acr;\x02ē\x04pty;\x03∅\x03sp;\x03 ",
		"en" => "\x03sp;\x03 \x02g;\x02ŋ",                 // &ensp; &eng;
		"eo" => "\x04gon;\x02ę\x03pf;\x04𝕖",               // &eogon; &eopf;
		// &epsilon; &eparsl; &eplus; &epsiv; &epar; &epsi;
		"ep" => "\x06silon;\x02ε\x05arsl;\x03⧣\x04lus;\x03⩱\x04siv;\x02ϵ\x03ar;\x03⋕\x03si;\x02ε",
		// &eqslantless; &eqslantgtr; &eqvparsl; &eqcolon; &equivDD; &eqcirc; &equals; &equest; &eqsim; &equiv;
		"eq" => "\x0aslantless;\x03⪕\x09slantgtr;\x03⪖\x07vparsl;\x03⧥\x06colon;\x03≕\x06uivDD;\x03⩸\x05circ;\x03≖\x05uals;\x01=\x05uest;\x03≟\x04sim;\x03≂\x04uiv;\x03≡",
		"er" => "\x04Dot;\x03≓\x04arr;\x03⥱",              // &erDot; &erarr;
		"es" => "\x04dot;\x03≐\x03cr;\x03ℯ\x03im;\x03≂",   // &esdot; &escr; &esim;
		"et" => "\x02a;\x02η\x02h;\x02ð\x01h\x02ð",        // &eta; &eth; &eth
		"eu" => "\x03ml;\x02ë\x03ro;\x03€\x02ml\x02ë",     // &euml; &euro; &euml
		// &exponentiale; &expectation; &exist; &excl;
		"ex" => "\x0bponentiale;\x03ⅇ\x0apectation;\x03ℰ\x04ist;\x03∃\x03cl;\x01!",
		"fa" => "\x0cllingdotseq;\x03≒",                   // &fallingdotseq;
		"fc" => "\x02y;\x02ф",                             // &fcy;
		"fe" => "\x05male;\x03♀",                          // &female;
		// &ffilig; &ffllig; &fflig; &ffr;
		"ff" => "\x05ilig;\x03ﬃ\x05llig;\x03ﬄ\x04lig;\x03ﬀ\x02r;\x04𝔣",
		"fi" => "\x04lig;\x03ﬁ",                           // &filig;
		"fj" => "\x04lig;\x02fj",                          // &fjlig;
		"fl" => "\x04lig;\x03ﬂ\x04tns;\x03▱\x03at;\x03♭",  // &fllig; &fltns; &flat;
		"fn" => "\x03of;\x02ƒ",                            // &fnof;
		// &forall; &forkv; &fopf; &fork;
		"fo" => "\x05rall;\x03∀\x04rkv;\x03⫙\x03pf;\x04𝕗\x03rk;\x03⋔",
		"fp" => "\x07artint;\x03⨍",                        // &fpartint;
		// &frac12; &frac13; &frac14; &frac15; &frac16; &frac18; &frac23; &frac25; &frac34; &frac35; &frac38; &frac45; &frac56; &frac58; &frac78; &frac12 &frac14 &frac34 &frasl; &frown;
		"fr" => "\x05ac12;\x02½\x05ac13;\x03⅓\x05ac14;\x02¼\x05ac15;\x03⅕\x05ac16;\x03⅙\x05ac18;\x03⅛\x05ac23;\x03⅔\x05ac25;\x03⅖\x05ac34;\x02¾\x05ac35;\x03⅗\x05ac38;\x03⅜\x05ac45;\x03⅘\x05ac56;\x03⅚\x05ac58;\x03⅝\x05ac78;\x03⅞\x04ac12\x02½\x04ac14\x02¼\x04ac34\x02¾\x04asl;\x03⁄\x04own;\x03⌢",
		"fs" => "\x03cr;\x04𝒻",                            // &fscr;
		"gE" => "\x02l;\x03⪌\x01;\x03≧",                   // &gEl; &gE;
		// &gacute; &gammad; &gamma; &gap;
		"ga" => "\x05cute;\x02ǵ\x05mmad;\x02ϝ\x04mma;\x02γ\x02p;\x03⪆",
		"gb" => "\x05reve;\x02ğ",                          // &gbreve;
		"gc" => "\x04irc;\x02ĝ\x02y;\x02г",                // &gcirc; &gcy;
		"gd" => "\x03ot;\x02ġ",                            // &gdot;
		// &geqslant; &gesdotol; &gesdoto; &gesdot; &gesles; &gescc; &geqq; &gesl; &gel; &geq; &ges; &ge;
		"ge" => "\x07qslant;\x03⩾\x07sdotol;\x03⪄\x06sdoto;\x03⪂\x05sdot;\x03⪀\x05sles;\x03⪔\x04scc;\x03⪩\x03qq;\x03≧\x03sl;\x06⋛︀\x02l;\x03⋛\x02q;\x03≥\x02s;\x03⩾\x01;\x03≥",
		"gf" => "\x02r;\x04𝔤",                             // &gfr;
		"gg" => "\x02g;\x03⋙\x01;\x03≫",                   // &ggg; &gg;
		"gi" => "\x04mel;\x03ℷ",                           // &gimel;
		"gj" => "\x03cy;\x02ѓ",                            // &gjcy;
		// &glE; &gla; &glj; &gl;
		"gl" => "\x02E;\x03⪒\x02a;\x03⪥\x02j;\x03⪤\x01;\x03≷",
		// &gnapprox; &gneqq; &gnsim; &gnap; &gneq; &gnE; &gne;
		"gn" => "\x07approx;\x03⪊\x04eqq;\x03≩\x04sim;\x03⋧\x03ap;\x03⪊\x03eq;\x03⪈\x02E;\x03≩\x02e;\x03⪈",
		"go" => "\x03pf;\x04𝕘",                            // &gopf;
		"gr" => "\x04ave;\x01`",                           // &grave;
		// &gsime; &gsiml; &gscr; &gsim;
		"gs" => "\x04ime;\x03⪎\x04iml;\x03⪐\x03cr;\x03ℊ\x03im;\x03≳",
		// &gtreqqless; &gtrapprox; &gtreqless; &gtquest; &gtrless; &gtlPar; &gtrarr; &gtrdot; &gtrsim; &gtcir; &gtdot; &gtcc; &gt; &gt
		"gt" => "\x09reqqless;\x03⪌\x08rapprox;\x03⪆\x08reqless;\x03⋛\x06quest;\x03⩼\x06rless;\x03≷\x05lPar;\x03⦕\x05rarr;\x03⥸\x05rdot;\x03⋗\x05rsim;\x03≳\x04cir;\x03⩺\x04dot;\x03⋗\x03cc;\x03⪧\x01;\x01>\x00\x01>",
		"gv" => "\x08ertneqq;\x06≩︀\x03nE;\x06≩︀",         // &gvertneqq; &gvnE;
		"hA" => "\x03rr;\x03⇔",                            // &hArr;
		// &harrcir; &hairsp; &hamilt; &hardcy; &harrw; &half; &harr;
		"ha" => "\x06rrcir;\x03⥈\x05irsp;\x03 \x05milt;\x03ℋ\x05rdcy;\x02ъ\x04rrw;\x03↭\x03lf;\x02½\x03rr;\x03↔",
		"hb" => "\x03ar;\x03ℏ",                            // &hbar;
		"hc" => "\x04irc;\x02ĥ",                           // &hcirc;
		// &heartsuit; &hearts; &hellip; &hercon;
		"he" => "\x08artsuit;\x03♥\x05arts;\x03♥\x05llip;\x03…\x05rcon;\x03⊹",
		"hf" => "\x02r;\x04𝔥",                             // &hfr;
		"hk" => "\x07searow;\x03⤥\x07swarow;\x03⤦",        // &hksearow; &hkswarow;
		// &hookrightarrow; &hookleftarrow; &homtht; &horbar; &hoarr; &hopf;
		"ho" => "\x0dokrightarrow;\x03↪\x0cokleftarrow;\x03↩\x05mtht;\x03∻\x05rbar;\x03―\x04arr;\x03⇿\x03pf;\x04𝕙",
		// &hslash; &hstrok; &hscr;
		"hs" => "\x05lash;\x03ℏ\x05trok;\x02ħ\x03cr;\x04𝒽",
		"hy" => "\x05bull;\x03⁃\x05phen;\x03‐",            // &hybull; &hyphen;
		"ia" => "\x05cute;\x02í\x04cute\x02í",             // &iacute; &iacute
		// &icirc; &icirc &icy; &ic;
		"ic" => "\x04irc;\x02î\x03irc\x02î\x02y;\x02и\x01;\x03\u{2063}",
		"ie" => "\x04xcl;\x02¡\x03cy;\x02е\x03xcl\x02¡",   // &iexcl; &iecy; &iexcl
		"if" => "\x02f;\x03⇔\x02r;\x04𝔦",                  // &iff; &ifr;
		"ig" => "\x05rave;\x02ì\x04rave\x02ì",             // &igrave; &igrave
		// &iiiint; &iinfin; &iiint; &iiota; &ii;
		"ii" => "\x05iint;\x03⨌\x05nfin;\x03⧜\x04int;\x03∭\x04ota;\x03℩\x01;\x03ⅈ",
		"ij" => "\x04lig;\x02ĳ",                           // &ijlig;
		// &imagline; &imagpart; &imacr; &image; &imath; &imped; &imof;
		"im" => "\x07agline;\x03ℐ\x07agpart;\x03ℑ\x04acr;\x02ī\x04age;\x03ℑ\x04ath;\x02ı\x04ped;\x02Ƶ\x03of;\x03⊷",
		// &infintie; &integers; &intercal; &intlarhk; &intprod; &incare; &inodot; &intcal; &infin; &int; &in;
		"in" => "\x07fintie;\x03⧝\x07tegers;\x03ℤ\x07tercal;\x03⊺\x07tlarhk;\x03⨗\x06tprod;\x03⨼\x05care;\x03℅\x05odot;\x02ı\x05tcal;\x03⊺\x04fin;\x03∞\x02t;\x03∫\x01;\x03∈",
		// &iogon; &iocy; &iopf; &iota;
		"io" => "\x04gon;\x02į\x03cy;\x02ё\x03pf;\x04𝕚\x03ta;\x02ι",
		"ip" => "\x04rod;\x03⨼",                           // &iprod;
		"iq" => "\x05uest;\x02¿\x04uest\x02¿",             // &iquest; &iquest
		// &isindot; &isinsv; &isinE; &isins; &isinv; &iscr; &isin;
		"is" => "\x06indot;\x03⋵\x05insv;\x03⋳\x04inE;\x03⋹\x04ins;\x03⋴\x04inv;\x03∈\x03cr;\x04𝒾\x03in;\x03∈",
		"it" => "\x05ilde;\x02ĩ\x01;\x03\u{2062}",         // &itilde; &it;
		"iu" => "\x04kcy;\x02і\x03ml;\x02ï\x02ml\x02ï",    // &iukcy; &iuml; &iuml
		"jc" => "\x04irc;\x02ĵ\x02y;\x02й",                // &jcirc; &jcy;
		"jf" => "\x02r;\x04𝔧",                             // &jfr;
		"jm" => "\x04ath;\x02ȷ",                           // &jmath;
		"jo" => "\x03pf;\x04𝕛",                            // &jopf;
		"js" => "\x05ercy;\x02ј\x03cr;\x04𝒿",              // &jsercy; &jscr;
		"ju" => "\x04kcy;\x02є",                           // &jukcy;
		"ka" => "\x05ppav;\x02ϰ\x04ppa;\x02κ",             // &kappav; &kappa;
		"kc" => "\x05edil;\x02ķ\x02y;\x02к",               // &kcedil; &kcy;
		"kf" => "\x02r;\x04𝔨",                             // &kfr;
		"kg" => "\x05reen;\x02ĸ",                          // &kgreen;
		"kh" => "\x03cy;\x02х",                            // &khcy;
		"kj" => "\x03cy;\x02ќ",                            // &kjcy;
		"ko" => "\x03pf;\x04𝕜",                            // &kopf;
		"ks" => "\x03cr;\x04𝓀",                            // &kscr;
		"lA" => "\x05tail;\x03⤛\x04arr;\x03⇚\x03rr;\x03⇐", // &lAtail; &lAarr; &lArr;
		"lB" => "\x04arr;\x03⤎",                           // &lBarr;
		"lE" => "\x02g;\x03⪋\x01;\x03≦",                   // &lEg; &lE;
		"lH" => "\x03ar;\x03⥢",                            // &lHar;
		// &laemptyv; &larrbfs; &larrsim; &lacute; &lagran; &lambda; &langle; &larrfs; &larrhk; &larrlp; &larrpl; &larrtl; &latail; &langd; &laquo; &larrb; &lates; &lang; &laquo &larr; &late; &lap; &lat;
		"la" => "\x07emptyv;\x03⦴\x06rrbfs;\x03⤟\x06rrsim;\x03⥳\x05cute;\x02ĺ\x05gran;\x03ℒ\x05mbda;\x02λ\x05ngle;\x03⟨\x05rrfs;\x03⤝\x05rrhk;\x03↩\x05rrlp;\x03↫\x05rrpl;\x03⤹\x05rrtl;\x03↢\x05tail;\x03⤙\x04ngd;\x03⦑\x04quo;\x02«\x04rrb;\x03⇤\x04tes;\x06⪭︀\x03ng;\x03⟨\x03quo\x02«\x03rr;\x03←\x03te;\x03⪭\x02p;\x03⪅\x02t;\x03⪫",
		// &lbrksld; &lbrkslu; &lbrace; &lbrack; &lbarr; &lbbrk; &lbrke;
		"lb" => "\x06rksld;\x03⦏\x06rkslu;\x03⦍\x05race;\x01{\x05rack;\x01[\x04arr;\x03⤌\x04brk;\x03❲\x04rke;\x03⦋",
		// &lcaron; &lcedil; &lceil; &lcub; &lcy;
		"lc" => "\x05aron;\x02ľ\x05edil;\x02ļ\x04eil;\x03⌈\x03ub;\x01{\x02y;\x02л",
		// &ldrushar; &ldrdhar; &ldquor; &ldquo; &ldca; &ldsh;
		"ld" => "\x07rushar;\x03⥋\x06rdhar;\x03⥧\x05quor;\x03„\x04quo;\x03“\x03ca;\x03⤶\x03sh;\x03↲",
		// &leftrightsquigarrow; &leftrightharpoons; &leftharpoondown; &leftrightarrows; &leftleftarrows; &leftrightarrow; &leftthreetimes; &leftarrowtail; &leftharpoonup; &lessapprox; &lesseqqgtr; &leftarrow; &lesseqgtr; &leqslant; &lesdotor; &lesdoto; &lessdot; &lessgtr; &lesssim; &lesdot; &lesges; &lescc; &leqq; &lesg; &leg; &leq; &les; &le;
		"le" => "\x12ftrightsquigarrow;\x03↭\x10ftrightharpoons;\x03⇋\x0eftharpoondown;\x03↽\x0eftrightarrows;\x03⇆\x0dftleftarrows;\x03⇇\x0dftrightarrow;\x03↔\x0dftthreetimes;\x03⋋\x0cftarrowtail;\x03↢\x0cftharpoonup;\x03↼\x09ssapprox;\x03⪅\x09sseqqgtr;\x03⪋\x08ftarrow;\x03←\x08sseqgtr;\x03⋚\x07qslant;\x03⩽\x07sdotor;\x03⪃\x06sdoto;\x03⪁\x06ssdot;\x03⋖\x06ssgtr;\x03≶\x06sssim;\x03≲\x05sdot;\x03⩿\x05sges;\x03⪓\x04scc;\x03⪨\x03qq;\x03≦\x03sg;\x06⋚︀\x02g;\x03⋚\x02q;\x03≤\x02s;\x03⩽\x01;\x03≤",
		"lf" => "\x05isht;\x03⥼\x05loor;\x03⌊\x02r;\x04𝔩", // &lfisht; &lfloor; &lfr;
		"lg" => "\x02E;\x03⪑\x01;\x03≶",                   // &lgE; &lg;
		// &lharul; &lhard; &lharu; &lhblk;
		"lh" => "\x05arul;\x03⥪\x04ard;\x03↽\x04aru;\x03↼\x04blk;\x03▄",
		"lj" => "\x03cy;\x02љ",                            // &ljcy;
		// &llcorner; &llhard; &llarr; &lltri; &ll;
		"ll" => "\x07corner;\x03⌞\x05hard;\x03⥫\x04arr;\x03⇇\x04tri;\x03◺\x01;\x03≪",
		// &lmoustache; &lmidot; &lmoust;
		"lm" => "\x09oustache;\x03⎰\x05idot;\x02ŀ\x05oust;\x03⎰",
		// &lnapprox; &lneqq; &lnsim; &lnap; &lneq; &lnE; &lne;
		"ln" => "\x07approx;\x03⪉\x04eqq;\x03≨\x04sim;\x03⋦\x03ap;\x03⪉\x03eq;\x03⪇\x02E;\x03≨\x02e;\x03⪇",
		// &longleftrightarrow; &longrightarrow; &looparrowright; &longleftarrow; &looparrowleft; &longmapsto; &lotimes; &lozenge; &loplus; &lowast; &lowbar; &loang; &loarr; &lobrk; &lopar; &lopf; &lozf; &loz;
		"lo" => "\x11ngleftrightarrow;\x03⟷\x0dngrightarrow;\x03⟶\x0doparrowright;\x03↬\x0cngleftarrow;\x03⟵\x0coparrowleft;\x03↫\x09ngmapsto;\x03⟼\x06times;\x03⨴\x06zenge;\x03◊\x05plus;\x03⨭\x05wast;\x03∗\x05wbar;\x01_\x04ang;\x03⟬\x04arr;\x03⇽\x04brk;\x03⟦\x04par;\x03⦅\x03pf;\x04𝕝\x03zf;\x03⧫\x02z;\x03◊",
		"lp" => "\x05arlt;\x03⦓\x03ar;\x01(",              // &lparlt; &lpar;
		// &lrcorner; &lrhard; &lrarr; &lrhar; &lrtri; &lrm;
		"lr" => "\x07corner;\x03⌟\x05hard;\x03⥭\x04arr;\x03⇆\x04har;\x03⇋\x04tri;\x03⊿\x02m;\x03\u{200E}",
		// &lsaquo; &lsquor; &lstrok; &lsime; &lsimg; &lsquo; &lscr; &lsim; &lsqb; &lsh;
		"ls" => "\x05aquo;\x03‹\x05quor;\x03‚\x05trok;\x02ł\x04ime;\x03⪍\x04img;\x03⪏\x04quo;\x03‘\x03cr;\x04𝓁\x03im;\x03≲\x03qb;\x01[\x02h;\x03↰",
		// &ltquest; &lthree; &ltimes; &ltlarr; &ltrPar; &ltcir; &ltdot; &ltrie; &ltrif; &ltcc; &ltri; &lt; &lt
		"lt" => "\x06quest;\x03⩻\x05hree;\x03⋋\x05imes;\x03⋉\x05larr;\x03⥶\x05rPar;\x03⦖\x04cir;\x03⩹\x04dot;\x03⋖\x04rie;\x03⊴\x04rif;\x03◂\x03cc;\x03⪦\x03ri;\x03◃\x01;\x01<\x00\x01<",
		"lu" => "\x07rdshar;\x03⥊\x06ruhar;\x03⥦",         // &lurdshar; &luruhar;
		"lv" => "\x08ertneqq;\x06≨︀\x03nE;\x06≨︀",         // &lvertneqq; &lvnE;
		"mD" => "\x04Dot;\x03∺",                           // &mDDot;
		// &mapstodown; &mapstoleft; &mapstoup; &maltese; &mapsto; &marker; &macr; &male; &malt; &macr &map;
		"ma" => "\x09pstodown;\x03↧\x09pstoleft;\x03↤\x07pstoup;\x03↥\x06ltese;\x03✠\x05psto;\x03↦\x05rker;\x03▮\x03cr;\x02¯\x03le;\x03♂\x03lt;\x03✠\x02cr\x02¯\x02p;\x03↦",
		"mc" => "\x05omma;\x03⨩\x02y;\x02м",               // &mcomma; &mcy;
		"md" => "\x04ash;\x03—",                           // &mdash;
		"me" => "\x0casuredangle;\x03∡",                   // &measuredangle;
		"mf" => "\x02r;\x04𝔪",                             // &mfr;
		"mh" => "\x02o;\x03℧",                             // &mho;
		// &minusdu; &midast; &midcir; &middot; &minusb; &minusd; &micro; &middot &minus; &micro &mid;
		"mi" => "\x06nusdu;\x03⨪\x05dast;\x01*\x05dcir;\x03⫰\x05ddot;\x02·\x05nusb;\x03⊟\x05nusd;\x03∸\x04cro;\x02µ\x04ddot\x02·\x04nus;\x03−\x03cro\x02µ\x02d;\x03∣",
		"ml" => "\x03cp;\x03⫛\x03dr;\x03…",                // &mlcp; &mldr;
		"mn" => "\x05plus;\x03∓",                          // &mnplus;
		"mo" => "\x05dels;\x03⊧\x03pf;\x04𝕞",              // &models; &mopf;
		"mp" => "\x01;\x03∓",                              // &mp;
		"ms" => "\x05tpos;\x03∾\x03cr;\x04𝓂",              // &mstpos; &mscr;
		"mu" => "\x07ltimap;\x03⊸\x04map;\x03⊸\x01;\x02μ", // &multimap; &mumap; &mu;
		"nG" => "\x03tv;\x05≫̸\x02g;\x05⋙̸\x02t;\x06≫⃒",   // &nGtv; &nGg; &nGt;
		// &nLeftrightarrow; &nLeftarrow; &nLtv; &nLl; &nLt;
		"nL" => "\x0eeftrightarrow;\x03⇎\x09eftarrow;\x03⇍\x03tv;\x05≪̸\x02l;\x05⋘̸\x02t;\x06≪⃒",
		"nR" => "\x0aightarrow;\x03⇏",                     // &nRightarrow;
		"nV" => "\x05Dash;\x03⊯\x05dash;\x03⊮",            // &nVDash; &nVdash;
		// &naturals; &napprox; &natural; &nacute; &nabla; &napid; &napos; &natur; &nang; &napE; &nap;
		"na" => "\x07turals;\x03ℕ\x06pprox;\x03≉\x06tural;\x03♮\x05cute;\x02ń\x04bla;\x03∇\x04pid;\x05≋̸\x04pos;\x02ŉ\x04tur;\x03♮\x03ng;\x06∠⃒\x03pE;\x05⩰̸\x02p;\x03≉",
		// &nbumpe; &nbump; &nbsp; &nbsp
		"nb" => "\x05umpe;\x05≏̸\x04ump;\x05≎̸\x03sp;\x02 \x02sp\x02 ",
		// &ncongdot; &ncaron; &ncedil; &ncong; &ncap; &ncup; &ncy;
		"nc" => "\x07ongdot;\x05⩭̸\x05aron;\x02ň\x05edil;\x02ņ\x04ong;\x03≇\x03ap;\x03⩃\x03up;\x03⩂\x02y;\x02н",
		"nd" => "\x04ash;\x03–",                           // &ndash;
		// &nearrow; &nexists; &nearhk; &nequiv; &nesear; &nexist; &neArr; &nearr; &nedot; &nesim; &ne;
		"ne" => "\x06arrow;\x03↗\x06xists;\x03∄\x05arhk;\x03⤤\x05quiv;\x03≢\x05sear;\x03⤨\x05xist;\x03∄\x04Arr;\x03⇗\x04arr;\x03↗\x04dot;\x05≐̸\x04sim;\x05≂̸\x01;\x03≠",
		"nf" => "\x02r;\x04𝔫",                             // &nfr;
		// &ngeqslant; &ngeqq; &ngsim; &ngeq; &nges; &ngtr; &ngE; &nge; &ngt;
		"ng" => "\x08eqslant;\x05⩾̸\x04eqq;\x05≧̸\x04sim;\x03≵\x03eq;\x03≱\x03es;\x05⩾̸\x03tr;\x03≯\x02E;\x05≧̸\x02e;\x03≱\x02t;\x03≯",
		"nh" => "\x04Arr;\x03⇎\x04arr;\x03↮\x04par;\x03⫲", // &nhArr; &nharr; &nhpar;
		// &nisd; &nis; &niv; &ni;
		"ni" => "\x03sd;\x03⋺\x02s;\x03⋼\x02v;\x03∋\x01;\x03∋",
		"nj" => "\x03cy;\x02њ",                            // &njcy;
		// &nleftrightarrow; &nleftarrow; &nleqslant; &nltrie; &nlArr; &nlarr; &nleqq; &nless; &nlsim; &nltri; &nldr; &nleq; &nles; &nlE; &nle; &nlt;
		"nl" => "\x0eeftrightarrow;\x03↮\x09eftarrow;\x03↚\x08eqslant;\x05⩽̸\x05trie;\x03⋬\x04Arr;\x03⇍\x04arr;\x03↚\x04eqq;\x05≦̸\x04ess;\x03≮\x04sim;\x03≴\x04tri;\x03⋪\x03dr;\x03‥\x03eq;\x03≰\x03es;\x05⩽̸\x02E;\x05≦̸\x02e;\x03≰\x02t;\x03≮",
		"nm" => "\x03id;\x03∤",                            // &nmid;
		// &notindot; &notinva; &notinvb; &notinvc; &notniva; &notnivb; &notnivc; &notinE; &notin; &notni; &nopf; &not; &not
		"no" => "\x07tindot;\x05⋵̸\x06tinva;\x03∉\x06tinvb;\x03⋷\x06tinvc;\x03⋶\x06tniva;\x03∌\x06tnivb;\x03⋾\x06tnivc;\x03⋽\x05tinE;\x05⋹̸\x04tin;\x03∉\x04tni;\x03∌\x03pf;\x04𝕟\x02t;\x02¬\x01t\x02¬",
		// &nparallel; &npolint; &npreceq; &nparsl; &nprcue; &npart; &nprec; &npar; &npre; &npr;
		"np" => "\x08arallel;\x03∦\x06olint;\x03⨔\x06receq;\x05⪯̸\x05arsl;\x06⫽⃥\x05rcue;\x03⋠\x04art;\x05∂̸\x04rec;\x03⊀\x03ar;\x03∦\x03re;\x05⪯̸\x02r;\x03⊀",
		// &nrightarrow; &nrarrc; &nrarrw; &nrtrie; &nrArr; &nrarr; &nrtri;
		"nr" => "\x0aightarrow;\x03↛\x05arrc;\x05⤳̸\x05arrw;\x05↝̸\x05trie;\x03⋭\x04Arr;\x03⇏\x04arr;\x03↛\x04tri;\x03⋫",
		// &nshortparallel; &nsubseteqq; &nsupseteqq; &nshortmid; &nsubseteq; &nsupseteq; &nsqsube; &nsqsupe; &nsubset; &nsucceq; &nsupset; &nsccue; &nsimeq; &nsime; &nsmid; &nspar; &nsubE; &nsube; &nsucc; &nsupE; &nsupe; &nsce; &nscr; &nsim; &nsub; &nsup; &nsc;
		"ns" => "\x0dhortparallel;\x03∦\x09ubseteqq;\x05⫅̸\x09upseteqq;\x05⫆̸\x08hortmid;\x03∤\x08ubseteq;\x03⊈\x08upseteq;\x03⊉\x06qsube;\x03⋢\x06qsupe;\x03⋣\x06ubset;\x06⊂⃒\x06ucceq;\x05⪰̸\x06upset;\x06⊃⃒\x05ccue;\x03⋡\x05imeq;\x03≄\x04ime;\x03≄\x04mid;\x03∤\x04par;\x03∦\x04ubE;\x05⫅̸\x04ube;\x03⊈\x04ucc;\x03⊁\x04upE;\x05⫆̸\x04upe;\x03⊉\x03ce;\x05⪰̸\x03cr;\x04𝓃\x03im;\x03≁\x03ub;\x03⊄\x03up;\x03⊅\x02c;\x03⊁",
		// &ntrianglerighteq; &ntrianglelefteq; &ntriangleright; &ntriangleleft; &ntilde; &ntilde &ntgl; &ntlg;
		"nt" => "\x0frianglerighteq;\x03⋭\x0erianglelefteq;\x03⋬\x0driangleright;\x03⋫\x0criangleleft;\x03⋪\x05ilde;\x02ñ\x04ilde\x02ñ\x03gl;\x03≹\x03lg;\x03≸",
		// &numero; &numsp; &num; &nu;
		"nu" => "\x05mero;\x03№\x04msp;\x03 \x02m;\x01#\x01;\x02ν",
		// &nvinfin; &nvltrie; &nvrtrie; &nvDash; &nvHarr; &nvdash; &nvlArr; &nvrArr; &nvsim; &nvap; &nvge; &nvgt; &nvle; &nvlt;
		"nv" => "\x06infin;\x03⧞\x06ltrie;\x06⊴⃒\x06rtrie;\x06⊵⃒\x05Dash;\x03⊭\x05Harr;\x03⤄\x05dash;\x03⊬\x05lArr;\x03⤂\x05rArr;\x03⤃\x04sim;\x06∼⃒\x03ap;\x06≍⃒\x03ge;\x06≥⃒\x03gt;\x04>⃒\x03le;\x06≤⃒\x03lt;\x04<⃒",
		// &nwarrow; &nwarhk; &nwnear; &nwArr; &nwarr;
		"nw" => "\x06arrow;\x03↖\x05arhk;\x03⤣\x05near;\x03⤧\x04Arr;\x03⇖\x04arr;\x03↖",
		"oS" => "\x01;\x03Ⓢ",                              // &oS;
		"oa" => "\x05cute;\x02ó\x04cute\x02ó\x03st;\x03⊛", // &oacute; &oacute &oast;
		// &ocirc; &ocir; &ocirc &ocy;
		"oc" => "\x04irc;\x02ô\x03ir;\x03⊚\x03irc\x02ô\x02y;\x02о",
		// &odblac; &odsold; &odash; &odiv; &odot;
		"od" => "\x05blac;\x02ő\x05sold;\x03⦼\x04ash;\x03⊝\x03iv;\x03⨸\x03ot;\x03⊙",
		"oe" => "\x04lig;\x02œ",                           // &oelig;
		"of" => "\x04cir;\x03⦿\x02r;\x04𝔬",                // &ofcir; &ofr;
		// &ograve; &ograve &ogon; &ogt;
		"og" => "\x05rave;\x02ò\x04rave\x02ò\x03on;\x02˛\x02t;\x03⧁",
		"oh" => "\x04bar;\x03⦵\x02m;\x02Ω",                // &ohbar; &ohm;
		"oi" => "\x03nt;\x03∮",                            // &oint;
		// &olcross; &olarr; &olcir; &oline; &olt;
		"ol" => "\x06cross;\x03⦻\x04arr;\x03↺\x04cir;\x03⦾\x04ine;\x03‾\x02t;\x03⧀",
		// &omicron; &ominus; &omacr; &omega; &omid;
		"om" => "\x06icron;\x02ο\x05inus;\x03⊖\x04acr;\x02ō\x04ega;\x02ω\x03id;\x03⦶",
		"oo" => "\x03pf;\x04𝕠",                            // &oopf;
		"op" => "\x04erp;\x03⦹\x04lus;\x03⊕\x03ar;\x03⦷",  // &operp; &oplus; &opar;
		// &orderof; &orslope; &origof; &orarr; &order; &ordf; &ordm; &oror; &ord; &ordf &ordm &orv; &or;
		"or" => "\x06derof;\x03ℴ\x06slope;\x03⩗\x05igof;\x03⊶\x04arr;\x03↻\x04der;\x03ℴ\x03df;\x02ª\x03dm;\x02º\x03or;\x03⩖\x02d;\x03⩝\x02df\x02ª\x02dm\x02º\x02v;\x03⩛\x01;\x03∨",
		// &oslash; &oslash &oscr; &osol;
		"os" => "\x05lash;\x02ø\x04lash\x02ø\x03cr;\x03ℴ\x03ol;\x03⊘",
		// &otimesas; &otilde; &otimes; &otilde
		"ot" => "\x07imesas;\x03⨶\x05ilde;\x02õ\x05imes;\x03⊗\x04ilde\x02õ",
		"ou" => "\x03ml;\x02ö\x02ml\x02ö",                 // &ouml; &ouml
		"ov" => "\x04bar;\x03⌽",                           // &ovbar;
		// &parallel; &parsim; &parsl; &para; &part; &par; &para
		"pa" => "\x07rallel;\x03∥\x05rsim;\x03⫳\x04rsl;\x03⫽\x03ra;\x02¶\x03rt;\x03∂\x02r;\x03∥\x02ra\x02¶",
		"pc" => "\x02y;\x02п",                             // &pcy;
		// &pertenk; &percnt; &period; &permil; &perp;
		"pe" => "\x06rtenk;\x03‱\x05rcnt;\x01%\x05riod;\x01.\x05rmil;\x03‰\x03rp;\x03⊥",
		"pf" => "\x02r;\x04𝔭",                             // &pfr;
		// &phmmat; &phone; &phiv; &phi;
		"ph" => "\x05mmat;\x03ℳ\x04one;\x03☎\x03iv;\x02ϕ\x02i;\x02φ",
		"pi" => "\x08tchfork;\x03⋔\x02v;\x02ϖ\x01;\x02π",  // &pitchfork; &piv; &pi;
		// &plusacir; &planckh; &pluscir; &plussim; &plustwo; &planck; &plankv; &plusdo; &plusdu; &plusmn; &plusb; &pluse; &plusmn &plus;
		"pl" => "\x07usacir;\x03⨣\x06anckh;\x03ℎ\x06uscir;\x03⨢\x06ussim;\x03⨦\x06ustwo;\x03⨧\x05anck;\x03ℏ\x05ankv;\x03ℏ\x05usdo;\x03∔\x05usdu;\x03⨥\x05usmn;\x02±\x04usb;\x03⊞\x04use;\x03⩲\x04usmn\x02±\x03us;\x01+",
		"pm" => "\x01;\x02±",                              // &pm;
		// &pointint; &pound; &popf; &pound
		"po" => "\x07intint;\x03⨕\x04und;\x02£\x03pf;\x04𝕡\x03und\x02£",
		// &preccurlyeq; &precnapprox; &precapprox; &precneqq; &precnsim; &profalar; &profline; &profsurf; &precsim; &preceq; &primes; &prnsim; &propto; &prurel; &prcue; &prime; &prnap; &prsim; &prap; &prec; &prnE; &prod; &prop; &prE; &pre; &pr;
		"pr" => "\x0aeccurlyeq;\x03≼\x0aecnapprox;\x03⪹\x09ecapprox;\x03⪷\x07ecneqq;\x03⪵\x07ecnsim;\x03⋨\x07ofalar;\x03⌮\x07ofline;\x03⌒\x07ofsurf;\x03⌓\x06ecsim;\x03≾\x05eceq;\x03⪯\x05imes;\x03ℙ\x05nsim;\x03⋨\x05opto;\x03∝\x05urel;\x03⊰\x04cue;\x03≼\x04ime;\x03′\x04nap;\x03⪹\x04sim;\x03≾\x03ap;\x03⪷\x03ec;\x03≺\x03nE;\x03⪵\x03od;\x03∏\x03op;\x03∝\x02E;\x03⪳\x02e;\x03⪯\x01;\x03≺",
		"ps" => "\x03cr;\x04𝓅\x02i;\x02ψ",                 // &pscr; &psi;
		"pu" => "\x05ncsp;\x03 ",                          // &puncsp;
		"qf" => "\x02r;\x04𝔮",                             // &qfr;
		"qi" => "\x03nt;\x03⨌",                            // &qint;
		"qo" => "\x03pf;\x04𝕢",                            // &qopf;
		"qp" => "\x05rime;\x03⁗",                          // &qprime;
		"qs" => "\x03cr;\x04𝓆",                            // &qscr;
		// &quaternions; &quatint; &questeq; &quest; &quot; &quot
		"qu" => "\x0aaternions;\x03ℍ\x06atint;\x03⨖\x06esteq;\x03≟\x04est;\x01?\x03ot;\x01\x22\x02ot\x01\x22",
		"rA" => "\x05tail;\x03⤜\x04arr;\x03⇛\x03rr;\x03⇒", // &rAtail; &rAarr; &rArr;
		"rB" => "\x04arr;\x03⤏",                           // &rBarr;
		"rH" => "\x03ar;\x03⥤",                            // &rHar;
		// &rationals; &raemptyv; &rarrbfs; &rarrsim; &racute; &rangle; &rarrap; &rarrfs; &rarrhk; &rarrlp; &rarrpl; &rarrtl; &ratail; &radic; &rangd; &range; &raquo; &rarrb; &rarrc; &rarrw; &ratio; &race; &rang; &raquo &rarr;
		"ra" => "\x08tionals;\x03ℚ\x07emptyv;\x03⦳\x06rrbfs;\x03⤠\x06rrsim;\x03⥴\x05cute;\x02ŕ\x05ngle;\x03⟩\x05rrap;\x03⥵\x05rrfs;\x03⤞\x05rrhk;\x03↪\x05rrlp;\x03↬\x05rrpl;\x03⥅\x05rrtl;\x03↣\x05tail;\x03⤚\x04dic;\x03√\x04ngd;\x03⦒\x04nge;\x03⦥\x04quo;\x02»\x04rrb;\x03⇥\x04rrc;\x03⤳\x04rrw;\x03↝\x04tio;\x03∶\x03ce;\x05∽̱\x03ng;\x03⟩\x03quo\x02»\x03rr;\x03→",
		// &rbrksld; &rbrkslu; &rbrace; &rbrack; &rbarr; &rbbrk; &rbrke;
		"rb" => "\x06rksld;\x03⦎\x06rkslu;\x03⦐\x05race;\x01}\x05rack;\x01]\x04arr;\x03⤍\x04brk;\x03❳\x04rke;\x03⦌",
		// &rcaron; &rcedil; &rceil; &rcub; &rcy;
		"rc" => "\x05aron;\x02ř\x05edil;\x02ŗ\x04eil;\x03⌉\x03ub;\x01}\x02y;\x02р",
		// &rdldhar; &rdquor; &rdquo; &rdca; &rdsh;
		"rd" => "\x06ldhar;\x03⥩\x05quor;\x03”\x04quo;\x03”\x03ca;\x03⤷\x03sh;\x03↳",
		// &realpart; &realine; &reals; &real; &rect; &reg; &reg
		"re" => "\x07alpart;\x03ℜ\x06aline;\x03ℛ\x04als;\x03ℝ\x03al;\x03ℜ\x03ct;\x03▭\x02g;\x02®\x01g\x02®",
		"rf" => "\x05isht;\x03⥽\x05loor;\x03⌋\x02r;\x04𝔯", // &rfisht; &rfloor; &rfr;
		// &rharul; &rhard; &rharu; &rhov; &rho;
		"rh" => "\x05arul;\x03⥬\x04ard;\x03⇁\x04aru;\x03⇀\x03ov;\x02ϱ\x02o;\x02ρ",
		// &rightleftharpoons; &rightharpoondown; &rightrightarrows; &rightleftarrows; &rightsquigarrow; &rightthreetimes; &rightarrowtail; &rightharpoonup; &risingdotseq; &rightarrow; &ring;
		"ri" => "\x10ghtleftharpoons;\x03⇌\x0fghtharpoondown;\x03⇁\x0fghtrightarrows;\x03⇉\x0eghtleftarrows;\x03⇄\x0eghtsquigarrow;\x03↝\x0eghtthreetimes;\x03⋌\x0dghtarrowtail;\x03↣\x0dghtharpoonup;\x03⇀\x0bsingdotseq;\x03≓\x09ghtarrow;\x03→\x03ng;\x02˚",
		// &rlarr; &rlhar; &rlm;
		"rl" => "\x04arr;\x03⇄\x04har;\x03⇌\x02m;\x03\u{200F}",
		"rm" => "\x09oustache;\x03⎱\x05oust;\x03⎱",        // &rmoustache; &rmoust;
		"rn" => "\x04mid;\x03⫮",                           // &rnmid;
		// &rotimes; &roplus; &roang; &roarr; &robrk; &ropar; &ropf;
		"ro" => "\x06times;\x03⨵\x05plus;\x03⨮\x04ang;\x03⟭\x04arr;\x03⇾\x04brk;\x03⟧\x04par;\x03⦆\x03pf;\x04𝕣",
		// &rppolint; &rpargt; &rpar;
		"rp" => "\x07polint;\x03⨒\x05argt;\x03⦔\x03ar;\x01)",
		"rr" => "\x04arr;\x03⇉",                           // &rrarr;
		// &rsaquo; &rsquor; &rsquo; &rscr; &rsqb; &rsh;
		"rs" => "\x05aquo;\x03›\x05quor;\x03’\x04quo;\x03’\x03cr;\x04𝓇\x03qb;\x01]\x02h;\x03↱",
		// &rtriltri; &rthree; &rtimes; &rtrie; &rtrif; &rtri;
		"rt" => "\x07riltri;\x03⧎\x05hree;\x03⋌\x05imes;\x03⋊\x04rie;\x03⊵\x04rif;\x03▸\x03ri;\x03▹",
		"ru" => "\x06luhar;\x03⥨",                         // &ruluhar;
		"rx" => "\x01;\x03℞",                              // &rx;
		"sa" => "\x05cute;\x02ś",                          // &sacute;
		"sb" => "\x04quo;\x03‚",                           // &sbquo;
		// &scpolint; &scaron; &scedil; &scnsim; &sccue; &scirc; &scnap; &scsim; &scap; &scnE; &scE; &sce; &scy; &sc;
		"sc" => "\x07polint;\x03⨓\x05aron;\x02š\x05edil;\x02ş\x05nsim;\x03⋩\x04cue;\x03≽\x04irc;\x02ŝ\x04nap;\x03⪺\x04sim;\x03≿\x03ap;\x03⪸\x03nE;\x03⪶\x02E;\x03⪴\x02e;\x03⪰\x02y;\x02с\x01;\x03≻",
		"sd" => "\x04otb;\x03⊡\x04ote;\x03⩦\x03ot;\x03⋅",  // &sdotb; &sdote; &sdot;
		// &setminus; &searrow; &searhk; &seswar; &seArr; &searr; &setmn; &sect; &semi; &sext; &sect
		"se" => "\x07tminus;\x03∖\x06arrow;\x03↘\x05arhk;\x03⤥\x05swar;\x03⤩\x04Arr;\x03⇘\x04arr;\x03↘\x04tmn;\x03∖\x03ct;\x02§\x03mi;\x01;\x03xt;\x03✶\x02ct\x02§",
		"sf" => "\x05rown;\x03⌢\x02r;\x04𝔰",               // &sfrown; &sfr;
		// &shortparallel; &shortmid; &shchcy; &sharp; &shcy; &shy; &shy
		"sh" => "\x0cortparallel;\x03∥\x07ortmid;\x03∣\x05chcy;\x02щ\x04arp;\x03♯\x03cy;\x02ш\x02y;\x02\u{AD}\x01y\x02\u{AD}",
		// &simplus; &simrarr; &sigmaf; &sigmav; &simdot; &sigma; &simeq; &simgE; &simlE; &simne; &sime; &simg; &siml; &sim;
		"si" => "\x06mplus;\x03⨤\x06mrarr;\x03⥲\x05gmaf;\x02ς\x05gmav;\x02ς\x05mdot;\x03⩪\x04gma;\x02σ\x04meq;\x03≃\x04mgE;\x03⪠\x04mlE;\x03⪟\x04mne;\x03≆\x03me;\x03≃\x03mg;\x03⪞\x03ml;\x03⪝\x02m;\x03∼",
		"sl" => "\x04arr;\x03←",                           // &slarr;
		// &smallsetminus; &smeparsl; &smashp; &smile; &smtes; &smid; &smte; &smt;
		"sm" => "\x0callsetminus;\x03∖\x07eparsl;\x03⧤\x05ashp;\x03⨳\x04ile;\x03⌣\x04tes;\x06⪬︀\x03id;\x03∣\x03te;\x03⪬\x02t;\x03⪪",
		// &softcy; &solbar; &solb; &sopf; &sol;
		"so" => "\x05ftcy;\x02ь\x05lbar;\x03⌿\x03lb;\x03⧄\x03pf;\x04𝕤\x02l;\x01/",
		// &spadesuit; &spades; &spar;
		"sp" => "\x08adesuit;\x03♠\x05ades;\x03♠\x03ar;\x03∥",
		// &sqsubseteq; &sqsupseteq; &sqsubset; &sqsupset; &sqcaps; &sqcups; &sqsube; &sqsupe; &square; &squarf; &sqcap; &sqcup; &sqsub; &sqsup; &squf; &squ;
		"sq" => "\x09subseteq;\x03⊑\x09supseteq;\x03⊒\x07subset;\x03⊏\x07supset;\x03⊐\x05caps;\x06⊓︀\x05cups;\x06⊔︀\x05sube;\x03⊑\x05supe;\x03⊒\x05uare;\x03□\x05uarf;\x03▪\x04cap;\x03⊓\x04cup;\x03⊔\x04sub;\x03⊏\x04sup;\x03⊐\x03uf;\x03▪\x02u;\x03□",
		"sr" => "\x04arr;\x03→",                           // &srarr;
		// &ssetmn; &ssmile; &sstarf; &sscr;
		"ss" => "\x05etmn;\x03∖\x05mile;\x03⌣\x05tarf;\x03⋆\x03cr;\x04𝓈",
		// &straightepsilon; &straightphi; &starf; &strns; &star;
		"st" => "\x0eraightepsilon;\x02ϵ\x0araightphi;\x02ϕ\x04arf;\x03★\x04rns;\x02¯\x03ar;\x03☆",
		// &succcurlyeq; &succnapprox; &subsetneqq; &succapprox; &supsetneqq; &subseteqq; &subsetneq; &supseteqq; &supsetneq; &subseteq; &succneqq; &succnsim; &supseteq; &subedot; &submult; &subplus; &subrarr; &succsim; &supdsub; &supedot; &suphsol; &suphsub; &suplarr; &supmult; &supplus; &subdot; &subset; &subsim; &subsub; &subsup; &succeq; &supdot; &supset; &supsim; &supsub; &supsup; &subnE; &subne; &supnE; &supne; &subE; &sube; &succ; &sung; &sup1; &sup2; &sup3; &supE; &supe; &sub; &sum; &sup1 &sup2 &sup3 &sup;
		"su" => "\x0acccurlyeq;\x03≽\x0accnapprox;\x03⪺\x09bsetneqq;\x03⫋\x09ccapprox;\x03⪸\x09psetneqq;\x03⫌\x08bseteqq;\x03⫅\x08bsetneq;\x03⊊\x08pseteqq;\x03⫆\x08psetneq;\x03⊋\x07bseteq;\x03⊆\x07ccneqq;\x03⪶\x07ccnsim;\x03⋩\x07pseteq;\x03⊇\x06bedot;\x03⫃\x06bmult;\x03⫁\x06bplus;\x03⪿\x06brarr;\x03⥹\x06ccsim;\x03≿\x06pdsub;\x03⫘\x06pedot;\x03⫄\x06phsol;\x03⟉\x06phsub;\x03⫗\x06plarr;\x03⥻\x06pmult;\x03⫂\x06pplus;\x03⫀\x05bdot;\x03⪽\x05bset;\x03⊂\x05bsim;\x03⫇\x05bsub;\x03⫕\x05bsup;\x03⫓\x05cceq;\x03⪰\x05pdot;\x03⪾\x05pset;\x03⊃\x05psim;\x03⫈\x05psub;\x03⫔\x05psup;\x03⫖\x04bnE;\x03⫋\x04bne;\x03⊊\x04pnE;\x03⫌\x04pne;\x03⊋\x03bE;\x03⫅\x03be;\x03⊆\x03cc;\x03≻\x03ng;\x03♪\x03p1;\x02¹\x03p2;\x02²\x03p3;\x02³\x03pE;\x03⫆\x03pe;\x03⊇\x02b;\x03⊂\x02m;\x03∑\x02p1\x02¹\x02p2\x02²\x02p3\x02³\x02p;\x03⊃",
		// &swarrow; &swarhk; &swnwar; &swArr; &swarr;
		"sw" => "\x06arrow;\x03↙\x05arhk;\x03⤦\x05nwar;\x03⤪\x04Arr;\x03⇙\x04arr;\x03↙",
		"sz" => "\x04lig;\x02ß\x03lig\x02ß",               // &szlig; &szlig
		"ta" => "\x05rget;\x03⌖\x02u;\x02τ",               // &target; &tau;
		"tb" => "\x03rk;\x03⎴",                            // &tbrk;
		"tc" => "\x05aron;\x02ť\x05edil;\x02ţ\x02y;\x02т", // &tcaron; &tcedil; &tcy;
		"td" => "\x03ot;\x03⃛",                            // &tdot;
		"te" => "\x05lrec;\x03⌕",                          // &telrec;
		"tf" => "\x02r;\x04𝔱",                             // &tfr;
		// &thickapprox; &therefore; &thetasym; &thicksim; &there4; &thetav; &thinsp; &thksim; &theta; &thkap; &thorn; &thorn
		"th" => "\x0aickapprox;\x03≈\x08erefore;\x03∴\x07etasym;\x02ϑ\x07icksim;\x03∼\x05ere4;\x03∴\x05etav;\x02ϑ\x05insp;\x03 \x05ksim;\x03∼\x04eta;\x02θ\x04kap;\x03≈\x04orn;\x02þ\x03orn\x02þ",
		// &timesbar; &timesb; &timesd; &tilde; &times; &times &tint;
		"ti" => "\x07mesbar;\x03⨱\x05mesb;\x03⊠\x05mesd;\x03⨰\x04lde;\x02˜\x04mes;\x02×\x03mes\x02×\x03nt;\x03∭",
		// &topfork; &topbot; &topcir; &toea; &topf; &tosa; &top;
		"to" => "\x06pfork;\x03⫚\x05pbot;\x03⌶\x05pcir;\x03⫱\x03ea;\x03⤨\x03pf;\x04𝕥\x03sa;\x03⤩\x02p;\x03⊤",
		"tp" => "\x05rime;\x03‴",                          // &tprime;
		// &trianglerighteq; &trianglelefteq; &triangleright; &triangledown; &triangleleft; &triangleq; &triangle; &triminus; &trpezium; &triplus; &tritime; &tridot; &trade; &trisb; &trie;
		"tr" => "\x0eianglerighteq;\x03⊵\x0dianglelefteq;\x03⊴\x0ciangleright;\x03▹\x0biangledown;\x03▿\x0biangleleft;\x03◃\x08iangleq;\x03≜\x07iangle;\x03▵\x07iminus;\x03⨺\x07pezium;\x03⏢\x06iplus;\x03⨹\x06itime;\x03⨻\x05idot;\x03◬\x04ade;\x03™\x04isb;\x03⧍\x03ie;\x03≜",
		// &tstrok; &tshcy; &tscr; &tscy;
		"ts" => "\x05trok;\x02ŧ\x04hcy;\x02ћ\x03cr;\x04𝓉\x03cy;\x02ц",
		// &twoheadrightarrow; &twoheadleftarrow; &twixt;
		"tw" => "\x10oheadrightarrow;\x03↠\x0foheadleftarrow;\x03↞\x04ixt;\x03≬",
		"uA" => "\x03rr;\x03⇑",                            // &uArr;
		"uH" => "\x03ar;\x03⥣",                            // &uHar;
		"ua" => "\x05cute;\x02ú\x04cute\x02ú\x03rr;\x03↑", // &uacute; &uacute &uarr;
		"ub" => "\x05reve;\x02ŭ\x04rcy;\x02ў",             // &ubreve; &ubrcy;
		"uc" => "\x04irc;\x02û\x03irc\x02û\x02y;\x02у",    // &ucirc; &ucirc &ucy;
		// &udblac; &udarr; &udhar;
		"ud" => "\x05blac;\x02ű\x04arr;\x03⇅\x04har;\x03⥮",
		"uf" => "\x05isht;\x03⥾\x02r;\x04𝔲",               // &ufisht; &ufr;
		"ug" => "\x05rave;\x02ù\x04rave\x02ù",             // &ugrave; &ugrave
		"uh" => "\x04arl;\x03↿\x04arr;\x03↾\x04blk;\x03▀", // &uharl; &uharr; &uhblk;
		// &ulcorner; &ulcorn; &ulcrop; &ultri;
		"ul" => "\x07corner;\x03⌜\x05corn;\x03⌜\x05crop;\x03⌏\x04tri;\x03◸",
		"um" => "\x04acr;\x02ū\x02l;\x02¨\x01l\x02¨",      // &umacr; &uml; &uml
		"uo" => "\x04gon;\x02ų\x03pf;\x04𝕦",               // &uogon; &uopf;
		// &upharpoonright; &upharpoonleft; &updownarrow; &upuparrows; &uparrow; &upsilon; &uplus; &upsih; &upsi;
		"up" => "\x0dharpoonright;\x03↾\x0charpoonleft;\x03↿\x0adownarrow;\x03↕\x09uparrows;\x03⇈\x06arrow;\x03↑\x06silon;\x02υ\x04lus;\x03⊎\x04sih;\x02ϒ\x03si;\x02υ",
		// &urcorner; &urcorn; &urcrop; &uring; &urtri;
		"ur" => "\x07corner;\x03⌝\x05corn;\x03⌝\x05crop;\x03⌎\x04ing;\x02ů\x04tri;\x03◹",
		"us" => "\x03cr;\x04𝓊",                            // &uscr;
		// &utilde; &utdot; &utrif; &utri;
		"ut" => "\x05ilde;\x02ũ\x04dot;\x03⋰\x04rif;\x03▴\x03ri;\x03▵",
		"uu" => "\x04arr;\x03⇈\x03ml;\x02ü\x02ml\x02ü",    // &uuarr; &uuml; &uuml
		"uw" => "\x06angle;\x03⦧",                         // &uwangle;
		"vA" => "\x03rr;\x03⇕",                            // &vArr;
		"vB" => "\x04arv;\x03⫩\x03ar;\x03⫨",               // &vBarv; &vBar;
		"vD" => "\x04ash;\x03⊨",                           // &vDash;
		// &vartriangleright; &vartriangleleft; &varsubsetneqq; &varsupsetneqq; &varsubsetneq; &varsupsetneq; &varepsilon; &varnothing; &varpropto; &varkappa; &varsigma; &vartheta; &vangrt; &varphi; &varrho; &varpi; &varr;
		"va" => "\x0frtriangleright;\x03⊳\x0ertriangleleft;\x03⊲\x0crsubsetneqq;\x06⫋︀\x0crsupsetneqq;\x06⫌︀\x0brsubsetneq;\x06⊊︀\x0brsupsetneq;\x06⊋︀\x09repsilon;\x02ϵ\x09rnothing;\x03∅\x08rpropto;\x03∝\x07rkappa;\x02ϰ\x07rsigma;\x02ς\x07rtheta;\x02ϑ\x05ngrt;\x03⦜\x05rphi;\x02ϕ\x05rrho;\x02ϱ\x04rpi;\x02ϖ\x03rr;\x03↕",
		"vc" => "\x02y;\x02в",                             // &vcy;
		"vd" => "\x04ash;\x03⊢",                           // &vdash;
		// &veebar; &vellip; &verbar; &veeeq; &vert; &vee;
		"ve" => "\x05ebar;\x03⊻\x05llip;\x03⋮\x05rbar;\x01|\x04eeq;\x03≚\x03rt;\x01|\x02e;\x03∨",
		"vf" => "\x02r;\x04𝔳",                             // &vfr;
		"vl" => "\x04tri;\x03⊲",                           // &vltri;
		"vn" => "\x04sub;\x06⊂⃒\x04sup;\x06⊃⃒",            // &vnsub; &vnsup;
		"vo" => "\x03pf;\x04𝕧",                            // &vopf;
		"vp" => "\x04rop;\x03∝",                           // &vprop;
		"vr" => "\x04tri;\x03⊳",                           // &vrtri;
		// &vsubnE; &vsubne; &vsupnE; &vsupne; &vscr;
		"vs" => "\x05ubnE;\x06⫋︀\x05ubne;\x06⊊︀\x05upnE;\x06⫌︀\x05upne;\x06⊋︀\x03cr;\x04𝓋",
		"vz" => "\x06igzag;\x03⦚",                         // &vzigzag;
		"wc" => "\x04irc;\x02ŵ",                           // &wcirc;
		// &wedbar; &wedgeq; &weierp; &wedge;
		"we" => "\x05dbar;\x03⩟\x05dgeq;\x03≙\x05ierp;\x03℘\x04dge;\x03∧",
		"wf" => "\x02r;\x04𝔴",                             // &wfr;
		"wo" => "\x03pf;\x04𝕨",                            // &wopf;
		"wp" => "\x01;\x03℘",                              // &wp;
		"wr" => "\x05eath;\x03≀\x01;\x03≀",                // &wreath; &wr;
		"ws" => "\x03cr;\x04𝓌",                            // &wscr;
		"xc" => "\x04irc;\x03◯\x03ap;\x03⋂\x03up;\x03⋃",   // &xcirc; &xcap; &xcup;
		"xd" => "\x04tri;\x03▽",                           // &xdtri;
		"xf" => "\x02r;\x04𝔵",                             // &xfr;
		"xh" => "\x04Arr;\x03⟺\x04arr;\x03⟷",              // &xhArr; &xharr;
		"xi" => "\x01;\x02ξ",                              // &xi;
		"xl" => "\x04Arr;\x03⟸\x04arr;\x03⟵",              // &xlArr; &xlarr;
		"xm" => "\x03ap;\x03⟼",                            // &xmap;
		"xn" => "\x03is;\x03⋻",                            // &xnis;
		// &xoplus; &xotime; &xodot; &xopf;
		"xo" => "\x05plus;\x03⨁\x05time;\x03⨂\x04dot;\x03⨀\x03pf;\x04𝕩",
		"xr" => "\x04Arr;\x03⟹\x04arr;\x03⟶",              // &xrArr; &xrarr;
		"xs" => "\x05qcup;\x03⨆\x03cr;\x04𝓍",              // &xsqcup; &xscr;
		"xu" => "\x05plus;\x03⨄\x04tri;\x03△",             // &xuplus; &xutri;
		"xv" => "\x03ee;\x03⋁",                            // &xvee;
		"xw" => "\x05edge;\x03⋀",                          // &xwedge;
		"ya" => "\x05cute;\x02ý\x04cute\x02ý\x03cy;\x02я", // &yacute; &yacute &yacy;
		"yc" => "\x04irc;\x02ŷ\x02y;\x02ы",                // &ycirc; &ycy;
		"ye" => "\x02n;\x02¥\x01n\x02¥",                   // &yen; &yen
		"yf" => "\x02r;\x04𝔶",                             // &yfr;
		"yi" => "\x03cy;\x02ї",                            // &yicy;
		"yo" => "\x03pf;\x04𝕪",                            // &yopf;
		"ys" => "\x03cr;\x04𝓎",                            // &yscr;
		"yu" => "\x03cy;\x02ю\x03ml;\x02ÿ\x02ml\x02ÿ",     // &yucy; &yuml; &yuml
		"za" => "\x05cute;\x02ź",                          // &zacute;
		"zc" => "\x05aron;\x02ž\x02y;\x02з",               // &zcaron; &zcy;
		"zd" => "\x03ot;\x02ż",                            // &zdot;
		"ze" => "\x05etrf;\x03ℨ\x03ta;\x02ζ",              // &zeetrf; &zeta;
		"zf" => "\x02r;\x04𝔷",                             // &zfr;
		"zh" => "\x03cy;\x02ж",                            // &zhcy;
		"zi" => "\x06grarr;\x03⇝",                         // &zigrarr;
		"zo" => "\x03pf;\x04𝕫",                            // &zopf;
		"zs" => "\x03cr;\x04𝓏",                            // &zscr;
		"zw" => "\x03nj;\x03\u{200C}\x02j;\x03\u{200D}",   // &zwnj; &zwj;
	);
}
