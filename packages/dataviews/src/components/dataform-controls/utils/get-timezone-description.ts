import { getSettings } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Help text communicating the timezone a datetime value is edited in.
 * Returns `undefined` when the site timezone matches the visitor's, where
 * spelling out the frame would be noise.
 */
export default function getTimezoneDescription(): string | undefined {
	const { timezone } = getSettings();

	const userTimezoneOffset = -1 * ( new Date().getTimezoneOffset() / 60 );
	// Compare as numbers because the site offset comes over as a string.
	if ( Number( timezone.offset ) === userTimezoneOffset ) {
		return undefined;
	}

	const offsetSymbol = Number( timezone.offset ) >= 0 ? '+' : '';
	const zoneAbbr =
		'' !== timezone.abbr && isNaN( Number( timezone.abbr ) )
			? timezone.abbr
			: `UTC${ offsetSymbol }${ timezone.offsetFormatted }`;

	// Replace underscores with spaces in strings like `America/Costa_Rica`.
	// A site set to a manual UTC offset has no zone name, and is described by
	// the offset alone.
	const prettyTimezoneString = timezone.string.replaceAll( '_', ' ' );

	let timezoneDetail = zoneAbbr;
	if ( 'UTC' === timezone.string ) {
		timezoneDetail = __( 'Coordinated Universal Time' );
	} else if ( prettyTimezoneString.trim().length > 0 ) {
		timezoneDetail = `(${ zoneAbbr }) ${ prettyTimezoneString }`;
	}

	return sprintf(
		/* translators: %s: timezone detail, e.g. "(CEST) Europe/Madrid" or "UTC+3". */
		__( 'Timezone: %s' ),
		timezoneDetail
	);
}
