/**
 * WordPress dependencies
 */
import { createContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
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
	// Memoize to prevent unnecessary re-renders
	const value = useMemo( () => ( { fields } ), [ fields ] );
	return (
		<DataFormContext.Provider value={ value }>
			{ children }
		</DataFormContext.Provider>
	);
}

export default DataFormContext;
