/**
 * WordPress dependencies
 */
import { __experimentalGetSettings, dateI18n } from '@wordpress/date';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useEntityProp } from '@wordpress/core-data';

/**
 * @typedef FormatOption
 * @property {string} key  Date format. (e.g. 'F j, Y')
 * @property {string} name String to display to a user for format given by key.
 */

/**
 * Returns an object that maps format keys (e.g. 'F j, Y') to options usable in
 * the CustomSelectElement for that format.
 *
 * @param {*} date Date value to format.
 * @return {Object<string, FormatOption>} Format options.
 */
export function useDateFormatOptions( date ) {
	const settings = __experimentalGetSettings();
	const formatOptions = useMemo( () => {
		const o = Object.values( settings.formats ).reduce(
			( acc, formatOption ) => {
				return {
					...acc,
					[ formatOption ]: {
						key: formatOption,
						name: dateI18n( formatOption, date ),
					},
				};
			},
			{}
		);
		o.custom = { key: 'custom', name: __( 'Custom' ) };
		return o;
	}, [ settings.formats ] );
	return formatOptions;
}

/**
 * Get the date format (e.g. 'F j, Y'), which is set, in that order of priority,
 * by: the format parameter, WordPress settings, or a default from @wordpress/date.
 *
 * @param {string} format Current format set by block attributes.
 * @return {string} Date format resolved against defaults.
 */
export function useDateFormat( format ) {
	const settings = __experimentalGetSettings();
	const [ siteFormat ] = useEntityProp( 'root', 'site', 'date_format' );
	return format || siteFormat || settings.formats.date;
}
