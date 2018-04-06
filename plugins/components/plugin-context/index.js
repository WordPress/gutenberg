/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const PluginContext = createContext( { pluginName: null } );

export default PluginContext;
