import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	privateApis as richTextPrivateApis,
	store as richTextStore,
} from '@wordpress/rich-text';
import type { ReactNode } from 'react';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { FormatTypesContext } = unlock( richTextPrivateApis );

// Selects the format types the editor offers once for all rich text fields,
// instead of each field subscribing.
export function FormatTypesProvider( { children }: { children: ReactNode } ) {
	const { formatTypes, allowedFormats } = useSelect(
		( select ) => ( {
			formatTypes: select( richTextStore ).getFormatTypes(),
			allowedFormats:
				select( blockEditorStore ).getSettings().allowedFormats,
		} ),
		[]
	);
	const value = useMemo(
		() =>
			allowedFormats
				? formatTypes.filter( ( { name } ) =>
						allowedFormats.includes( name )
					)
				: formatTypes,
		[ formatTypes, allowedFormats ]
	);
	return (
		<FormatTypesContext.Provider value={ value }>
			{ children }
		</FormatTypesContext.Provider>
	);
}
