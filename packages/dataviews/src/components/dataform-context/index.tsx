import { createContext } from '@wordpress/element';
import type { NormalizedField } from '../../types';

type DataFormContextType< Item > = {
	fields: NormalizedField< Item >[];
};

const DataFormContext = createContext< DataFormContextType< any > >( {
	fields: [],
} );
DataFormContext.displayName = 'DataFormContext';

export function DataFormProvider< Item >( {
	fields,
	children,
}: React.PropsWithChildren< {
	fields: NormalizedField< Item >[];
} > ) {
	return (
		<DataFormContext.Provider value={ { fields } }>
			{ children }
		</DataFormContext.Provider>
	);
}

export default DataFormContext;
