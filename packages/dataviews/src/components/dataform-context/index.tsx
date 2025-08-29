/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { NormalizedField, FormValidity } from '../../types';

type DataFormContextType< Item > = {
	fields: NormalizedField< Item >[];
	validity?: FormValidity;
};

const DataFormContext = createContext< DataFormContextType< any > >( {
	fields: [],
	validity: undefined,
} );
DataFormContext.displayName = 'DataFormContext';

export function DataFormProvider< Item >( {
	fields,
	validity,
	children,
}: React.PropsWithChildren< {
	fields: NormalizedField< Item >[];
	validity?: FormValidity;
} > ) {
	return (
		<DataFormContext.Provider value={ { fields, validity } }>
			{ children }
		</DataFormContext.Provider>
	);
}

export default DataFormContext;
