/**
 * Internal dependencies
 */
import BlockHTMLConvertButton from './block-html-convert-button';
import { useBlockSettingsContext } from './block-settings-dropdown';

export function HTMLConvertMenuItem() {
	const { blockClientIds } = useBlockSettingsContext();
	const firstBlockClientId = blockClientIds[ 0 ];

	if ( blockClientIds?.length !== 1 ) {
		return null;
	}
	return <BlockHTMLConvertButton clientId={ firstBlockClientId } />;
}
