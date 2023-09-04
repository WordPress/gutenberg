/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const DataTableContext = createContext( {} );
export const useDataTableContext = () => useContext( DataTableContext );
export default DataTableContext;
