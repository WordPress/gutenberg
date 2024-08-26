/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { Language, Locale } from './types';

interface InactiveLocalesSelectProps {
	installedLanguages: Language[];
	availableLanguages: Language[];
	value: Locale;
	onChange: ( value: string ) => void;
}

function InactiveLocalesSelect( {
	installedLanguages,
	availableLanguages,
	value,
	onChange,
}: InactiveLocalesSelectProps ) {
	const hasItems = installedLanguages.length || availableLanguages.length;

	return (
		// eslint-disable-next-line no-restricted-syntax -- Do not want __next40pxDefaultSize in wp-admin
		<SelectControl
			aria-label={ __( 'Inactive Locales' ) }
			label={ __( 'Inactive Locales' ) }
			hideLabelFromVision
			value={ value }
			onChange={ onChange }
			disabled={ ! hasItems }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		>
			{ installedLanguages.length > 0 && (
				<optgroup label={ _x( 'Installed', 'translations' ) }>
					{ installedLanguages.map(
						( { locale, lang, nativeName } ) => (
							<option
								key={ locale }
								value={ locale }
								lang={ lang }
							>
								{ nativeName }
							</option>
						)
					) }
				</optgroup>
			) }
			{ availableLanguages.length > 0 && (
				<optgroup label={ _x( 'Available', 'translations' ) }>
					{ availableLanguages.map(
						( { locale, lang, nativeName } ) => (
							<option
								key={ locale }
								value={ locale }
								lang={ lang }
							>
								{ nativeName }
							</option>
						)
					) }
				</optgroup>
			) }
		</SelectControl>
	);
}

export default InactiveLocalesSelect;
