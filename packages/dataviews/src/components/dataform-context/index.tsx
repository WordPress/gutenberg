import { createContext } from '@wordpress/element';
import type { NormalizedField } from '../../types';

type DataFormContextType< Item > = {
	fields: NormalizedField< Item >[];
	supportsUiOverlays?: boolean;
};

const DataFormContext = createContext< DataFormContextType< any > >( {
	fields: [],
} );
DataFormContext.displayName = 'DataFormContext';

export function DataFormProvider< Item >( {
	fields,
	supportsUiOverlays = false,
	children,
}: React.PropsWithChildren< {
	fields: NormalizedField< Item >[];
	supportsUiOverlays?: boolean;
} > ) {
	return (
		<DataFormContext.Provider value={ { fields, supportsUiOverlays } }>
			{ children }
		</DataFormContext.Provider>
	);
}

export default DataFormContext;
