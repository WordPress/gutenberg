/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const TreeGridContext = createContext();
export default TreeGridContext;
export const useTreeGridContext = () => useContext( TreeGridContext );
