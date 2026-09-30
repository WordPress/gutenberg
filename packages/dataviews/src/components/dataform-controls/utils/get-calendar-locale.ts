/**
 * WordPress locale slugs with no `Intl` data, mapped to the closest tag that
 * has some. `Intl` canonicalizes slugs like `bel` and `oci` on its own.
 */
const LANGUAGE_ALIASES: Record< string, string > = {
	ary: 'ar-MA', // Moroccan Arabic.
	haz: 'fa', // Hazaragi, a variety of Persian.
};

/**
 * Turns a WordPress locale slug into a BCP 47 tag for the `Calendar` and
 * `RangeCalendar` components' `locale` prop, which fall back to `en-US` for a
 * tag they cannot resolve.
 *
 * Keeps only the language, script and region: WordPress variant suffixes are
 * not always valid BCP 47 variants, and `pt_PT_ao90` would resolve to nothing.
 *
 * @param wpLocale WordPress locale slug, e.g. `getSettings().l10n.locale`.
 */
export default function getCalendarLocale(
	wpLocale: string
): string | undefined {
	// The slug comes from the host's date settings, so it may be missing.
	const subtags = wpLocale?.trim().split( /[_-]/ ) ?? [];
	const language = subtags.shift()?.toLowerCase();
	if ( ! language ) {
		return undefined;
	}

	const normalized = [ LANGUAGE_ALIASES[ language ] ?? language ];
	for ( const subtag of subtags ) {
		// A script is four letters, a region two letters or three digits.
		if (
			/^[a-z]{4}$/i.test( subtag ) ||
			/^([a-z]{2}|\d{3})$/i.test( subtag )
		) {
			normalized.push( subtag );
		}
	}

	return normalized.join( '-' );
}
