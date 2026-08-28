/**
 * Regular expression to validate characters inside quoted local parts.
 *
 * ^([\x20-\x21\x23-\x5B\x5D-\x7E]|\\[\x20-\x7E])*$
 *   ▲                             ▲
 *   │                              └─ OR escaped characters: backslash followed by any printable ASCII.
 *   └─ Printable ASCII characters except quote (\x22) and backslash (\x5C).
 *
 * \x20-\x21: Space (32) to exclamation mark (33)
 * \x23-\x5B: Hash (35) to left bracket (91) - skips quote (\x22)
 * \x5D-\x7E: Right bracket (93) to tilde (126) - skips backslash (\x5C)
 */
const QUOTED_CHARACTERS_REGEX =
	/^([\x20-\x21\x23-\x5B\x5D-\x7E]|\\[\x20-\x7E])*$/;

/**
 * Regular expression to validate email local part (before @ symbol),
 * using a safe subset of RFC 5322 dot-atom syntax with support for Unicode characters.
 *
 * ^[^\s"(),:;<>@\[\\\]]+(\.[^\s"(),:;<>@\[\\\]]+)*$
 * ▲                    ▲                       ▲
 * │                     │                        └─ End of string
 * │                     └─ Optional dot-separated segments
 * └─ Starts with one or more valid characters excluding unsafe symbols
 *
 * Local part:
 * - Allows Unicode characters (letters, numbers, emojis, etc.)
 * - Supports dot-separated atoms
 * - Disallows: whitespace, quotes, parentheses, angle brackets, colons, semicolons, @, brackets, backslashes
 * - Prevents leading/trailing dot and consecutive dots
 * - Safe for real-world use while covering international names
 */
const ATOM_PATTERN_REGEX = /^[^\s"(),:;<>@\[\\\]]+(\.[^\s"(),:;<>@\[\\\]]+)*$/u;

/**
 * Regular expression to validate domain labels (individual parts between dots),
 * supporting internationalized domain names (IDNs) using Unicode letters, digits, and combining marks.
 *
 * ^[\p{L}\p{N}](?:[\p{L}\p{N}\p{M}-]{0,61}[\p{L}\p{N}\p{M}])?$
 * ▲         ▲                         ▲
 * │          │                          └─ Ends with letter/digit/mark if >1 char
 * │          └─ Optional: middle part of 0–61 allowed characters
 * └─ Starts with a Unicode letter or digit
 *
 * Each label:
 * - Length: 1–63 characters
 * - Allowed:
 *   - Unicode letters (`\p{L}`)
 *   - Unicode digits (`\p{N}`)
 *   - Combining marks (`\p{M}`) – e.g. diacritics in scripts like Devanagari
 *   - Hyphens (`-`) only in the middle (not start or end)
 * - Disallowed:
 *   - Leading/trailing hyphens
 *   - Whitespace, symbols, punctuation, emojis, or `@`
 * - Fully supports non-Latin IDNs (e.g., डाटा, пример, δοκιμή)
 * - Emoji or symbol-based domain labels are not matched
 * - Does not validate punycode-encoded labels (e.g., `xn--...`)
 */
const DOMAIN_LABEL_REGEX =
	/^[\p{L}\p{N}](?:[\p{L}\p{N}\p{M}-]{0,61}[\p{L}\p{N}\p{M}])?$/u;

/**
 * Regular expression to detect IPv4-like strings (digits and dots only).
 *
 * Used as a quick check before validating with strict IPv4 pattern.
 */
const IPV4_LIKE_REGEX = /^\d+(?:\.\d+)+$/;

/**
 * Regular expression to match IPv4 addresses (strict octets 0–255).
 *
 * (?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])
 *       ▲        ▲         ▲       ▲
 *       │        │         │       └─ Match 0–99: one or two digits, no leading zeros unless single zero.
 *       │        │         └─ Match 100–199.
 *       │        └─ Match 200–249.
 *       └─ Match 250–255.
 *
 * (?:\.(...)){3}
 *  ▲    ▲
 *  │    └─ Repeat this octet exactly 3 more times, separated by dots.
 *  └─ Leading dot for each additional octet.
 */
