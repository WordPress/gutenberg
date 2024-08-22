/**
 * Internal dependencies
 */
import type { Language } from './types';
import InactiveControls from './inactive-controls';
import InactiveLocalesSelect from './inactive-locales-select';

interface InactiveLocalesProps {
	languages: Language[];
	onAdd: () => void;
	selectedInactiveLanguage: Language;
	setSelectedInactiveLanguage: ( locale: Language ) => void;
	installedLanguages: Language[];
	availableLanguages: Language[];
}

function InactiveLocales( {
	languages,
	onAdd,
	selectedInactiveLanguage,
	setSelectedInactiveLanguage,
	installedLanguages,
	availableLanguages,
}: InactiveLocalesProps ) {
	const onChange = ( locale: string ) => {
		setSelectedInactiveLanguage(
			languages.find(
				( language ) => locale === language.locale
			) as Language
		);
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
				onAdd={ onAdd }
				disabled={ ! selectedInactiveLanguage }
			/>
		</div>
	);
}

export default InactiveLocales;
