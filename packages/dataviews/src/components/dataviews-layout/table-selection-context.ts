import type { RefObject } from 'react';
import { createContext } from '@wordpress/element';

// Gives the layout access to the table header for selection focus management.
const TableSelectionContext = createContext< {
	headerRef: RefObject< HTMLTableSectionElement >;
	selectionRef: RefObject< HTMLInputElement >;
} | null >( null );

export default TableSelectionContext;
