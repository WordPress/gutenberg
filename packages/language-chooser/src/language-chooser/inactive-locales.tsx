/**
 * Internal dependencies
 */
import type { Language } from './types';
import InactiveControls from './inactive-controls';
import InactiveLocalesSelect from './inactive-locales-select';

interface InactiveLocalesProps {
	languages: Language[];
	onAdd: () => void;
	inactiveLanguage: Language;
	setInactiveLanguage: ( locale: Language ) => void;
	installedLanguages: Language[];
	availableLanguages: Language[];
}

function InactiveLocales( {
	languages,
	onAdd,
	inactiveLanguage,
	setInactiveLanguage,
	installedLanguages,
	availableLanguages,
}: InactiveLocalesProps ) {
	const onChange = ( locale: string ) => {
		setInactiveLanguage(
			languages.find(
				( language ) => locale === language.locale
			) as Language
		);
	};

	return (
		<div className="language-chooser__inactive-locales">
			<div className="language-chooser__inactive-locales-list">
				<InactiveLocalesSelect
					installedLanguages={ installedLanguages }
					availableLanguages={ availableLanguages }
					value={ inactiveLanguage?.locale }
					onChange={ onChange }
				/>
			</div>
			<InactiveControls onAdd={ onAdd } disabled={ ! inactiveLanguage } />
		</div>
	);
}

export default InactiveLocales;
