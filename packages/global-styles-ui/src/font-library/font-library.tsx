/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import { GlobalStylesProvider } from '../provider';
import FontLibraryProvider from './context';
import InstalledFonts from './installed-fonts';
import UploadFonts from './upload-fonts';
import FontCollection from './font-collection';

interface FontLibraryProps {
	value: any;
	baseValue: any;
	onChange: ( value: any ) => void;
	activeTab?: string;
	onTabChange?: ( tab: string ) => void;
}

export function FontLibrary( {
	value,
	baseValue,
	onChange,
	activeTab = 'installed-fonts',
}: FontLibraryProps ) {
	let content;
	switch ( activeTab ) {
		case 'upload-fonts':
			content = <UploadFonts />;
			break;
		case 'installed-fonts':
			content = <InstalledFonts />;
			break;
		default:
			content = <FontCollection slug={ activeTab } />;
	}

	return (
		<GlobalStylesProvider
			value={ value }
			baseValue={ baseValue }
			onChange={ onChange }
		>
			<FontLibraryProvider>{ content }</FontLibraryProvider>
		</GlobalStylesProvider>
	);
}
