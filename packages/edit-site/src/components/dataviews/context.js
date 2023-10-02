/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const DataViewsContext = createContext( {} );
export const useDataViewsContext = () => useContext( DataViewsContext );
export default DataViewsContext;
