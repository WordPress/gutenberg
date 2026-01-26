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
	markWhenOptional: boolean;
};

const DataFormContext = createContext< DataFormContextType< any > >( {
	fields: [],
	markWhenOptional: false,
} );
DataFormContext.displayName = 'DataFormContext';

export function DataFormProvider< Item >( {
	fields,
	markWhenOptional,
	children,
}: React.PropsWithChildren< {
	fields: NormalizedField< Item >[];
	markWhenOptional: boolean;
} > ) {
	// Memoize to prevent unnecessary re-renders
	const value = useMemo(
		() => ( { fields, markWhenOptional } ),
		[ fields, markWhenOptional ]
	);
	return (
		<DataFormContext.Provider value={ value }>
			{ children }
		</DataFormContext.Provider>
	);
}

export default DataFormContext;
