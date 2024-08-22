/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import type { Language } from './types';
import InactiveControls from './inactive-controls';
import InactiveLocalesSelect from './inactive-locales-select';

interface InactiveLocalesProps {
	languages: Language[];
	onAddLanguage: ( language: Language ) => void;
}

function InactiveLocales( { languages, onAddLanguage }: InactiveLocalesProps ) {
	const [ selectedInactiveLanguage, setSelectedInactiveLanguage ] = useState(
		languages[ 0 ]
	);

	useEffect( () => {
		if ( ! selectedInactiveLanguage ) {
			setSelectedInactiveLanguage( languages[ 0 ] );
		}
	}, [ selectedInactiveLanguage, languages ] );

	const installedLanguages = languages.filter( ( { installed } ) =>
		Boolean( installed )
	);
	const availableLanguages = languages.filter(
		( { installed } ) => ! installed
	);

	const onChange = ( locale: string ) => {
		setSelectedInactiveLanguage(
			languages.find(
				( language ) => locale === language.locale
			) as Language
		);
	};

	const onClick = () => {
		onAddLanguage( selectedInactiveLanguage );

		const installedIndex = installedLanguages.findIndex(
			( { locale } ) => locale === selectedInactiveLanguage.locale
		);

		const availableIndex = availableLanguages.findIndex(
			( { locale } ) => locale === selectedInactiveLanguage.locale
		);

		let newSelected: Language | undefined;

		newSelected = installedLanguages[ installedIndex + 1 ];

		if (
			! newSelected &&
			installedLanguages[ 0 ] !== selectedInactiveLanguage
		) {
			newSelected = installedLanguages[ 0 ];
		}

		if ( ! newSelected ) {
			newSelected = availableLanguages[ availableIndex + 1 ];

			if ( availableLanguages[ 0 ] !== selectedInactiveLanguage ) {
				newSelected = availableLanguages[ 0 ];
			}
		}

		setSelectedInactiveLanguage( newSelected );

		speak( __( 'Locale added to list' ) );
	};

	return (
		<div className="inactive-locales wp-clearfix">
			<div className="inactive-locales-list">
				<InactiveLocalesSelect
					installedLanguages={ installedLanguages }
					availableLanguages={ availableLanguages }
					value={ selectedInactiveLanguage?.locale }
					onChange={ onChange }
				/>
			</div>
			<InactiveControls
				onClick={ onClick }
				disabled={ ! selectedInactiveLanguage }
			/>
		</div>
	);
}

export default InactiveLocales;