const IPV4_PATTERN_REGEX =
	/^(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(?:\.(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$/;

/**
 * Regular expression to validate individual IPv6 segments.
 *
 * ^[0-9A-Fa-f]{1,4}$
 *  ▲           ▲  ▲
 *  │           │  └─ Must be exactly 1-4 characters.
 *  │           └─ Must be hexadecimal digits (0-9, A-F, a-f).
 *  └─ Start of string.
 *
 * Each IPv6 segment can be 1-4 hexadecimal characters.
 */
const IPV6_SEGMENT_REGEX = /^[0-9A-Fa-f]{1,4}$/;

/**
 * Regular expression to match full IPv6 addresses (uncompressed format).
 *
 * ^([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}$
 *  ▲                  ▲ ▲ ▲
 *  │                  │ │ └─ Final segment (1-4 hex chars).
 *  │                  │ └─ Exactly 7 times.
 *  │                  └─ Colon separator after each segment.
 *  └─ Each segment: 1-4 hexadecimal characters.
 *
 * Matches standard IPv6 format: 8 groups of 1-4 hex digits separated by colons.
 * Does not handle compressed notation (::) - that's handled separately.
 */
const IPV6_PATTERN_REGEX = /^([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}$/;

/**
 * Determines whether the given string looks like an email.
 *
 * @param email The string to scrutinise.
 *
 * @example
 * ```js
 * const isEmail = isEmail( 'hello@wordpress.org' ); // true
 * ```
 *
 * @return Whether or not it looks like an email.
 */
export function isEmail( email: string ): boolean {
	if ( typeof email !== 'string' ) {
		return false;
	}

	// strip mailto:
	if ( email.startsWith( 'mailto:' ) ) {
		email = email.slice( 7 );
	}

	if ( email.length < 6 ) {
		return false;
	}

	const atIndex = email.lastIndexOf( '@' );

	if ( atIndex === -1 ) {
		return false;
	}

	const localPart = email.slice( 0, atIndex );

	if ( ! isValidLocal( localPart ) ) {
		return false;
	}

	const domainPart = email.slice( atIndex + 1 );

	if ( ! isValidDomain( domainPart ) ) {
		return false;
	}

	return true;
}

/**
 * Validates the local part of an email address.
 *
 * @param local - The local part of the email address.
 *
 * @return True if valid, false otherwise.
 */
function isValidLocal( local: string ): boolean {
	if ( ! local.length || local.length > 64 ) {
		return false;
	}

	// If the local part is quoted, it must be enclosed in double quotes.
	if ( local.startsWith( '"' ) && local.endsWith( '"' ) ) {
		return QUOTED_CHARACTERS_REGEX.test( local.slice( 1, -1 ) );
	}

	if ( local.includes( '@' ) || local.includes( '"' ) ) {
		return false;
	}

	// Cannot start or end with a dot, and cannot have consecutive dots.
	if ( /^\.|\.$|\.\./.test( local ) ) {
		return false;
	}

	return ATOM_PATTERN_REGEX.test( local );
}

/**
 * Validates the domain part of an email address.
 *
 * @param domain - The domain part of the email address.
 *
 * @return True if valid, false otherwise.
 */
function isValidDomain( domain: string ): boolean {
	if ( ! domain.length || domain.length > 253 ) {
		return false;
	}

	// If it is an IP literal, check if it is valid.
	if ( domain.startsWith( '[' ) && domain.endsWith( ']' ) ) {
		return isValidIPLiteral( domain );
	}

	// Check if it is a bare IPv4 address
	if ( IPV4_LIKE_REGEX.test( domain ) ) {
		return IPV4_PATTERN_REGEX.test( domain );
	}

	// Cannot start or end with . or hyphens.
	if ( /^[.-]|[.-]$/.test( domain ) ) {
		return false;
	}

	// Cannot have consecutive dots
	if ( /\.\./.test( domain ) ) {
		return false;
	}

	// Split by dots and validate each label
	const labels = domain.split( '.' );

	// Require at least two labels (reject short domains like @example, @123456789)
	if ( labels.length < 2 ) {
		return false;
	}

	return labels.every( ( label ) => {
		if ( label.length === 0 || label.length > 63 ) {
			return false;
		}

		return DOMAIN_LABEL_REGEX.test( label );
	} );
}

/**
 * Validates if the given string is a valid IP literal.
 *
 * @param ipAddress - The IP address to validate.
 *
 * @return True if valid, false otherwise.
 */
function isValidIPLiteral( ipAddress: string ): boolean {
	const content = ipAddress.slice( 1, -1 );

	if ( IPV4_PATTERN_REGEX.test( content ) ) {
		return true;
	}

	// Check for IPv6 prefix in domain literal
	if ( /^IPv6:/.test( content ) ) {
		return isValidIPv6( content.slice( 6 ) );
	}

	return false;
}

/**
 * Validates if the given string is a valid IPv6 address.
 *
 * @param ipAddress - The IP address to validate.
 *
 * @return True if valid, false otherwise.
 */
function isValidIPv6( ipAddress: string ): boolean {
	// Handle compressed notation (::)
	if ( ipAddress.includes( '::' ) ) {
		const parts = ipAddress.split( '::' );
		if ( parts.length !== 2 ) {
			return false;
		}

		const left = parts[ 0 ] ? parts[ 0 ].split( ':' ) : [];
		const right = parts[ 1 ] ? parts[ 1 ].split( ':' ) : [];

		// Total segments shouldn't exceed 8
		if ( left.length + right.length > 7 ) {
			return false;
		}

		// Validate each segment with regex
		return [ ...left, ...right ].every(
			( segment ) => segment === '' || IPV6_SEGMENT_REGEX.test( segment )
		);
	}

	return IPV6_PATTERN_REGEX.test( ipAddress );
}
