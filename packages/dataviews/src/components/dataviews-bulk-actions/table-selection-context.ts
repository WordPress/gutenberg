import type { Ref, RefObject } from 'react';
import { createContext } from '@wordpress/element';

// Gives the table layout access to the header for selection focus management.
const TableSelectionContext = createContext< {
	headerRef: Ref< HTMLTableSectionElement >;
	selectionRef: RefObject< HTMLInputElement >;
} | null >( null );

export default TableSelectionContext;
