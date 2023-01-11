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

			if ( array_key_exists( $group, self::$character_references ) ) {
				$at += 2;
				list( 'names' => $names, 'refs' => $refs ) = self::$character_references[ $group ];

				foreach ( $names as $index => $name ) {
					$name_length = strlen( $name );

					if ( $at + $name_length > $end || $name !== substr( $input, $at, $name_length ) ) {
						continue;
					}

					$at += $name_length;

					// If we have an un-ambiguous ampersand we can always safely decode it.
					if ( ';' === $name[ $name_length - 1 ] ) {
						$buffer .= $refs[ $index ];
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
						$buffer .= $refs[ $index ];
						continue 2;
					}

					// Ambiguous ampersand is context-sensitive.
					switch ( $context ) {
						case 'attribute':
							$buffer .= substr( $input, $next, $at - $next );
							continue 3;

						case 'data':
							$buffer .= $refs[ $index ];
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
	 * Generate from HTML5 spec
	 *
	 * Group names by first two letters, then sort full names within each
	 * group by their length, longest first, so that e.g. `&AMP;` matches
	 * before `&AMP`.
	 *
	 * @see https://html.spec.whatwg.org/#named-character-references
	 * @see https://html.spec.whatwg.org/entities.json
	 *
	 * @var string[][][] character references and associated substitutions.
	 */
	static $character_references = array(
		"AE" => array( "names" => array( "lig;", "lig" ), "refs" => array( "Æ", "Æ" ) ),
		"AM" => array( "names" => array( "P;", "P" ), "refs" => array( "&", "&" ) ),
		"Aa" => array( "names" => array( "cute;", "cute" ), "refs" => array( "Á", "Á" ) ),
		"Ab" => array( "names" => array( "reve;" ), "refs" => array( "Ă" ) ),
		"Ac" => array( "names" => array( "irc;", "irc", "y;" ), "refs" => array( "Â", "Â", "А" ) ),
		"Af" => array( "names" => array( "r;" ), "refs" => array( "𝔄" ) ),
		"Ag" => array( "names" => array( "rave;", "rave" ), "refs" => array( "À", "À" ) ),
		"Al" => array( "names" => array( "pha;" ), "refs" => array( "Α" ) ),
		"Am" => array( "names" => array( "acr;" ), "refs" => array( "Ā" ) ),
		"An" => array( "names" => array( "d;" ), "refs" => array( "⩓" ) ),
		"Ao" => array( "names" => array( "gon;", "pf;" ), "refs" => array( "Ą", "𝔸" ) ),
		"Ap" => array( "names" => array( "plyFunction;" ), "refs" => array( "" ) ),
		"Ar" => array( "names" => array( "ing;", "ing" ), "refs" => array( "Å", "Å" ) ),
		"As" => array( "names" => array( "sign;", "cr;" ), "refs" => array( "≔", "𝒜" ) ),
		"At" => array( "names" => array( "ilde;", "ilde" ), "refs" => array( "Ã", "Ã" ) ),
		"Au" => array( "names" => array( "ml;", "ml" ), "refs" => array( "Ä", "Ä" ) ),
		"Ba" => array( "names" => array( "ckslash;", "rwed;", "rv;" ), "refs" => array( "∖", "⌆", "⫧" ) ),
		"Bc" => array( "names" => array( "y;" ), "refs" => array( "Б" ) ),
		"Be" => array( "names" => array( "rnoullis;", "cause;", "ta;" ), "refs" => array( "ℬ", "∵", "Β" ) ),
		"Bf" => array( "names" => array( "r;" ), "refs" => array( "𝔅" ) ),
		"Bo" => array( "names" => array( "pf;" ), "refs" => array( "𝔹" ) ),
		"Br" => array( "names" => array( "eve;" ), "refs" => array( "˘" ) ),
		"Bs" => array( "names" => array( "cr;" ), "refs" => array( "ℬ" ) ),
		"Bu" => array( "names" => array( "mpeq;" ), "refs" => array( "≎" ) ),
		"CH" => array( "names" => array( "cy;" ), "refs" => array( "Ч" ) ),
		"CO" => array( "names" => array( "PY;", "PY" ), "refs" => array( "©", "©" ) ),
		"Ca" => array( "names" => array( "pitalDifferentialD;", "yleys;", "cute;", "p;" ), "refs" => array( "ⅅ", "ℭ", "Ć", "⋒" ) ),
		"Cc" => array( "names" => array( "onint;", "aron;", "edil;", "edil", "irc;" ), "refs" => array( "∰", "Č", "Ç", "Ç", "Ĉ" ) ),
		"Cd" => array( "names" => array( "ot;" ), "refs" => array( "Ċ" ) ),
		"Ce" => array( "names" => array( "nterDot;", "dilla;" ), "refs" => array( "·", "¸" ) ),
		"Cf" => array( "names" => array( "r;" ), "refs" => array( "ℭ" ) ),
		"Ch" => array( "names" => array( "i;" ), "refs" => array( "Χ" ) ),
		"Ci" => array( "names" => array( "rcleMinus;", "rcleTimes;", "rclePlus;", "rcleDot;" ), "refs" => array( "⊖", "⊗", "⊕", "⊙" ) ),
		"Cl" => array( "names" => array( "ockwiseContourIntegral;", "oseCurlyDoubleQuote;", "oseCurlyQuote;" ), "refs" => array( "∲", "”", "’" ) ),
		"Co" => array( "names" => array( "unterClockwiseContourIntegral;", "ntourIntegral;", "ngruent;", "product;", "lone;", "nint;", "lon;", "pf;" ), "refs" => array( "∳", "∮", "≡", "∐", "⩴", "∯", "∷", "ℂ" ) ),
		"Cr" => array( "names" => array( "oss;" ), "refs" => array( "⨯" ) ),
		"Cs" => array( "names" => array( "cr;" ), "refs" => array( "𝒞" ) ),
		"Cu" => array( "names" => array( "pCap;", "p;" ), "refs" => array( "≍", "⋓" ) ),
		"DD" => array( "names" => array( "otrahd;", ";" ), "refs" => array( "⤑", "ⅅ" ) ),
		"DJ" => array( "names" => array( "cy;" ), "refs" => array( "Ђ" ) ),
		"DS" => array( "names" => array( "cy;" ), "refs" => array( "Ѕ" ) ),
		"DZ" => array( "names" => array( "cy;" ), "refs" => array( "Џ" ) ),
		"Da" => array( "names" => array( "gger;", "shv;", "rr;" ), "refs" => array( "‡", "⫤", "↡" ) ),
		"Dc" => array( "names" => array( "aron;", "y;" ), "refs" => array( "Ď", "Д" ) ),
		"De" => array( "names" => array( "lta;", "l;" ), "refs" => array( "Δ", "∇" ) ),
		"Df" => array( "names" => array( "r;" ), "refs" => array( "𝔇" ) ),
		"Di" => array( "names" => array( "acriticalDoubleAcute;", "acriticalAcute;", "acriticalGrave;", "acriticalTilde;", "acriticalDot;", "fferentialD;", "amond;" ), "refs" => array( "˝", "´", "`", "˜", "˙", "ⅆ", "⋄" ) ),
		"Do" => array( "names" => array( "ubleLongLeftRightArrow;", "ubleContourIntegral;", "ubleLeftRightArrow;", "ubleLongRightArrow;", "ubleLongLeftArrow;", "wnLeftRightVector;", "wnRightTeeVector;", "wnRightVectorBar;", "ubleUpDownArrow;", "ubleVerticalBar;", "wnLeftTeeVector;", "wnLeftVectorBar;", "ubleRightArrow;", "wnArrowUpArrow;", "ubleDownArrow;", "ubleLeftArrow;", "wnRightVector;", "ubleRightTee;", "wnLeftVector;", "ubleLeftTee;", "ubleUpArrow;", "wnArrowBar;", "wnTeeArrow;", "ubleDot;", "wnArrow;", "wnBreve;", "wnarrow;", "tEqual;", "wnTee;", "tDot;", "pf;", "t;" ), "refs" => array( "⟺", "∯", "⇔", "⟹", "⟸", "⥐", "⥟", "⥗", "⇕", "∥", "⥞", "⥖", "⇒", "⇵", "⇓", "⇐", "⇁", "⊨", "↽", "⫤", "⇑", "⤓", "↧", "¨", "↓", "̑", "⇓", "≐", "⊤", "⃜", "𝔻", "¨" ) ),
		"Ds" => array( "names" => array( "trok;", "cr;" ), "refs" => array( "Đ", "𝒟" ) ),
		"EN" => array( "names" => array( "G;" ), "refs" => array( "Ŋ" ) ),
		"ET" => array( "names" => array( "H;", "H" ), "refs" => array( "Ð", "Ð" ) ),
		"Ea" => array( "names" => array( "cute;", "cute" ), "refs" => array( "É", "É" ) ),
		"Ec" => array( "names" => array( "aron;", "irc;", "irc", "y;" ), "refs" => array( "Ě", "Ê", "Ê", "Э" ) ),
		"Ed" => array( "names" => array( "ot;" ), "refs" => array( "Ė" ) ),
		"Ef" => array( "names" => array( "r;" ), "refs" => array( "𝔈" ) ),
		"Eg" => array( "names" => array( "rave;", "rave" ), "refs" => array( "È", "È" ) ),
		"El" => array( "names" => array( "ement;" ), "refs" => array( "∈" ) ),
		"Em" => array( "names" => array( "ptyVerySmallSquare;", "ptySmallSquare;", "acr;" ), "refs" => array( "▫", "◻", "Ē" ) ),
		"Eo" => array( "names" => array( "gon;", "pf;" ), "refs" => array( "Ę", "𝔼" ) ),
		"Ep" => array( "names" => array( "silon;" ), "refs" => array( "Ε" ) ),
		"Eq" => array( "names" => array( "uilibrium;", "ualTilde;", "ual;" ), "refs" => array( "⇌", "≂", "⩵" ) ),
		"Es" => array( "names" => array( "cr;", "im;" ), "refs" => array( "ℰ", "⩳" ) ),
		"Et" => array( "names" => array( "a;" ), "refs" => array( "Η" ) ),
		"Eu" => array( "names" => array( "ml;", "ml" ), "refs" => array( "Ë", "Ë" ) ),
		"Ex" => array( "names" => array( "ponentialE;", "ists;" ), "refs" => array( "ⅇ", "∃" ) ),
		"Fc" => array( "names" => array( "y;" ), "refs" => array( "Ф" ) ),
		"Ff" => array( "names" => array( "r;" ), "refs" => array( "𝔉" ) ),
		"Fi" => array( "names" => array( "lledVerySmallSquare;", "lledSmallSquare;" ), "refs" => array( "▪", "◼" ) ),
		"Fo" => array( "names" => array( "uriertrf;", "rAll;", "pf;" ), "refs" => array( "ℱ", "∀", "𝔽" ) ),
		"Fs" => array( "names" => array( "cr;" ), "refs" => array( "ℱ" ) ),
		"GJ" => array( "names" => array( "cy;" ), "refs" => array( "Ѓ" ) ),
		"GT" => array( "names" => array( ";", "" ), "refs" => array( ">", ">" ) ),
		"Ga" => array( "names" => array( "mmad;", "mma;" ), "refs" => array( "Ϝ", "Γ" ) ),
		"Gb" => array( "names" => array( "reve;" ), "refs" => array( "Ğ" ) ),
		"Gc" => array( "names" => array( "edil;", "irc;", "y;" ), "refs" => array( "Ģ", "Ĝ", "Г" ) ),
		"Gd" => array( "names" => array( "ot;" ), "refs" => array( "Ġ" ) ),
		"Gf" => array( "names" => array( "r;" ), "refs" => array( "𝔊" ) ),
		"Gg" => array( "names" => array( ";" ), "refs" => array( "⋙" ) ),
		"Go" => array( "names" => array( "pf;" ), "refs" => array( "𝔾" ) ),
		"Gr" => array( "names" => array( "eaterSlantEqual;", "eaterEqualLess;", "eaterFullEqual;", "eaterGreater;", "eaterEqual;", "eaterTilde;", "eaterLess;" ), "refs" => array( "⩾", "⋛", "≧", "⪢", "≥", "≳", "≷" ) ),
		"Gs" => array( "names" => array( "cr;" ), "refs" => array( "𝒢" ) ),
		"Gt" => array( "names" => array( ";" ), "refs" => array( "≫" ) ),
		"HA" => array( "names" => array( "RDcy;" ), "refs" => array( "Ъ" ) ),
		"Ha" => array( "names" => array( "cek;", "t;" ), "refs" => array( "ˇ", "^" ) ),
		"Hc" => array( "names" => array( "irc;" ), "refs" => array( "Ĥ" ) ),
		"Hf" => array( "names" => array( "r;" ), "refs" => array( "ℌ" ) ),
		"Hi" => array( "names" => array( "lbertSpace;" ), "refs" => array( "ℋ" ) ),
		"Ho" => array( "names" => array( "rizontalLine;", "pf;" ), "refs" => array( "─", "ℍ" ) ),
		"Hs" => array( "names" => array( "trok;", "cr;" ), "refs" => array( "Ħ", "ℋ" ) ),
		"Hu" => array( "names" => array( "mpDownHump;", "mpEqual;" ), "refs" => array( "≎", "≏" ) ),
		"IE" => array( "names" => array( "cy;" ), "refs" => array( "Е" ) ),
		"IJ" => array( "names" => array( "lig;" ), "refs" => array( "Ĳ" ) ),
		"IO" => array( "names" => array( "cy;" ), "refs" => array( "Ё" ) ),
		"Ia" => array( "names" => array( "cute;", "cute" ), "refs" => array( "Í", "Í" ) ),
		"Ic" => array( "names" => array( "irc;", "irc", "y;" ), "refs" => array( "Î", "Î", "И" ) ),
		"Id" => array( "names" => array( "ot;" ), "refs" => array( "İ" ) ),
		"If" => array( "names" => array( "r;" ), "refs" => array( "ℑ" ) ),
		"Ig" => array( "names" => array( "rave;", "rave" ), "refs" => array( "Ì", "Ì" ) ),
		"Im" => array( "names" => array( "aginaryI;", "plies;", "acr;", ";" ), "refs" => array( "ⅈ", "⇒", "Ī", "ℑ" ) ),
		"In" => array( "names" => array( "visibleComma;", "visibleTimes;", "tersection;", "tegral;", "t;" ), "refs" => array( "", "", "⋂", "∫", "∬" ) ),
		"Io" => array( "names" => array( "gon;", "pf;", "ta;" ), "refs" => array( "Į", "𝕀", "Ι" ) ),
		"Is" => array( "names" => array( "cr;" ), "refs" => array( "ℐ" ) ),
		"It" => array( "names" => array( "ilde;" ), "refs" => array( "Ĩ" ) ),
		"Iu" => array( "names" => array( "kcy;", "ml;", "ml" ), "refs" => array( "І", "Ï", "Ï" ) ),
		"Jc" => array( "names" => array( "irc;", "y;" ), "refs" => array( "Ĵ", "Й" ) ),
		"Jf" => array( "names" => array( "r;" ), "refs" => array( "𝔍" ) ),
		"Jo" => array( "names" => array( "pf;" ), "refs" => array( "𝕁" ) ),
		"Js" => array( "names" => array( "ercy;", "cr;" ), "refs" => array( "Ј", "𝒥" ) ),
		"Ju" => array( "names" => array( "kcy;" ), "refs" => array( "Є" ) ),
		"KH" => array( "names" => array( "cy;" ), "refs" => array( "Х" ) ),
		"KJ" => array( "names" => array( "cy;" ), "refs" => array( "Ќ" ) ),
		"Ka" => array( "names" => array( "ppa;" ), "refs" => array( "Κ" ) ),
		"Kc" => array( "names" => array( "edil;", "y;" ), "refs" => array( "Ķ", "К" ) ),
		"Kf" => array( "names" => array( "r;" ), "refs" => array( "𝔎" ) ),
		"Ko" => array( "names" => array( "pf;" ), "refs" => array( "𝕂" ) ),
		"Ks" => array( "names" => array( "cr;" ), "refs" => array( "𝒦" ) ),
		"LJ" => array( "names" => array( "cy;" ), "refs" => array( "Љ" ) ),
		"LT" => array( "names" => array( ";", "" ), "refs" => array( "<", "<" ) ),
		"La" => array( "names" => array( "placetrf;", "cute;", "mbda;", "ng;", "rr;" ), "refs" => array( "ℒ", "Ĺ", "Λ", "⟪", "↞" ) ),
		"Lc" => array( "names" => array( "aron;", "edil;", "y;" ), "refs" => array( "Ľ", "Ļ", "Л" ) ),
		"Le" => array( "names" => array( "ftArrowRightArrow;", "ftDoubleBracket;", "ftDownTeeVector;", "ftDownVectorBar;", "ftTriangleEqual;", "ftAngleBracket;", "ftUpDownVector;", "ssEqualGreater;", "ftRightVector;", "ftTriangleBar;", "ftUpTeeVector;", "ftUpVectorBar;", "ftDownVector;", "ftRightArrow;", "ftrightarrow;", "ssSlantEqual;", "ftTeeVector;", "ftVectorBar;", "ssFullEqual;", "ftArrowBar;", "ftTeeArrow;", "ftTriangle;", "ftUpVector;", "ftCeiling;", "ssGreater;", "ftVector;", "ftArrow;", "ftFloor;", "ftarrow;", "ssTilde;", "ssLess;", "ftTee;" ), "refs" => array( "⇆", "⟦", "⥡", "⥙", "⊴", "⟨", "⥑", "⋚", "⥎", "⧏", "⥠", "⥘", "⇃", "↔", "⇔", "⩽", "⥚", "⥒", "≦", "⇤", "↤", "⊲", "↿", "⌈", "≶", "↼", "←", "⌊", "⇐", "≲", "⪡", "⊣" ) ),
		"Lf" => array( "names" => array( "r;" ), "refs" => array( "𝔏" ) ),
		"Ll" => array( "names" => array( "eftarrow;", ";" ), "refs" => array( "⇚", "⋘" ) ),
		"Lm" => array( "names" => array( "idot;" ), "refs" => array( "Ŀ" ) ),
		"Lo" => array( "names" => array( "ngLeftRightArrow;", "ngleftrightarrow;", "werRightArrow;", "ngRightArrow;", "ngrightarrow;", "werLeftArrow;", "ngLeftArrow;", "ngleftarrow;", "pf;" ), "refs" => array( "⟷", "⟺", "↘", "⟶", "⟹", "↙", "⟵", "⟸", "𝕃" ) ),
		"Ls" => array( "names" => array( "trok;", "cr;", "h;" ), "refs" => array( "Ł", "ℒ", "↰" ) ),
		"Lt" => array( "names" => array( ";" ), "refs" => array( "≪" ) ),
		"Ma" => array( "names" => array( "p;" ), "refs" => array( "⤅" ) ),
		"Mc" => array( "names" => array( "y;" ), "refs" => array( "М" ) ),
		"Me" => array( "names" => array( "diumSpace;", "llintrf;" ), "refs" => array( " ", "ℳ" ) ),
		"Mf" => array( "names" => array( "r;" ), "refs" => array( "𝔐" ) ),
		"Mi" => array( "names" => array( "nusPlus;" ), "refs" => array( "∓" ) ),
		"Mo" => array( "names" => array( "pf;" ), "refs" => array( "𝕄" ) ),
		"Ms" => array( "names" => array( "cr;" ), "refs" => array( "ℳ" ) ),
		"Mu" => array( "names" => array( ";" ), "refs" => array( "Μ" ) ),
		"NJ" => array( "names" => array( "cy;" ), "refs" => array( "Њ" ) ),
		"Na" => array( "names" => array( "cute;" ), "refs" => array( "Ń" ) ),
		"Nc" => array( "names" => array( "aron;", "edil;", "y;" ), "refs" => array( "Ň", "Ņ", "Н" ) ),
		"Ne" => array( "names" => array( "gativeVeryThinSpace;", "stedGreaterGreater;", "gativeMediumSpace;", "gativeThickSpace;", "gativeThinSpace;", "stedLessLess;", "wLine;" ), "refs" => array( "", "≫", "", "", "", "≪", "\x0A" ) ),
		"Nf" => array( "names" => array( "r;" ), "refs" => array( "𝔑" ) ),
		"No" => array( "names" => array( "tNestedGreaterGreater;", "tSquareSupersetEqual;", "tPrecedesSlantEqual;", "tRightTriangleEqual;", "tSucceedsSlantEqual;", "tDoubleVerticalBar;", "tGreaterSlantEqual;", "tLeftTriangleEqual;", "tSquareSubsetEqual;", "tGreaterFullEqual;", "tRightTriangleBar;", "tLeftTriangleBar;", "tGreaterGreater;", "tLessSlantEqual;", "tNestedLessLess;", "tReverseElement;", "tSquareSuperset;", "tTildeFullEqual;", "nBreakingSpace;", "tPrecedesEqual;", "tRightTriangle;", "tSucceedsEqual;", "tSucceedsTilde;", "tSupersetEqual;", "tGreaterEqual;", "tGreaterTilde;", "tHumpDownHump;", "tLeftTriangle;", "tSquareSubset;", "tGreaterLess;", "tLessGreater;", "tSubsetEqual;", "tVerticalBar;", "tEqualTilde;", "tTildeEqual;", "tTildeTilde;", "tCongruent;", "tHumpEqual;", "tLessEqual;", "tLessTilde;", "tLessLess;", "tPrecedes;", "tSucceeds;", "tSuperset;", "tElement;", "tGreater;", "tCupCap;", "tExists;", "tSubset;", "tEqual;", "tTilde;", "Break;", "tLess;", "pf;", "t;" ), "refs" => array( "⪢̸", "⋣", "⋠", "⋭", "⋡", "∦", "⩾̸", "⋬", "⋢", "≧̸", "⧐̸", "⧏̸", "≫̸", "⩽̸", "⪡̸", "∌", "⊐̸", "≇", " ", "⪯̸", "⋫", "⪰̸", "≿̸", "⊉", "≱", "≵", "≎̸", "⋪", "⊏̸", "≹", "≸", "⊈", "∤", "≂̸", "≄", "≉", "≢", "≏̸", "≰", "≴", "≪̸", "⊀", "⊁", "⊃⃒", "∉", "≯", "≭", "∄", "⊂⃒", "≠", "≁", "", "≮", "ℕ", "⫬" ) ),
		"Ns" => array( "names" => array( "cr;" ), "refs" => array( "𝒩" ) ),
		"Nt" => array( "names" => array( "ilde;", "ilde" ), "refs" => array( "Ñ", "Ñ" ) ),
		"Nu" => array( "names" => array( ";" ), "refs" => array( "Ν" ) ),
		"OE" => array( "names" => array( "lig;" ), "refs" => array( "Œ" ) ),
		"Oa" => array( "names" => array( "cute;", "cute" ), "refs" => array( "Ó", "Ó" ) ),
		"Oc" => array( "names" => array( "irc;", "irc", "y;" ), "refs" => array( "Ô", "Ô", "О" ) ),
		"Od" => array( "names" => array( "blac;" ), "refs" => array( "Ő" ) ),
		"Of" => array( "names" => array( "r;" ), "refs" => array( "𝔒" ) ),
		"Og" => array( "names" => array( "rave;", "rave" ), "refs" => array( "Ò", "Ò" ) ),
		"Om" => array( "names" => array( "icron;", "acr;", "ega;" ), "refs" => array( "Ο", "Ō", "Ω" ) ),
		"Oo" => array( "names" => array( "pf;" ), "refs" => array( "𝕆" ) ),
		"Op" => array( "names" => array( "enCurlyDoubleQuote;", "enCurlyQuote;" ), "refs" => array( "“", "‘" ) ),
		"Or" => array( "names" => array( ";" ), "refs" => array( "⩔" ) ),
		"Os" => array( "names" => array( "lash;", "lash", "cr;" ), "refs" => array( "Ø", "Ø", "𝒪" ) ),
		"Ot" => array( "names" => array( "ilde;", "imes;", "ilde" ), "refs" => array( "Õ", "⨷", "Õ" ) ),
		"Ou" => array( "names" => array( "ml;", "ml" ), "refs" => array( "Ö", "Ö" ) ),
		"Ov" => array( "names" => array( "erParenthesis;", "erBracket;", "erBrace;", "erBar;" ), "refs" => array( "⏜", "⎴", "⏞", "‾" ) ),
		"Pa" => array( "names" => array( "rtialD;" ), "refs" => array( "∂" ) ),
		"Pc" => array( "names" => array( "y;" ), "refs" => array( "П" ) ),
		"Pf" => array( "names" => array( "r;" ), "refs" => array( "𝔓" ) ),
		"Ph" => array( "names" => array( "i;" ), "refs" => array( "Φ" ) ),
		"Pi" => array( "names" => array( ";" ), "refs" => array( "Π" ) ),
		"Pl" => array( "names" => array( "usMinus;" ), "refs" => array( "±" ) ),
		"Po" => array( "names" => array( "incareplane;", "pf;" ), "refs" => array( "ℌ", "ℙ" ) ),
		"Pr" => array( "names" => array( "ecedesSlantEqual;", "ecedesEqual;", "ecedesTilde;", "oportional;", "oportion;", "ecedes;", "oduct;", "ime;", ";" ), "refs" => array( "≼", "⪯", "≾", "∝", "∷", "≺", "∏", "″", "⪻" ) ),
		"Ps" => array( "names" => array( "cr;", "i;" ), "refs" => array( "𝒫", "Ψ" ) ),
		"QU" => array( "names" => array( "OT;", "OT" ), "refs" => array( "\"", "\"" ) ),
		"Qf" => array( "names" => array( "r;" ), "refs" => array( "𝔔" ) ),
		"Qo" => array( "names" => array( "pf;" ), "refs" => array( "ℚ" ) ),
		"Qs" => array( "names" => array( "cr;" ), "refs" => array( "𝒬" ) ),
		"RB" => array( "names" => array( "arr;" ), "refs" => array( "⤐" ) ),
		"RE" => array( "names" => array( "G;", "G" ), "refs" => array( "®", "®" ) ),
		"Ra" => array( "names" => array( "cute;", "rrtl;", "ng;", "rr;" ), "refs" => array( "Ŕ", "⤖", "⟫", "↠" ) ),
		"Rc" => array( "names" => array( "aron;", "edil;", "y;" ), "refs" => array( "Ř", "Ŗ", "Р" ) ),
		"Re" => array( "names" => array( "verseUpEquilibrium;", "verseEquilibrium;", "verseElement;", ";" ), "refs" => array( "⥯", "⇋", "∋", "ℜ" ) ),
		"Rf" => array( "names" => array( "r;" ), "refs" => array( "ℜ" ) ),
		"Rh" => array( "names" => array( "o;" ), "refs" => array( "Ρ" ) ),
		"Ri" => array( "names" => array( "ghtArrowLeftArrow;", "ghtDoubleBracket;", "ghtDownTeeVector;", "ghtDownVectorBar;", "ghtTriangleEqual;", "ghtAngleBracket;", "ghtUpDownVector;", "ghtTriangleBar;", "ghtUpTeeVector;", "ghtUpVectorBar;", "ghtDownVector;", "ghtTeeVector;", "ghtVectorBar;", "ghtArrowBar;", "ghtTeeArrow;", "ghtTriangle;", "ghtUpVector;", "ghtCeiling;", "ghtVector;", "ghtArrow;", "ghtFloor;", "ghtarrow;", "ghtTee;" ), "refs" => array( "⇄", "⟧", "⥝", "⥕", "⊵", "⟩", "⥏", "⧐", "⥜", "⥔", "⇂", "⥛", "⥓", "⇥", "↦", "⊳", "↾", "⌉", "⇀", "→", "⌋", "⇒", "⊢" ) ),
		"Ro" => array( "names" => array( "undImplies;", "pf;" ), "refs" => array( "⥰", "ℝ" ) ),
		"Rr" => array( "names" => array( "ightarrow;" ), "refs" => array( "⇛" ) ),
		"Rs" => array( "names" => array( "cr;", "h;" ), "refs" => array( "ℛ", "↱" ) ),
		"Ru" => array( "names" => array( "leDelayed;" ), "refs" => array( "⧴" ) ),
		"SH" => array( "names" => array( "CHcy;", "cy;" ), "refs" => array( "Щ", "Ш" ) ),
		"SO" => array( "names" => array( "FTcy;" ), "refs" => array( "Ь" ) ),
		"Sa" => array( "names" => array( "cute;" ), "refs" => array( "Ś" ) ),
		"Sc" => array( "names" => array( "aron;", "edil;", "irc;", "y;", ";" ), "refs" => array( "Š", "Ş", "Ŝ", "С", "⪼" ) ),
		"Sf" => array( "names" => array( "r;" ), "refs" => array( "𝔖" ) ),
		"Sh" => array( "names" => array( "ortRightArrow;", "ortDownArrow;", "ortLeftArrow;", "ortUpArrow;" ), "refs" => array( "→", "↓", "←", "↑" ) ),
		"Si" => array( "names" => array( "gma;" ), "refs" => array( "Σ" ) ),
		"Sm" => array( "names" => array( "allCircle;" ), "refs" => array( "∘" ) ),
		"So" => array( "names" => array( "pf;" ), "refs" => array( "𝕊" ) ),
		"Sq" => array( "names" => array( "uareSupersetEqual;", "uareIntersection;", "uareSubsetEqual;", "uareSuperset;", "uareSubset;", "uareUnion;", "uare;", "rt;" ), "refs" => array( "⊒", "⊓", "⊑", "⊐", "⊏", "⊔", "□", "√" ) ),
		"Ss" => array( "names" => array( "cr;" ), "refs" => array( "𝒮" ) ),
		"St" => array( "names" => array( "ar;" ), "refs" => array( "⋆" ) ),
		"Su" => array( "names" => array( "cceedsSlantEqual;", "cceedsEqual;", "cceedsTilde;", "persetEqual;", "bsetEqual;", "cceeds;", "chThat;", "perset;", "bset;", "pset;", "b;", "m;", "p;" ), "refs" => array( "≽", "⪰", "≿", "⊇", "⊆", "≻", "∋", "⊃", "⋐", "⋑", "⋐", "∑", "⋑" ) ),
		"TH" => array( "names" => array( "ORN;", "ORN" ), "refs" => array( "Þ", "Þ" ) ),
		"TR" => array( "names" => array( "ADE;" ), "refs" => array( "™" ) ),
		"TS" => array( "names" => array( "Hcy;", "cy;" ), "refs" => array( "Ћ", "Ц" ) ),
		"Ta" => array( "names" => array( "b;", "u;" ), "refs" => array( "	", "Τ" ) ),
		"Tc" => array( "names" => array( "aron;", "edil;", "y;" ), "refs" => array( "Ť", "Ţ", "Т" ) ),
		"Tf" => array( "names" => array( "r;" ), "refs" => array( "𝔗" ) ),
		"Th" => array( "names" => array( "ickSpace;", "erefore;", "inSpace;", "eta;" ), "refs" => array( "  ", "∴", " ", "Θ" ) ),
		"Ti" => array( "names" => array( "ldeFullEqual;", "ldeEqual;", "ldeTilde;", "lde;" ), "refs" => array( "≅", "≃", "≈", "∼" ) ),
		"To" => array( "names" => array( "pf;" ), "refs" => array( "𝕋" ) ),
		"Tr" => array( "names" => array( "ipleDot;" ), "refs" => array( "⃛" ) ),
		"Ts" => array( "names" => array( "trok;", "cr;" ), "refs" => array( "Ŧ", "𝒯" ) ),
		"Ua" => array( "names" => array( "rrocir;", "cute;", "cute", "rr;" ), "refs" => array( "⥉", "Ú", "Ú", "↟" ) ),
		"Ub" => array( "names" => array( "reve;", "rcy;" ), "refs" => array( "Ŭ", "Ў" ) ),
		"Uc" => array( "names" => array( "irc;", "irc", "y;" ), "refs" => array( "Û", "Û", "У" ) ),
		"Ud" => array( "names" => array( "blac;" ), "refs" => array( "Ű" ) ),
		"Uf" => array( "names" => array( "r;" ), "refs" => array( "𝔘" ) ),
		"Ug" => array( "names" => array( "rave;", "rave" ), "refs" => array( "Ù", "Ù" ) ),
		"Um" => array( "names" => array( "acr;" ), "refs" => array( "Ū" ) ),
		"Un" => array( "names" => array( "derParenthesis;", "derBracket;", "derBrace;", "ionPlus;", "derBar;", "ion;" ), "refs" => array( "⏝", "⎵", "⏟", "⊎", "_", "⋃" ) ),
		"Uo" => array( "names" => array( "gon;", "pf;" ), "refs" => array( "Ų", "𝕌" ) ),
		"Up" => array( "names" => array( "ArrowDownArrow;", "perRightArrow;", "perLeftArrow;", "Equilibrium;", "DownArrow;", "downarrow;", "ArrowBar;", "TeeArrow;", "Arrow;", "arrow;", "silon;", "Tee;", "si;" ), "refs" => array( "⇅", "↗", "↖", "⥮", "↕", "⇕", "⤒", "↥", "↑", "⇑", "Υ", "⊥", "ϒ" ) ),
		"Ur" => array( "names" => array( "ing;" ), "refs" => array( "Ů" ) ),
		"Us" => array( "names" => array( "cr;" ), "refs" => array( "𝒰" ) ),
		"Ut" => array( "names" => array( "ilde;" ), "refs" => array( "Ũ" ) ),
		"Uu" => array( "names" => array( "ml;", "ml" ), "refs" => array( "Ü", "Ü" ) ),
		"VD" => array( "names" => array( "ash;" ), "refs" => array( "⊫" ) ),
		"Vb" => array( "names" => array( "ar;" ), "refs" => array( "⫫" ) ),
		"Vc" => array( "names" => array( "y;" ), "refs" => array( "В" ) ),
		"Vd" => array( "names" => array( "ashl;", "ash;" ), "refs" => array( "⫦", "⊩" ) ),
		"Ve" => array( "names" => array( "rticalSeparator;", "rticalTilde;", "ryThinSpace;", "rticalLine;", "rticalBar;", "rbar;", "rt;", "e;" ), "refs" => array( "❘", "≀", " ", "|", "∣", "‖", "‖", "⋁" ) ),
		"Vf" => array( "names" => array( "r;" ), "refs" => array( "𝔙" ) ),
		"Vo" => array( "names" => array( "pf;" ), "refs" => array( "𝕍" ) ),
		"Vs" => array( "names" => array( "cr;" ), "refs" => array( "𝒱" ) ),
		"Vv" => array( "names" => array( "dash;" ), "refs" => array( "⊪" ) ),
		"Wc" => array( "names" => array( "irc;" ), "refs" => array( "Ŵ" ) ),
		"We" => array( "names" => array( "dge;" ), "refs" => array( "⋀" ) ),
		"Wf" => array( "names" => array( "r;" ), "refs" => array( "𝔚" ) ),
		"Wo" => array( "names" => array( "pf;" ), "refs" => array( "𝕎" ) ),
		"Ws" => array( "names" => array( "cr;" ), "refs" => array( "𝒲" ) ),
		"Xf" => array( "names" => array( "r;" ), "refs" => array( "𝔛" ) ),
		"Xi" => array( "names" => array( ";" ), "refs" => array( "Ξ" ) ),
		"Xo" => array( "names" => array( "pf;" ), "refs" => array( "𝕏" ) ),
		"Xs" => array( "names" => array( "cr;" ), "refs" => array( "𝒳" ) ),
		"YA" => array( "names" => array( "cy;" ), "refs" => array( "Я" ) ),
		"YI" => array( "names" => array( "cy;" ), "refs" => array( "Ї" ) ),
		"YU" => array( "names" => array( "cy;" ), "refs" => array( "Ю" ) ),
		"Ya" => array( "names" => array( "cute;", "cute" ), "refs" => array( "Ý", "Ý" ) ),
		"Yc" => array( "names" => array( "irc;", "y;" ), "refs" => array( "Ŷ", "Ы" ) ),
		"Yf" => array( "names" => array( "r;" ), "refs" => array( "𝔜" ) ),
		"Yo" => array( "names" => array( "pf;" ), "refs" => array( "𝕐" ) ),
		"Ys" => array( "names" => array( "cr;" ), "refs" => array( "𝒴" ) ),
		"Yu" => array( "names" => array( "ml;" ), "refs" => array( "Ÿ" ) ),
		"ZH" => array( "names" => array( "cy;" ), "refs" => array( "Ж" ) ),
		"Za" => array( "names" => array( "cute;" ), "refs" => array( "Ź" ) ),
		"Zc" => array( "names" => array( "aron;", "y;" ), "refs" => array( "Ž", "З" ) ),
		"Zd" => array( "names" => array( "ot;" ), "refs" => array( "Ż" ) ),
		"Ze" => array( "names" => array( "roWidthSpace;", "ta;" ), "refs" => array( "", "Ζ" ) ),
		"Zf" => array( "names" => array( "r;" ), "refs" => array( "ℨ" ) ),
		"Zo" => array( "names" => array( "pf;" ), "refs" => array( "ℤ" ) ),
		"Zs" => array( "names" => array( "cr;" ), "refs" => array( "𝒵" ) ),
		"aa" => array( "names" => array( "cute;", "cute" ), "refs" => array( "á", "á" ) ),
		"ab" => array( "names" => array( "reve;" ), "refs" => array( "ă" ) ),
		"ac" => array( "names" => array( "irc;", "ute;", "irc", "ute", "E;", "d;", "y;", ";" ), "refs" => array( "â", "´", "â", "´", "∾̳", "∿", "а", "∾" ) ),
		"ae" => array( "names" => array( "lig;", "lig" ), "refs" => array( "æ", "æ" ) ),
		"af" => array( "names" => array( "r;", ";" ), "refs" => array( "𝔞", "" ) ),
		"ag" => array( "names" => array( "rave;", "rave" ), "refs" => array( "à", "à" ) ),
		"al" => array( "names" => array( "efsym;", "eph;", "pha;" ), "refs" => array( "ℵ", "ℵ", "α" ) ),
		"am" => array( "names" => array( "acr;", "alg;", "p;", "p" ), "refs" => array( "ā", "⨿", "&", "&" ) ),
		"an" => array( "names" => array( "dslope;", "gmsdaa;", "gmsdab;", "gmsdac;", "gmsdad;", "gmsdae;", "gmsdaf;", "gmsdag;", "gmsdah;", "grtvbd;", "grtvb;", "gzarr;", "dand;", "gmsd;", "gsph;", "gle;", "grt;", "gst;", "dd;", "dv;", "ge;", "d;", "g;" ), "refs" => array( "⩘", "⦨", "⦩", "⦪", "⦫", "⦬", "⦭", "⦮", "⦯", "⦝", "⊾", "⍼", "⩕", "∡", "∢", "∠", "∟", "Å", "⩜", "⩚", "⦤", "∧", "∠" ) ),
		"ao" => array( "names" => array( "gon;", "pf;" ), "refs" => array( "ą", "𝕒" ) ),
		"ap" => array( "names" => array( "proxeq;", "acir;", "prox;", "id;", "os;", "E;", "e;", ";" ), "refs" => array( "≊", "⩯", "≈", "≋", "'", "⩰", "≊", "≈" ) ),
		"ar" => array( "names" => array( "ing;", "ing" ), "refs" => array( "å", "å" ) ),
		"as" => array( "names" => array( "ympeq;", "ymp;", "cr;", "t;" ), "refs" => array( "≍", "≈", "𝒶", "*" ) ),
		"at" => array( "names" => array( "ilde;", "ilde" ), "refs" => array( "ã", "ã" ) ),
		"au" => array( "names" => array( "ml;", "ml" ), "refs" => array( "ä", "ä" ) ),
		"aw" => array( "names" => array( "conint;", "int;" ), "refs" => array( "∳", "⨑" ) ),
		"bN" => array( "names" => array( "ot;" ), "refs" => array( "⫭" ) ),
		"ba" => array( "names" => array( "ckepsilon;", "ckprime;", "cksimeq;", "ckcong;", "rwedge;", "cksim;", "rvee;", "rwed;" ), "refs" => array( "϶", "‵", "⋍", "≌", "⌅", "∽", "⊽", "⌅" ) ),
		"bb" => array( "names" => array( "rktbrk;", "rk;" ), "refs" => array( "⎶", "⎵" ) ),
		"bc" => array( "names" => array( "ong;", "y;" ), "refs" => array( "≌", "б" ) ),
		"bd" => array( "names" => array( "quo;" ), "refs" => array( "„" ) ),
		"be" => array( "names" => array( "cause;", "mptyv;", "tween;", "caus;", "rnou;", "psi;", "ta;", "th;" ), "refs" => array( "∵", "⦰", "≬", "∵", "ℬ", "϶", "β", "ℶ" ) ),
		"bf" => array( "names" => array( "r;" ), "refs" => array( "𝔟" ) ),
		"bi" => array( "names" => array( "gtriangledown;", "gtriangleup;", "gotimes;", "goplus;", "gsqcup;", "guplus;", "gwedge;", "gcirc;", "godot;", "gstar;", "gcap;", "gcup;", "gvee;" ), "refs" => array( "▽", "△", "⨂", "⨁", "⨆", "⨄", "⋀", "◯", "⨀", "★", "⋂", "⋃", "⋁" ) ),
		"bk" => array( "names" => array( "arow;" ), "refs" => array( "⤍" ) ),
		"bl" => array( "names" => array( "acktriangleright;", "acktriangledown;", "acktriangleleft;", "acktriangle;", "acklozenge;", "acksquare;", "ank;", "k12;", "k14;", "k34;", "ock;" ), "refs" => array( "▸", "▾", "◂", "▴", "⧫", "▪", "␣", "▒", "░", "▓", "█" ) ),
		"bn" => array( "names" => array( "equiv;", "ot;", "e;" ), "refs" => array( "≡⃥", "⌐", "=⃥" ) ),
		"bo" => array( "names" => array( "xminus;", "xtimes;", "xplus;", "ttom;", "wtie;", "xbox;", "xDL;", "xDR;", "xDl;", "xDr;", "xHD;", "xHU;", "xHd;", "xHu;", "xUL;", "xUR;", "xUl;", "xUr;", "xVH;", "xVL;", "xVR;", "xVh;", "xVl;", "xVr;", "xdL;", "xdR;", "xdl;", "xdr;", "xhD;", "xhU;", "xhd;", "xhu;", "xuL;", "xuR;", "xul;", "xur;", "xvH;", "xvL;", "xvR;", "xvh;", "xvl;", "xvr;", "pf;", "xH;", "xV;", "xh;", "xv;", "t;" ), "refs" => array( "⊟", "⊠", "⊞", "⊥", "⋈", "⧉", "╗", "╔", "╖", "╓", "╦", "╩", "╤", "╧", "╝", "╚", "╜", "╙", "╬", "╣", "╠", "╫", "╢", "╟", "╕", "╒", "┐", "┌", "╥", "╨", "┬", "┴", "╛", "╘", "┘", "└", "╪", "╡", "╞", "┼", "┤", "├", "𝕓", "═", "║", "─", "│", "⊥" ) ),
		"bp" => array( "names" => array( "rime;" ), "refs" => array( "‵" ) ),
		"br" => array( "names" => array( "vbar;", "eve;", "vbar" ), "refs" => array( "¦", "˘", "¦" ) ),
		"bs" => array( "names" => array( "olhsub;", "emi;", "ime;", "olb;", "cr;", "im;", "ol;" ), "refs" => array( "⟈", "⁏", "⋍", "⧅", "𝒷", "∽", "\"" ) ),
		"bu" => array( "names" => array( "llet;", "mpeq;", "mpE;", "mpe;", "ll;", "mp;" ), "refs" => array( "•", "≏", "⪮", "≏", "•", "≎" ) ),
		"ca" => array( "names" => array( "pbrcup;", "cute;", "pand;", "pcap;", "pcup;", "pdot;", "ret;", "ron;", "ps;", "p;" ), "refs" => array( "⩉", "ć", "⩄", "⩋", "⩇", "⩀", "⁁", "ˇ", "∩︀", "∩" ) ),
		"cc" => array( "names" => array( "upssm;", "aron;", "edil;", "aps;", "edil", "irc;", "ups;" ), "refs" => array( "⩐", "č", "ç", "⩍", "ç", "ĉ", "⩌" ) ),
		"cd" => array( "names" => array( "ot;" ), "refs" => array( "ċ" ) ),
		"ce" => array( "names" => array( "nterdot;", "mptyv;", "dil;", "dil", "nt;", "nt" ), "refs" => array( "·", "⦲", "¸", "¸", "¢", "¢" ) ),
		"cf" => array( "names" => array( "r;" ), "refs" => array( "𝔠" ) ),
		"ch" => array( "names" => array( "eckmark;", "eck;", "cy;", "i;" ), "refs" => array( "✓", "✓", "ч", "χ" ) ),
		"ci" => array( "names" => array( "rclearrowright;", "rclearrowleft;", "rcledcirc;", "rcleddash;", "rcledast;", "rcledR;", "rcledS;", "rfnint;", "rscir;", "rceq;", "rmid;", "rE;", "rc;", "re;", "r;" ), "refs" => array( "↻", "↺", "⊚", "⊝", "⊛", "®", "Ⓢ", "⨐", "⧂", "≗", "⫯", "⧃", "ˆ", "≗", "○" ) ),
		"cl" => array( "names" => array( "ubsuit;", "ubs;" ), "refs" => array( "♣", "♣" ) ),
		"co" => array( "names" => array( "mplement;", "mplexes;", "loneq;", "ngdot;", "lone;", "mmat;", "mpfn;", "nint;", "prod;", "pysr;", "lon;", "mma;", "mp;", "ng;", "pf;", "py;", "py" ), "refs" => array( "∁", "ℂ", "≔", "⩭", "≔", "@", "∘", "∮", "∐", "℗", ":", ",", "∁", "≅", "𝕔", "©", "©" ) ),
		"cr" => array( "names" => array( "arr;", "oss;" ), "refs" => array( "↵", "✗" ) ),
		"cs" => array( "names" => array( "ube;", "upe;", "cr;", "ub;", "up;" ), "refs" => array( "⫑", "⫒", "𝒸", "⫏", "⫐" ) ),
		"ct" => array( "names" => array( "dot;" ), "refs" => array( "⋯" ) ),
		"cu" => array( "names" => array( "rvearrowright;", "rvearrowleft;", "rlyeqprec;", "rlyeqsucc;", "rlywedge;", "pbrcap;", "rlyvee;", "darrl;", "darrr;", "larrp;", "rarrm;", "larr;", "pcap;", "pcup;", "pdot;", "rarr;", "rren;", "epr;", "esc;", "por;", "rren", "vee;", "wed;", "ps;", "p;" ), "refs" => array( "↷", "↶", "⋞", "⋟", "⋏", "⩈", "⋎", "⤸", "⤵", "⤽", "⤼", "↶", "⩆", "⩊", "⊍", "↷", "¤", "⋞", "⋟", "⩅", "¤", "⋎", "⋏", "∪︀", "∪" ) ),
		"cw" => array( "names" => array( "conint;", "int;" ), "refs" => array( "∲", "∱" ) ),
		"cy" => array( "names" => array( "lcty;" ), "refs" => array( "⌭" ) ),
		"dA" => array( "names" => array( "rr;" ), "refs" => array( "⇓" ) ),
		"dH" => array( "names" => array( "ar;" ), "refs" => array( "⥥" ) ),
		"da" => array( "names" => array( "gger;", "leth;", "shv;", "rr;", "sh;" ), "refs" => array( "†", "ℸ", "⊣", "↓", "‐" ) ),
		"db" => array( "names" => array( "karow;", "lac;" ), "refs" => array( "⤏", "˝" ) ),
		"dc" => array( "names" => array( "aron;", "y;" ), "refs" => array( "ď", "д" ) ),
		"dd" => array( "names" => array( "agger;", "otseq;", "arr;", ";" ), "refs" => array( "‡", "⩷", "⇊", "ⅆ" ) ),
		"de" => array( "names" => array( "mptyv;", "lta;", "g;", "g" ), "refs" => array( "⦱", "δ", "°", "°" ) ),
		"df" => array( "names" => array( "isht;", "r;" ), "refs" => array( "⥿", "𝔡" ) ),
		"dh" => array( "names" => array( "arl;", "arr;" ), "refs" => array( "⇃", "⇂" ) ),
		"di" => array( "names" => array( "videontimes;", "amondsuit;", "amond;", "gamma;", "vide;", "vonx;", "ams;", "sin;", "vide", "am;", "e;", "v;" ), "refs" => array( "⋇", "♦", "⋄", "ϝ", "÷", "⋇", "♦", "⋲", "÷", "⋄", "¨", "÷" ) ),
		"dj" => array( "names" => array( "cy;" ), "refs" => array( "ђ" ) ),
		"dl" => array( "names" => array( "corn;", "crop;" ), "refs" => array( "⌞", "⌍" ) ),
		"do" => array( "names" => array( "wnharpoonright;", "wnharpoonleft;", "ublebarwedge;", "wndownarrows;", "tsquare;", "wnarrow;", "teqdot;", "tminus;", "tplus;", "llar;", "teq;", "pf;", "t;" ), "refs" => array( "⇂", "⇃", "⌆", "⇊", "⊡", "↓", "≑", "∸", "∔", "$", "≐", "𝕕", "˙" ) ),
		"dr" => array( "names" => array( "bkarow;", "corn;", "crop;" ), "refs" => array( "⤐", "⌟", "⌌" ) ),
		"ds" => array( "names" => array( "trok;", "cr;", "cy;", "ol;" ), "refs" => array( "đ", "𝒹", "ѕ", "⧶" ) ),
		"dt" => array( "names" => array( "dot;", "rif;", "ri;" ), "refs" => array( "⋱", "▾", "▿" ) ),
		"du" => array( "names" => array( "arr;", "har;" ), "refs" => array( "⇵", "⥯" ) ),
		"dw" => array( "names" => array( "angle;" ), "refs" => array( "⦦" ) ),
		"dz" => array( "names" => array( "igrarr;", "cy;" ), "refs" => array( "⟿", "џ" ) ),
		"eD" => array( "names" => array( "Dot;", "ot;" ), "refs" => array( "⩷", "≑" ) ),
		"ea" => array( "names" => array( "cute;", "ster;", "cute" ), "refs" => array( "é", "⩮", "é" ) ),
		"ec" => array( "names" => array( "aron;", "olon;", "irc;", "ir;", "irc", "y;" ), "refs" => array( "ě", "≕", "ê", "≖", "ê", "э" ) ),
		"ed" => array( "names" => array( "ot;" ), "refs" => array( "ė" ) ),
		"ee" => array( "names" => array( ";" ), "refs" => array( "ⅇ" ) ),
		"ef" => array( "names" => array( "Dot;", "r;" ), "refs" => array( "≒", "𝔢" ) ),
		"eg" => array( "names" => array( "rave;", "sdot;", "rave", "s;", ";" ), "refs" => array( "è", "⪘", "è", "⪖", "⪚" ) ),
		"el" => array( "names" => array( "inters;", "sdot;", "l;", "s;", ";" ), "refs" => array( "⏧", "⪗", "ℓ", "⪕", "⪙" ) ),
		"em" => array( "names" => array( "ptyset;", "ptyv;", "sp13;", "sp14;", "acr;", "pty;", "sp;" ), "refs" => array( "∅", "∅", " ", " ", "ē", "∅", " " ) ),
		"en" => array( "names" => array( "sp;", "g;" ), "refs" => array( " ", "ŋ" ) ),
		"eo" => array( "names" => array( "gon;", "pf;" ), "refs" => array( "ę", "𝕖" ) ),
		"ep" => array( "names" => array( "silon;", "arsl;", "lus;", "siv;", "ar;", "si;" ), "refs" => array( "ε", "⧣", "⩱", "ϵ", "⋕", "ε" ) ),
		"eq" => array( "names" => array( "slantless;", "slantgtr;", "vparsl;", "colon;", "uivDD;", "circ;", "uals;", "uest;", "sim;", "uiv;" ), "refs" => array( "⪕", "⪖", "⧥", "≕", "⩸", "≖", "=", "≟", "≂", "≡" ) ),
		"er" => array( "names" => array( "Dot;", "arr;" ), "refs" => array( "≓", "⥱" ) ),
		"es" => array( "names" => array( "dot;", "cr;", "im;" ), "refs" => array( "≐", "ℯ", "≂" ) ),
		"et" => array( "names" => array( "a;", "h;", "h" ), "refs" => array( "η", "ð", "ð" ) ),
		"eu" => array( "names" => array( "ml;", "ro;", "ml" ), "refs" => array( "ë", "€", "ë" ) ),
		"ex" => array( "names" => array( "ponentiale;", "pectation;", "ist;", "cl;" ), "refs" => array( "ⅇ", "ℰ", "∃", "!" ) ),
		"fa" => array( "names" => array( "llingdotseq;" ), "refs" => array( "≒" ) ),
		"fc" => array( "names" => array( "y;" ), "refs" => array( "ф" ) ),
		"fe" => array( "names" => array( "male;" ), "refs" => array( "♀" ) ),
		"ff" => array( "names" => array( "ilig;", "llig;", "lig;", "r;" ), "refs" => array( "ﬃ", "ﬄ", "ﬀ", "𝔣" ) ),
		"fi" => array( "names" => array( "lig;" ), "refs" => array( "ﬁ" ) ),
		"fj" => array( "names" => array( "lig;" ), "refs" => array( "fj" ) ),
		"fl" => array( "names" => array( "lig;", "tns;", "at;" ), "refs" => array( "ﬂ", "▱", "♭" ) ),
		"fn" => array( "names" => array( "of;" ), "refs" => array( "ƒ" ) ),
		"fo" => array( "names" => array( "rall;", "rkv;", "pf;", "rk;" ), "refs" => array( "∀", "⫙", "𝕗", "⋔" ) ),
		"fp" => array( "names" => array( "artint;" ), "refs" => array( "⨍" ) ),
		"fr" => array( "names" => array( "ac12;", "ac13;", "ac14;", "ac15;", "ac16;", "ac18;", "ac23;", "ac25;", "ac34;", "ac35;", "ac38;", "ac45;", "ac56;", "ac58;", "ac78;", "ac12", "ac14", "ac34", "asl;", "own;" ), "refs" => array( "½", "⅓", "¼", "⅕", "⅙", "⅛", "⅔", "⅖", "¾", "⅗", "⅜", "⅘", "⅚", "⅝", "⅞", "½", "¼", "¾", "⁄", "⌢" ) ),
		"fs" => array( "names" => array( "cr;" ), "refs" => array( "𝒻" ) ),
		"gE" => array( "names" => array( "l;", ";" ), "refs" => array( "⪌", "≧" ) ),
		"ga" => array( "names" => array( "cute;", "mmad;", "mma;", "p;" ), "refs" => array( "ǵ", "ϝ", "γ", "⪆" ) ),
		"gb" => array( "names" => array( "reve;" ), "refs" => array( "ğ" ) ),
		"gc" => array( "names" => array( "irc;", "y;" ), "refs" => array( "ĝ", "г" ) ),
		"gd" => array( "names" => array( "ot;" ), "refs" => array( "ġ" ) ),
		"ge" => array( "names" => array( "qslant;", "sdotol;", "sdoto;", "sdot;", "sles;", "scc;", "qq;", "sl;", "l;", "q;", "s;", ";" ), "refs" => array( "⩾", "⪄", "⪂", "⪀", "⪔", "⪩", "≧", "⋛︀", "⋛", "≥", "⩾", "≥" ) ),
		"gf" => array( "names" => array( "r;" ), "refs" => array( "𝔤" ) ),
		"gg" => array( "names" => array( "g;", ";" ), "refs" => array( "⋙", "≫" ) ),
		"gi" => array( "names" => array( "mel;" ), "refs" => array( "ℷ" ) ),
		"gj" => array( "names" => array( "cy;" ), "refs" => array( "ѓ" ) ),
		"gl" => array( "names" => array( "E;", "a;", "j;", ";" ), "refs" => array( "⪒", "⪥", "⪤", "≷" ) ),
		"gn" => array( "names" => array( "approx;", "eqq;", "sim;", "ap;", "eq;", "E;", "e;" ), "refs" => array( "⪊", "≩", "⋧", "⪊", "⪈", "≩", "⪈" ) ),
		"go" => array( "names" => array( "pf;" ), "refs" => array( "𝕘" ) ),
		"gr" => array( "names" => array( "ave;" ), "refs" => array( "`" ) ),
		"gs" => array( "names" => array( "ime;", "iml;", "cr;", "im;" ), "refs" => array( "⪎", "⪐", "ℊ", "≳" ) ),
		"gt" => array( "names" => array( "reqqless;", "rapprox;", "reqless;", "quest;", "rless;", "lPar;", "rarr;", "rdot;", "rsim;", "cir;", "dot;", "cc;", ";", "" ), "refs" => array( "⪌", "⪆", "⋛", "⩼", "≷", "⦕", "⥸", "⋗", "≳", "⩺", "⋗", "⪧", ">", ">" ) ),
		"gv" => array( "names" => array( "ertneqq;", "nE;" ), "refs" => array( "≩︀", "≩︀" ) ),
		"hA" => array( "names" => array( "rr;" ), "refs" => array( "⇔" ) ),
		"ha" => array( "names" => array( "rrcir;", "irsp;", "milt;", "rdcy;", "rrw;", "lf;", "rr;" ), "refs" => array( "⥈", " ", "ℋ", "ъ", "↭", "½", "↔" ) ),
		"hb" => array( "names" => array( "ar;" ), "refs" => array( "ℏ" ) ),
		"hc" => array( "names" => array( "irc;" ), "refs" => array( "ĥ" ) ),
		"he" => array( "names" => array( "artsuit;", "arts;", "llip;", "rcon;" ), "refs" => array( "♥", "♥", "…", "⊹" ) ),
		"hf" => array( "names" => array( "r;" ), "refs" => array( "𝔥" ) ),
		"hk" => array( "names" => array( "searow;", "swarow;" ), "refs" => array( "⤥", "⤦" ) ),
		"ho" => array( "names" => array( "okrightarrow;", "okleftarrow;", "mtht;", "rbar;", "arr;", "pf;" ), "refs" => array( "↪", "↩", "∻", "―", "⇿", "𝕙" ) ),
		"hs" => array( "names" => array( "lash;", "trok;", "cr;" ), "refs" => array( "ℏ", "ħ", "𝒽" ) ),
		"hy" => array( "names" => array( "bull;", "phen;" ), "refs" => array( "⁃", "‐" ) ),
		"ia" => array( "names" => array( "cute;", "cute" ), "refs" => array( "í", "í" ) ),
		"ic" => array( "names" => array( "irc;", "irc", "y;", ";" ), "refs" => array( "î", "î", "и", "" ) ),
		"ie" => array( "names" => array( "xcl;", "cy;", "xcl" ), "refs" => array( "¡", "е", "¡" ) ),
		"if" => array( "names" => array( "f;", "r;" ), "refs" => array( "⇔", "𝔦" ) ),
		"ig" => array( "names" => array( "rave;", "rave" ), "refs" => array( "ì", "ì" ) ),
		"ii" => array( "names" => array( "iint;", "nfin;", "int;", "ota;", ";" ), "refs" => array( "⨌", "⧜", "∭", "℩", "ⅈ" ) ),
		"ij" => array( "names" => array( "lig;" ), "refs" => array( "ĳ" ) ),
		"im" => array( "names" => array( "agline;", "agpart;", "acr;", "age;", "ath;", "ped;", "of;" ), "refs" => array( "ℐ", "ℑ", "ī", "ℑ", "ı", "Ƶ", "⊷" ) ),
		"in" => array( "names" => array( "fintie;", "tegers;", "tercal;", "tlarhk;", "tprod;", "care;", "odot;", "tcal;", "fin;", "t;", ";" ), "refs" => array( "⧝", "ℤ", "⊺", "⨗", "⨼", "℅", "ı", "⊺", "∞", "∫", "∈" ) ),
		"io" => array( "names" => array( "gon;", "cy;", "pf;", "ta;" ), "refs" => array( "į", "ё", "𝕚", "ι" ) ),
		"ip" => array( "names" => array( "rod;" ), "refs" => array( "⨼" ) ),
		"iq" => array( "names" => array( "uest;", "uest" ), "refs" => array( "¿", "¿" ) ),
		"is" => array( "names" => array( "indot;", "insv;", "inE;", "ins;", "inv;", "cr;", "in;" ), "refs" => array( "⋵", "⋳", "⋹", "⋴", "∈", "𝒾", "∈" ) ),
		"it" => array( "names" => array( "ilde;", ";" ), "refs" => array( "ĩ", "" ) ),
		"iu" => array( "names" => array( "kcy;", "ml;", "ml" ), "refs" => array( "і", "ï", "ï" ) ),
		"jc" => array( "names" => array( "irc;", "y;" ), "refs" => array( "ĵ", "й" ) ),
		"jf" => array( "names" => array( "r;" ), "refs" => array( "𝔧" ) ),
		"jm" => array( "names" => array( "ath;" ), "refs" => array( "ȷ" ) ),
		"jo" => array( "names" => array( "pf;" ), "refs" => array( "𝕛" ) ),
		"js" => array( "names" => array( "ercy;", "cr;" ), "refs" => array( "ј", "𝒿" ) ),
		"ju" => array( "names" => array( "kcy;" ), "refs" => array( "є" ) ),
		"ka" => array( "names" => array( "ppav;", "ppa;" ), "refs" => array( "ϰ", "κ" ) ),
		"kc" => array( "names" => array( "edil;", "y;" ), "refs" => array( "ķ", "к" ) ),
		"kf" => array( "names" => array( "r;" ), "refs" => array( "𝔨" ) ),
		"kg" => array( "names" => array( "reen;" ), "refs" => array( "ĸ" ) ),
		"kh" => array( "names" => array( "cy;" ), "refs" => array( "х" ) ),
		"kj" => array( "names" => array( "cy;" ), "refs" => array( "ќ" ) ),
		"ko" => array( "names" => array( "pf;" ), "refs" => array( "𝕜" ) ),
		"ks" => array( "names" => array( "cr;" ), "refs" => array( "𝓀" ) ),
		"lA" => array( "names" => array( "tail;", "arr;", "rr;" ), "refs" => array( "⤛", "⇚", "⇐" ) ),
		"lB" => array( "names" => array( "arr;" ), "refs" => array( "⤎" ) ),
		"lE" => array( "names" => array( "g;", ";" ), "refs" => array( "⪋", "≦" ) ),
		"lH" => array( "names" => array( "ar;" ), "refs" => array( "⥢" ) ),
		"la" => array( "names" => array( "emptyv;", "rrbfs;", "rrsim;", "cute;", "gran;", "mbda;", "ngle;", "rrfs;", "rrhk;", "rrlp;", "rrpl;", "rrtl;", "tail;", "ngd;", "quo;", "rrb;", "tes;", "ng;", "quo", "rr;", "te;", "p;", "t;" ), "refs" => array( "⦴", "⤟", "⥳", "ĺ", "ℒ", "λ", "⟨", "⤝", "↩", "↫", "⤹", "↢", "⤙", "⦑", "«", "⇤", "⪭︀", "⟨", "«", "←", "⪭", "⪅", "⪫" ) ),
		"lb" => array( "names" => array( "rksld;", "rkslu;", "race;", "rack;", "arr;", "brk;", "rke;" ), "refs" => array( "⦏", "⦍", "{", "[", "⤌", "❲", "⦋" ) ),
		"lc" => array( "names" => array( "aron;", "edil;", "eil;", "ub;", "y;" ), "refs" => array( "ľ", "ļ", "⌈", "{", "л" ) ),
		"ld" => array( "names" => array( "rushar;", "rdhar;", "quor;", "quo;", "ca;", "sh;" ), "refs" => array( "⥋", "⥧", "„", "“", "⤶", "↲" ) ),
		"le" => array( "names" => array( "ftrightsquigarrow;", "ftrightharpoons;", "ftharpoondown;", "ftrightarrows;", "ftleftarrows;", "ftrightarrow;", "ftthreetimes;", "ftarrowtail;", "ftharpoonup;", "ssapprox;", "sseqqgtr;", "ftarrow;", "sseqgtr;", "qslant;", "sdotor;", "sdoto;", "ssdot;", "ssgtr;", "sssim;", "sdot;", "sges;", "scc;", "qq;", "sg;", "g;", "q;", "s;", ";" ), "refs" => array( "↭", "⇋", "↽", "⇆", "⇇", "↔", "⋋", "↢", "↼", "⪅", "⪋", "←", "⋚", "⩽", "⪃", "⪁", "⋖", "≶", "≲", "⩿", "⪓", "⪨", "≦", "⋚︀", "⋚", "≤", "⩽", "≤" ) ),
		"lf" => array( "names" => array( "isht;", "loor;", "r;" ), "refs" => array( "⥼", "⌊", "𝔩" ) ),
		"lg" => array( "names" => array( "E;", ";" ), "refs" => array( "⪑", "≶" ) ),
		"lh" => array( "names" => array( "arul;", "ard;", "aru;", "blk;" ), "refs" => array( "⥪", "↽", "↼", "▄" ) ),
		"lj" => array( "names" => array( "cy;" ), "refs" => array( "љ" ) ),
		"ll" => array( "names" => array( "corner;", "hard;", "arr;", "tri;", ";" ), "refs" => array( "⌞", "⥫", "⇇", "◺", "≪" ) ),
		"lm" => array( "names" => array( "oustache;", "idot;", "oust;" ), "refs" => array( "⎰", "ŀ", "⎰" ) ),
		"ln" => array( "names" => array( "approx;", "eqq;", "sim;", "ap;", "eq;", "E;", "e;" ), "refs" => array( "⪉", "≨", "⋦", "⪉", "⪇", "≨", "⪇" ) ),
		"lo" => array( "names" => array( "ngleftrightarrow;", "ngrightarrow;", "oparrowright;", "ngleftarrow;", "oparrowleft;", "ngmapsto;", "times;", "zenge;", "plus;", "wast;", "wbar;", "ang;", "arr;", "brk;", "par;", "pf;", "zf;", "z;" ), "refs" => array( "⟷", "⟶", "↬", "⟵", "↫", "⟼", "⨴", "◊", "⨭", "∗", "_", "⟬", "⇽", "⟦", "⦅", "𝕝", "⧫", "◊" ) ),
		"lp" => array( "names" => array( "arlt;", "ar;" ), "refs" => array( "⦓", "(" ) ),
		"lr" => array( "names" => array( "corner;", "hard;", "arr;", "har;", "tri;", "m;" ), "refs" => array( "⌟", "⥭", "⇆", "⇋", "⊿", "" ) ),
		"ls" => array( "names" => array( "aquo;", "quor;", "trok;", "ime;", "img;", "quo;", "cr;", "im;", "qb;", "h;" ), "refs" => array( "‹", "‚", "ł", "⪍", "⪏", "‘", "𝓁", "≲", "[", "↰" ) ),
		"lt" => array( "names" => array( "quest;", "hree;", "imes;", "larr;", "rPar;", "cir;", "dot;", "rie;", "rif;", "cc;", "ri;", ";", "" ), "refs" => array( "⩻", "⋋", "⋉", "⥶", "⦖", "⩹", "⋖", "⊴", "◂", "⪦", "◃", "<", "<" ) ),
		"lu" => array( "names" => array( "rdshar;", "ruhar;" ), "refs" => array( "⥊", "⥦" ) ),
		"lv" => array( "names" => array( "ertneqq;", "nE;" ), "refs" => array( "≨︀", "≨︀" ) ),
		"mD" => array( "names" => array( "Dot;" ), "refs" => array( "∺" ) ),
		"ma" => array( "names" => array( "pstodown;", "pstoleft;", "pstoup;", "ltese;", "psto;", "rker;", "cr;", "le;", "lt;", "cr", "p;" ), "refs" => array( "↧", "↤", "↥", "✠", "↦", "▮", "¯", "♂", "✠", "¯", "↦" ) ),
		"mc" => array( "names" => array( "omma;", "y;" ), "refs" => array( "⨩", "м" ) ),
		"md" => array( "names" => array( "ash;" ), "refs" => array( "—" ) ),
		"me" => array( "names" => array( "asuredangle;" ), "refs" => array( "∡" ) ),
		"mf" => array( "names" => array( "r;" ), "refs" => array( "𝔪" ) ),
		"mh" => array( "names" => array( "o;" ), "refs" => array( "℧" ) ),
		"mi" => array( "names" => array( "nusdu;", "dast;", "dcir;", "ddot;", "nusb;", "nusd;", "cro;", "ddot", "nus;", "cro", "d;" ), "refs" => array( "⨪", "*", "⫰", "·", "⊟", "∸", "µ", "·", "−", "µ", "∣" ) ),
		"ml" => array( "names" => array( "cp;", "dr;" ), "refs" => array( "⫛", "…" ) ),
		"mn" => array( "names" => array( "plus;" ), "refs" => array( "∓" ) ),
		"mo" => array( "names" => array( "dels;", "pf;" ), "refs" => array( "⊧", "𝕞" ) ),
		"mp" => array( "names" => array( ";" ), "refs" => array( "∓" ) ),
		"ms" => array( "names" => array( "tpos;", "cr;" ), "refs" => array( "∾", "𝓂" ) ),
		"mu" => array( "names" => array( "ltimap;", "map;", ";" ), "refs" => array( "⊸", "⊸", "μ" ) ),
		"nG" => array( "names" => array( "tv;", "g;", "t;" ), "refs" => array( "≫̸", "⋙̸", "≫⃒" ) ),
		"nL" => array( "names" => array( "eftrightarrow;", "eftarrow;", "tv;", "l;", "t;" ), "refs" => array( "⇎", "⇍", "≪̸", "⋘̸", "≪⃒" ) ),
		"nR" => array( "names" => array( "ightarrow;" ), "refs" => array( "⇏" ) ),
		"nV" => array( "names" => array( "Dash;", "dash;" ), "refs" => array( "⊯", "⊮" ) ),
		"na" => array( "names" => array( "turals;", "pprox;", "tural;", "cute;", "bla;", "pid;", "pos;", "tur;", "ng;", "pE;", "p;" ), "refs" => array( "ℕ", "≉", "♮", "ń", "∇", "≋̸", "ŉ", "♮", "∠⃒", "⩰̸", "≉" ) ),
		"nb" => array( "names" => array( "umpe;", "ump;", "sp;", "sp" ), "refs" => array( "≏̸", "≎̸", " ", " " ) ),
		"nc" => array( "names" => array( "ongdot;", "aron;", "edil;", "ong;", "ap;", "up;", "y;" ), "refs" => array( "⩭̸", "ň", "ņ", "≇", "⩃", "⩂", "н" ) ),
		"nd" => array( "names" => array( "ash;" ), "refs" => array( "–" ) ),
		"ne" => array( "names" => array( "arrow;", "xists;", "arhk;", "quiv;", "sear;", "xist;", "Arr;", "arr;", "dot;", "sim;", ";" ), "refs" => array( "↗", "∄", "⤤", "≢", "⤨", "∄", "⇗", "↗", "≐̸", "≂̸", "≠" ) ),
		"nf" => array( "names" => array( "r;" ), "refs" => array( "𝔫" ) ),
		"ng" => array( "names" => array( "eqslant;", "eqq;", "sim;", "eq;", "es;", "tr;", "E;", "e;", "t;" ), "refs" => array( "⩾̸", "≧̸", "≵", "≱", "⩾̸", "≯", "≧̸", "≱", "≯" ) ),
		"nh" => array( "names" => array( "Arr;", "arr;", "par;" ), "refs" => array( "⇎", "↮", "⫲" ) ),
		"ni" => array( "names" => array( "sd;", "s;", "v;", ";" ), "refs" => array( "⋺", "⋼", "∋", "∋" ) ),
		"nj" => array( "names" => array( "cy;" ), "refs" => array( "њ" ) ),
		"nl" => array( "names" => array( "eftrightarrow;", "eftarrow;", "eqslant;", "trie;", "Arr;", "arr;", "eqq;", "ess;", "sim;", "tri;", "dr;", "eq;", "es;", "E;", "e;", "t;" ), "refs" => array( "↮", "↚", "⩽̸", "⋬", "⇍", "↚", "≦̸", "≮", "≴", "⋪", "‥", "≰", "⩽̸", "≦̸", "≰", "≮" ) ),
		"nm" => array( "names" => array( "id;" ), "refs" => array( "∤" ) ),
		"no" => array( "names" => array( "tindot;", "tinva;", "tinvb;", "tinvc;", "tniva;", "tnivb;", "tnivc;", "tinE;", "tin;", "tni;", "pf;", "t;", "t" ), "refs" => array( "⋵̸", "∉", "⋷", "⋶", "∌", "⋾", "⋽", "⋹̸", "∉", "∌", "𝕟", "¬", "¬" ) ),
		"np" => array( "names" => array( "arallel;", "olint;", "receq;", "arsl;", "rcue;", "art;", "rec;", "ar;", "re;", "r;" ), "refs" => array( "∦", "⨔", "⪯̸", "⫽⃥", "⋠", "∂̸", "⊀", "∦", "⪯̸", "⊀" ) ),
		"nr" => array( "names" => array( "ightarrow;", "arrc;", "arrw;", "trie;", "Arr;", "arr;", "tri;" ), "refs" => array( "↛", "⤳̸", "↝̸", "⋭", "⇏", "↛", "⋫" ) ),
		"ns" => array( "names" => array( "hortparallel;", "ubseteqq;", "upseteqq;", "hortmid;", "ubseteq;", "upseteq;", "qsube;", "qsupe;", "ubset;", "ucceq;", "upset;", "ccue;", "imeq;", "ime;", "mid;", "par;", "ubE;", "ube;", "ucc;", "upE;", "upe;", "ce;", "cr;", "im;", "ub;", "up;", "c;" ), "refs" => array( "∦", "⫅̸", "⫆̸", "∤", "⊈", "⊉", "⋢", "⋣", "⊂⃒", "⪰̸", "⊃⃒", "⋡", "≄", "≄", "∤", "∦", "⫅̸", "⊈", "⊁", "⫆̸", "⊉", "⪰̸", "𝓃", "≁", "⊄", "⊅", "⊁" ) ),
		"nt" => array( "names" => array( "rianglerighteq;", "rianglelefteq;", "riangleright;", "riangleleft;", "ilde;", "ilde", "gl;", "lg;" ), "refs" => array( "⋭", "⋬", "⋫", "⋪", "ñ", "ñ", "≹", "≸" ) ),
		"nu" => array( "names" => array( "mero;", "msp;", "m;", ";" ), "refs" => array( "№", " ", "#", "ν" ) ),
		"nv" => array( "names" => array( "infin;", "ltrie;", "rtrie;", "Dash;", "Harr;", "dash;", "lArr;", "rArr;", "sim;", "ap;", "ge;", "gt;", "le;", "lt;" ), "refs" => array( "⧞", "⊴⃒", "⊵⃒", "⊭", "⤄", "⊬", "⤂", "⤃", "∼⃒", "≍⃒", "≥⃒", ">⃒", "≤⃒", "<⃒" ) ),
		"nw" => array( "names" => array( "arrow;", "arhk;", "near;", "Arr;", "arr;" ), "refs" => array( "↖", "⤣", "⤧", "⇖", "↖" ) ),
		"oS" => array( "names" => array( ";" ), "refs" => array( "Ⓢ" ) ),
		"oa" => array( "names" => array( "cute;", "cute", "st;" ), "refs" => array( "ó", "ó", "⊛" ) ),
		"oc" => array( "names" => array( "irc;", "ir;", "irc", "y;" ), "refs" => array( "ô", "⊚", "ô", "о" ) ),
		"od" => array( "names" => array( "blac;", "sold;", "ash;", "iv;", "ot;" ), "refs" => array( "ő", "⦼", "⊝", "⨸", "⊙" ) ),
		"oe" => array( "names" => array( "lig;" ), "refs" => array( "œ" ) ),
		"of" => array( "names" => array( "cir;", "r;" ), "refs" => array( "⦿", "𝔬" ) ),
		"og" => array( "names" => array( "rave;", "rave", "on;", "t;" ), "refs" => array( "ò", "ò", "˛", "⧁" ) ),
		"oh" => array( "names" => array( "bar;", "m;" ), "refs" => array( "⦵", "Ω" ) ),
		"oi" => array( "names" => array( "nt;" ), "refs" => array( "∮" ) ),
		"ol" => array( "names" => array( "cross;", "arr;", "cir;", "ine;", "t;" ), "refs" => array( "⦻", "↺", "⦾", "‾", "⧀" ) ),
		"om" => array( "names" => array( "icron;", "inus;", "acr;", "ega;", "id;" ), "refs" => array( "ο", "⊖", "ō", "ω", "⦶" ) ),
		"oo" => array( "names" => array( "pf;" ), "refs" => array( "𝕠" ) ),
		"op" => array( "names" => array( "erp;", "lus;", "ar;" ), "refs" => array( "⦹", "⊕", "⦷" ) ),
		"or" => array( "names" => array( "derof;", "slope;", "igof;", "arr;", "der;", "df;", "dm;", "or;", "d;", "df", "dm", "v;", ";" ), "refs" => array( "ℴ", "⩗", "⊶", "↻", "ℴ", "ª", "º", "⩖", "⩝", "ª", "º", "⩛", "∨" ) ),
		"os" => array( "names" => array( "lash;", "lash", "cr;", "ol;" ), "refs" => array( "ø", "ø", "ℴ", "⊘" ) ),
		"ot" => array( "names" => array( "imesas;", "ilde;", "imes;", "ilde" ), "refs" => array( "⨶", "õ", "⊗", "õ" ) ),
		"ou" => array( "names" => array( "ml;", "ml" ), "refs" => array( "ö", "ö" ) ),
		"ov" => array( "names" => array( "bar;" ), "refs" => array( "⌽" ) ),
		"pa" => array( "names" => array( "rallel;", "rsim;", "rsl;", "ra;", "rt;", "r;", "ra" ), "refs" => array( "∥", "⫳", "⫽", "¶", "∂", "∥", "¶" ) ),
		"pc" => array( "names" => array( "y;" ), "refs" => array( "п" ) ),
		"pe" => array( "names" => array( "rtenk;", "rcnt;", "riod;", "rmil;", "rp;" ), "refs" => array( "‱", "%", ".", "‰", "⊥" ) ),
		"pf" => array( "names" => array( "r;" ), "refs" => array( "𝔭" ) ),
		"ph" => array( "names" => array( "mmat;", "one;", "iv;", "i;" ), "refs" => array( "ℳ", "☎", "ϕ", "φ" ) ),
		"pi" => array( "names" => array( "tchfork;", "v;", ";" ), "refs" => array( "⋔", "ϖ", "π" ) ),
		"pl" => array( "names" => array( "usacir;", "anckh;", "uscir;", "ussim;", "ustwo;", "anck;", "ankv;", "usdo;", "usdu;", "usmn;", "usb;", "use;", "usmn", "us;" ), "refs" => array( "⨣", "ℎ", "⨢", "⨦", "⨧", "ℏ", "ℏ", "∔", "⨥", "±", "⊞", "⩲", "±", "+" ) ),
		"pm" => array( "names" => array( ";" ), "refs" => array( "±" ) ),
		"po" => array( "names" => array( "intint;", "und;", "pf;", "und" ), "refs" => array( "⨕", "£", "𝕡", "£" ) ),
		"pr" => array( "names" => array( "eccurlyeq;", "ecnapprox;", "ecapprox;", "ecneqq;", "ecnsim;", "ofalar;", "ofline;", "ofsurf;", "ecsim;", "eceq;", "imes;", "nsim;", "opto;", "urel;", "cue;", "ime;", "nap;", "sim;", "ap;", "ec;", "nE;", "od;", "op;", "E;", "e;", ";" ), "refs" => array( "≼", "⪹", "⪷", "⪵", "⋨", "⌮", "⌒", "⌓", "≾", "⪯", "ℙ", "⋨", "∝", "⊰", "≼", "′", "⪹", "≾", "⪷", "≺", "⪵", "∏", "∝", "⪳", "⪯", "≺" ) ),
		"ps" => array( "names" => array( "cr;", "i;" ), "refs" => array( "𝓅", "ψ" ) ),
		"pu" => array( "names" => array( "ncsp;" ), "refs" => array( " " ) ),
		"qf" => array( "names" => array( "r;" ), "refs" => array( "𝔮" ) ),
		"qi" => array( "names" => array( "nt;" ), "refs" => array( "⨌" ) ),
		"qo" => array( "names" => array( "pf;" ), "refs" => array( "𝕢" ) ),
		"qp" => array( "names" => array( "rime;" ), "refs" => array( "⁗" ) ),
		"qs" => array( "names" => array( "cr;" ), "refs" => array( "𝓆" ) ),
		"qu" => array( "names" => array( "aternions;", "atint;", "esteq;", "est;", "ot;", "ot" ), "refs" => array( "ℍ", "⨖", "≟", "?", "\"", "\"" ) ),
		"rA" => array( "names" => array( "tail;", "arr;", "rr;" ), "refs" => array( "⤜", "⇛", "⇒" ) ),
		"rB" => array( "names" => array( "arr;" ), "refs" => array( "⤏" ) ),
		"rH" => array( "names" => array( "ar;" ), "refs" => array( "⥤" ) ),
		"ra" => array( "names" => array( "tionals;", "emptyv;", "rrbfs;", "rrsim;", "cute;", "ngle;", "rrap;", "rrfs;", "rrhk;", "rrlp;", "rrpl;", "rrtl;", "tail;", "dic;", "ngd;", "nge;", "quo;", "rrb;", "rrc;", "rrw;", "tio;", "ce;", "ng;", "quo", "rr;" ), "refs" => array( "ℚ", "⦳", "⤠", "⥴", "ŕ", "⟩", "⥵", "⤞", "↪", "↬", "⥅", "↣", "⤚", "√", "⦒", "⦥", "»", "⇥", "⤳", "↝", "∶", "∽̱", "⟩", "»", "→" ) ),
		"rb" => array( "names" => array( "rksld;", "rkslu;", "race;", "rack;", "arr;", "brk;", "rke;" ), "refs" => array( "⦎", "⦐", "}", "]", "⤍", "❳", "⦌" ) ),
		"rc" => array( "names" => array( "aron;", "edil;", "eil;", "ub;", "y;" ), "refs" => array( "ř", "ŗ", "⌉", "}", "р" ) ),
		"rd" => array( "names" => array( "ldhar;", "quor;", "quo;", "ca;", "sh;" ), "refs" => array( "⥩", "”", "”", "⤷", "↳" ) ),
		"re" => array( "names" => array( "alpart;", "aline;", "als;", "al;", "ct;", "g;", "g" ), "refs" => array( "ℜ", "ℛ", "ℝ", "ℜ", "▭", "®", "®" ) ),
		"rf" => array( "names" => array( "isht;", "loor;", "r;" ), "refs" => array( "⥽", "⌋", "𝔯" ) ),
		"rh" => array( "names" => array( "arul;", "ard;", "aru;", "ov;", "o;" ), "refs" => array( "⥬", "⇁", "⇀", "ϱ", "ρ" ) ),
		"ri" => array( "names" => array( "ghtleftharpoons;", "ghtharpoondown;", "ghtrightarrows;", "ghtleftarrows;", "ghtsquigarrow;", "ghtthreetimes;", "ghtarrowtail;", "ghtharpoonup;", "singdotseq;", "ghtarrow;", "ng;" ), "refs" => array( "⇌", "⇁", "⇉", "⇄", "↝", "⋌", "↣", "⇀", "≓", "→", "˚" ) ),
		"rl" => array( "names" => array( "arr;", "har;", "m;" ), "refs" => array( "⇄", "⇌", "" ) ),
		"rm" => array( "names" => array( "oustache;", "oust;" ), "refs" => array( "⎱", "⎱" ) ),
		"rn" => array( "names" => array( "mid;" ), "refs" => array( "⫮" ) ),
		"ro" => array( "names" => array( "times;", "plus;", "ang;", "arr;", "brk;", "par;", "pf;" ), "refs" => array( "⨵", "⨮", "⟭", "⇾", "⟧", "⦆", "𝕣" ) ),
		"rp" => array( "names" => array( "polint;", "argt;", "ar;" ), "refs" => array( "⨒", "⦔", ")" ) ),
		"rr" => array( "names" => array( "arr;" ), "refs" => array( "⇉" ) ),
		"rs" => array( "names" => array( "aquo;", "quor;", "quo;", "cr;", "qb;", "h;" ), "refs" => array( "›", "’", "’", "𝓇", "]", "↱" ) ),
		"rt" => array( "names" => array( "riltri;", "hree;", "imes;", "rie;", "rif;", "ri;" ), "refs" => array( "⧎", "⋌", "⋊", "⊵", "▸", "▹" ) ),
		"ru" => array( "names" => array( "luhar;" ), "refs" => array( "⥨" ) ),
		"rx" => array( "names" => array( ";" ), "refs" => array( "℞" ) ),
		"sa" => array( "names" => array( "cute;" ), "refs" => array( "ś" ) ),
		"sb" => array( "names" => array( "quo;" ), "refs" => array( "‚" ) ),
		"sc" => array( "names" => array( "polint;", "aron;", "edil;", "nsim;", "cue;", "irc;", "nap;", "sim;", "ap;", "nE;", "E;", "e;", "y;", ";" ), "refs" => array( "⨓", "š", "ş", "⋩", "≽", "ŝ", "⪺", "≿", "⪸", "⪶", "⪴", "⪰", "с", "≻" ) ),
		"sd" => array( "names" => array( "otb;", "ote;", "ot;" ), "refs" => array( "⊡", "⩦", "⋅" ) ),
		"se" => array( "names" => array( "tminus;", "arrow;", "arhk;", "swar;", "Arr;", "arr;", "tmn;", "ct;", "mi;", "xt;", "ct" ), "refs" => array( "∖", "↘", "⤥", "⤩", "⇘", "↘", "∖", "§", ";", "✶", "§" ) ),
		"sf" => array( "names" => array( "rown;", "r;" ), "refs" => array( "⌢", "𝔰" ) ),
		"sh" => array( "names" => array( "ortparallel;", "ortmid;", "chcy;", "arp;", "cy;", "y;", "y" ), "refs" => array( "∥", "∣", "щ", "♯", "ш", "", "" ) ),
		"si" => array( "names" => array( "mplus;", "mrarr;", "gmaf;", "gmav;", "mdot;", "gma;", "meq;", "mgE;", "mlE;", "mne;", "me;", "mg;", "ml;", "m;" ), "refs" => array( "⨤", "⥲", "ς", "ς", "⩪", "σ", "≃", "⪠", "⪟", "≆", "≃", "⪞", "⪝", "∼" ) ),
		"sl" => array( "names" => array( "arr;" ), "refs" => array( "←" ) ),
		"sm" => array( "names" => array( "allsetminus;", "eparsl;", "ashp;", "ile;", "tes;", "id;", "te;", "t;" ), "refs" => array( "∖", "⧤", "⨳", "⌣", "⪬︀", "∣", "⪬", "⪪" ) ),
		"so" => array( "names" => array( "ftcy;", "lbar;", "lb;", "pf;", "l;" ), "refs" => array( "ь", "⌿", "⧄", "𝕤", "/" ) ),
		"sp" => array( "names" => array( "adesuit;", "ades;", "ar;" ), "refs" => array( "♠", "♠", "∥" ) ),
		"sq" => array( "names" => array( "subseteq;", "supseteq;", "subset;", "supset;", "caps;", "cups;", "sube;", "supe;", "uare;", "uarf;", "cap;", "cup;", "sub;", "sup;", "uf;", "u;" ), "refs" => array( "⊑", "⊒", "⊏", "⊐", "⊓︀", "⊔︀", "⊑", "⊒", "□", "▪", "⊓", "⊔", "⊏", "⊐", "▪", "□" ) ),
		"sr" => array( "names" => array( "arr;" ), "refs" => array( "→" ) ),
		"ss" => array( "names" => array( "etmn;", "mile;", "tarf;", "cr;" ), "refs" => array( "∖", "⌣", "⋆", "𝓈" ) ),
		"st" => array( "names" => array( "raightepsilon;", "raightphi;", "arf;", "rns;", "ar;" ), "refs" => array( "ϵ", "ϕ", "★", "¯", "☆" ) ),
		"su" => array( "names" => array( "cccurlyeq;", "ccnapprox;", "bsetneqq;", "ccapprox;", "psetneqq;", "bseteqq;", "bsetneq;", "pseteqq;", "psetneq;", "bseteq;", "ccneqq;", "ccnsim;", "pseteq;", "bedot;", "bmult;", "bplus;", "brarr;", "ccsim;", "pdsub;", "pedot;", "phsol;", "phsub;", "plarr;", "pmult;", "pplus;", "bdot;", "bset;", "bsim;", "bsub;", "bsup;", "cceq;", "pdot;", "pset;", "psim;", "psub;", "psup;", "bnE;", "bne;", "pnE;", "pne;", "bE;", "be;", "cc;", "ng;", "p1;", "p2;", "p3;", "pE;", "pe;", "b;", "m;", "p1", "p2", "p3", "p;" ), "refs" => array( "≽", "⪺", "⫋", "⪸", "⫌", "⫅", "⊊", "⫆", "⊋", "⊆", "⪶", "⋩", "⊇", "⫃", "⫁", "⪿", "⥹", "≿", "⫘", "⫄", "⟉", "⫗", "⥻", "⫂", "⫀", "⪽", "⊂", "⫇", "⫕", "⫓", "⪰", "⪾", "⊃", "⫈", "⫔", "⫖", "⫋", "⊊", "⫌", "⊋", "⫅", "⊆", "≻", "♪", "¹", "²", "³", "⫆", "⊇", "⊂", "∑", "¹", "²", "³", "⊃" ) ),
		"sw" => array( "names" => array( "arrow;", "arhk;", "nwar;", "Arr;", "arr;" ), "refs" => array( "↙", "⤦", "⤪", "⇙", "↙" ) ),
		"sz" => array( "names" => array( "lig;", "lig" ), "refs" => array( "ß", "ß" ) ),
		"ta" => array( "names" => array( "rget;", "u;" ), "refs" => array( "⌖", "τ" ) ),
		"tb" => array( "names" => array( "rk;" ), "refs" => array( "⎴" ) ),
		"tc" => array( "names" => array( "aron;", "edil;", "y;" ), "refs" => array( "ť", "ţ", "т" ) ),
		"td" => array( "names" => array( "ot;" ), "refs" => array( "⃛" ) ),
		"te" => array( "names" => array( "lrec;" ), "refs" => array( "⌕" ) ),
		"tf" => array( "names" => array( "r;" ), "refs" => array( "𝔱" ) ),
		"th" => array( "names" => array( "ickapprox;", "erefore;", "etasym;", "icksim;", "ere4;", "etav;", "insp;", "ksim;", "eta;", "kap;", "orn;", "orn" ), "refs" => array( "≈", "∴", "ϑ", "∼", "∴", "ϑ", " ", "∼", "θ", "≈", "þ", "þ" ) ),
		"ti" => array( "names" => array( "mesbar;", "mesb;", "mesd;", "lde;", "mes;", "mes", "nt;" ), "refs" => array( "⨱", "⊠", "⨰", "˜", "×", "×", "∭" ) ),
		"to" => array( "names" => array( "pfork;", "pbot;", "pcir;", "ea;", "pf;", "sa;", "p;" ), "refs" => array( "⫚", "⌶", "⫱", "⤨", "𝕥", "⤩", "⊤" ) ),
		"tp" => array( "names" => array( "rime;" ), "refs" => array( "‴" ) ),
		"tr" => array( "names" => array( "ianglerighteq;", "ianglelefteq;", "iangleright;", "iangledown;", "iangleleft;", "iangleq;", "iangle;", "iminus;", "pezium;", "iplus;", "itime;", "idot;", "ade;", "isb;", "ie;" ), "refs" => array( "⊵", "⊴", "▹", "▿", "◃", "≜", "▵", "⨺", "⏢", "⨹", "⨻", "◬", "™", "⧍", "≜" ) ),
		"ts" => array( "names" => array( "trok;", "hcy;", "cr;", "cy;" ), "refs" => array( "ŧ", "ћ", "𝓉", "ц" ) ),
		"tw" => array( "names" => array( "oheadrightarrow;", "oheadleftarrow;", "ixt;" ), "refs" => array( "↠", "↞", "≬" ) ),
		"uA" => array( "names" => array( "rr;" ), "refs" => array( "⇑" ) ),
		"uH" => array( "names" => array( "ar;" ), "refs" => array( "⥣" ) ),
		"ua" => array( "names" => array( "cute;", "cute", "rr;" ), "refs" => array( "ú", "ú", "↑" ) ),
		"ub" => array( "names" => array( "reve;", "rcy;" ), "refs" => array( "ŭ", "ў" ) ),
		"uc" => array( "names" => array( "irc;", "irc", "y;" ), "refs" => array( "û", "û", "у" ) ),
		"ud" => array( "names" => array( "blac;", "arr;", "har;" ), "refs" => array( "ű", "⇅", "⥮" ) ),
		"uf" => array( "names" => array( "isht;", "r;" ), "refs" => array( "⥾", "𝔲" ) ),
		"ug" => array( "names" => array( "rave;", "rave" ), "refs" => array( "ù", "ù" ) ),
		"uh" => array( "names" => array( "arl;", "arr;", "blk;" ), "refs" => array( "↿", "↾", "▀" ) ),
		"ul" => array( "names" => array( "corner;", "corn;", "crop;", "tri;" ), "refs" => array( "⌜", "⌜", "⌏", "◸" ) ),
		"um" => array( "names" => array( "acr;", "l;", "l" ), "refs" => array( "ū", "¨", "¨" ) ),
		"uo" => array( "names" => array( "gon;", "pf;" ), "refs" => array( "ų", "𝕦" ) ),
		"up" => array( "names" => array( "harpoonright;", "harpoonleft;", "downarrow;", "uparrows;", "arrow;", "silon;", "lus;", "sih;", "si;" ), "refs" => array( "↾", "↿", "↕", "⇈", "↑", "υ", "⊎", "ϒ", "υ" ) ),
		"ur" => array( "names" => array( "corner;", "corn;", "crop;", "ing;", "tri;" ), "refs" => array( "⌝", "⌝", "⌎", "ů", "◹" ) ),
		"us" => array( "names" => array( "cr;" ), "refs" => array( "𝓊" ) ),
		"ut" => array( "names" => array( "ilde;", "dot;", "rif;", "ri;" ), "refs" => array( "ũ", "⋰", "▴", "▵" ) ),
		"uu" => array( "names" => array( "arr;", "ml;", "ml" ), "refs" => array( "⇈", "ü", "ü" ) ),
		"uw" => array( "names" => array( "angle;" ), "refs" => array( "⦧" ) ),
		"vA" => array( "names" => array( "rr;" ), "refs" => array( "⇕" ) ),
		"vB" => array( "names" => array( "arv;", "ar;" ), "refs" => array( "⫩", "⫨" ) ),
		"vD" => array( "names" => array( "ash;" ), "refs" => array( "⊨" ) ),
		"va" => array( "names" => array( "rtriangleright;", "rtriangleleft;", "rsubsetneqq;", "rsupsetneqq;", "rsubsetneq;", "rsupsetneq;", "repsilon;", "rnothing;", "rpropto;", "rkappa;", "rsigma;", "rtheta;", "ngrt;", "rphi;", "rrho;", "rpi;", "rr;" ), "refs" => array( "⊳", "⊲", "⫋︀", "⫌︀", "⊊︀", "⊋︀", "ϵ", "∅", "∝", "ϰ", "ς", "ϑ", "⦜", "ϕ", "ϱ", "ϖ", "↕" ) ),
		"vc" => array( "names" => array( "y;" ), "refs" => array( "в" ) ),
		"vd" => array( "names" => array( "ash;" ), "refs" => array( "⊢" ) ),
		"ve" => array( "names" => array( "ebar;", "llip;", "rbar;", "eeq;", "rt;", "e;" ), "refs" => array( "⊻", "⋮", "|", "≚", "|", "∨" ) ),
		"vf" => array( "names" => array( "r;" ), "refs" => array( "𝔳" ) ),
		"vl" => array( "names" => array( "tri;" ), "refs" => array( "⊲" ) ),
		"vn" => array( "names" => array( "sub;", "sup;" ), "refs" => array( "⊂⃒", "⊃⃒" ) ),
		"vo" => array( "names" => array( "pf;" ), "refs" => array( "𝕧" ) ),
		"vp" => array( "names" => array( "rop;" ), "refs" => array( "∝" ) ),
		"vr" => array( "names" => array( "tri;" ), "refs" => array( "⊳" ) ),
		"vs" => array( "names" => array( "ubnE;", "ubne;", "upnE;", "upne;", "cr;" ), "refs" => array( "⫋︀", "⊊︀", "⫌︀", "⊋︀", "𝓋" ) ),
		"vz" => array( "names" => array( "igzag;" ), "refs" => array( "⦚" ) ),
		"wc" => array( "names" => array( "irc;" ), "refs" => array( "ŵ" ) ),
		"we" => array( "names" => array( "dbar;", "dgeq;", "ierp;", "dge;" ), "refs" => array( "⩟", "≙", "℘", "∧" ) ),
		"wf" => array( "names" => array( "r;" ), "refs" => array( "𝔴" ) ),
		"wo" => array( "names" => array( "pf;" ), "refs" => array( "𝕨" ) ),
		"wp" => array( "names" => array( ";" ), "refs" => array( "℘" ) ),
		"wr" => array( "names" => array( "eath;", ";" ), "refs" => array( "≀", "≀" ) ),
		"ws" => array( "names" => array( "cr;" ), "refs" => array( "𝓌" ) ),
		"xc" => array( "names" => array( "irc;", "ap;", "up;" ), "refs" => array( "◯", "⋂", "⋃" ) ),
		"xd" => array( "names" => array( "tri;" ), "refs" => array( "▽" ) ),
		"xf" => array( "names" => array( "r;" ), "refs" => array( "𝔵" ) ),
		"xh" => array( "names" => array( "Arr;", "arr;" ), "refs" => array( "⟺", "⟷" ) ),
		"xi" => array( "names" => array( ";" ), "refs" => array( "ξ" ) ),
		"xl" => array( "names" => array( "Arr;", "arr;" ), "refs" => array( "⟸", "⟵" ) ),
		"xm" => array( "names" => array( "ap;" ), "refs" => array( "⟼" ) ),
		"xn" => array( "names" => array( "is;" ), "refs" => array( "⋻" ) ),
		"xo" => array( "names" => array( "plus;", "time;", "dot;", "pf;" ), "refs" => array( "⨁", "⨂", "⨀", "𝕩" ) ),
		"xr" => array( "names" => array( "Arr;", "arr;" ), "refs" => array( "⟹", "⟶" ) ),
		"xs" => array( "names" => array( "qcup;", "cr;" ), "refs" => array( "⨆", "𝓍" ) ),
		"xu" => array( "names" => array( "plus;", "tri;" ), "refs" => array( "⨄", "△" ) ),
		"xv" => array( "names" => array( "ee;" ), "refs" => array( "⋁" ) ),
		"xw" => array( "names" => array( "edge;" ), "refs" => array( "⋀" ) ),
		"ya" => array( "names" => array( "cute;", "cute", "cy;" ), "refs" => array( "ý", "ý", "я" ) ),
		"yc" => array( "names" => array( "irc;", "y;" ), "refs" => array( "ŷ", "ы" ) ),
		"ye" => array( "names" => array( "n;", "n" ), "refs" => array( "¥", "¥" ) ),
		"yf" => array( "names" => array( "r;" ), "refs" => array( "𝔶" ) ),
		"yi" => array( "names" => array( "cy;" ), "refs" => array( "ї" ) ),
		"yo" => array( "names" => array( "pf;" ), "refs" => array( "𝕪" ) ),
		"ys" => array( "names" => array( "cr;" ), "refs" => array( "𝓎" ) ),
		"yu" => array( "names" => array( "cy;", "ml;", "ml" ), "refs" => array( "ю", "ÿ", "ÿ" ) ),
		"za" => array( "names" => array( "cute;" ), "refs" => array( "ź" ) ),
		"zc" => array( "names" => array( "aron;", "y;" ), "refs" => array( "ž", "з" ) ),
		"zd" => array( "names" => array( "ot;" ), "refs" => array( "ż" ) ),
		"ze" => array( "names" => array( "etrf;", "ta;" ), "refs" => array( "ℨ", "ζ" ) ),
		"zf" => array( "names" => array( "r;" ), "refs" => array( "𝔷" ) ),
		"zh" => array( "names" => array( "cy;" ), "refs" => array( "ж" ) ),
		"zi" => array( "names" => array( "grarr;" ), "refs" => array( "⇝" ) ),
		"zo" => array( "names" => array( "pf;" ), "refs" => array( "𝕫" ) ),
		"zs" => array( "names" => array( "cr;" ), "refs" => array( "𝓏" ) ),
		"zw" => array( "names" => array( "nj;", "j;" ), "refs" => array( "‌", "‍" ) ),
	);
}
