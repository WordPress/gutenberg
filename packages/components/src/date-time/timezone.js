/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalGetSettings as getDateSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import Tooltip from '../tooltip';

/**
 * Displays timezone information when user timezone is different from site timezone.
 */
const TimeZone = () => {
	const { timezone } = getDateSettings();

	// getTimezoneOffset() returns in minutes and opposite how you'd expect
	// America/Los_Angeles = 420 and not -7
	const userTimezoneOffset = -1 * ( new Date().getTimezoneOffset() / 60 );

	// System timezone and user timezone match, nothing needed
	// compare as numbers because it comes over as string
	if ( Number( timezone.offset ) === userTimezoneOffset ) {
		return null;
	}

	const offsetSymbol = timezone.offset >= 0 ? '+' : '';
	const zoneAbbr = timezone.abbr
		? timezone.abbr
		: `UTC${ offsetSymbol }${ timezone.offset }`;

	const timezoneDetail =
		'UTC' === timezone.string
			? __( 'Coordinated Universal Time' )
			: `(${ zoneAbbr }) ${ timezone.string.replace( '_', ' ' ) }`;

	return (
		<Tooltip position="top center" text={ timezoneDetail }>
			<div className="components-datetime__timezone"> { zoneAbbr } </div>
		</Tooltip>
	);
};

export default TimeZone;
