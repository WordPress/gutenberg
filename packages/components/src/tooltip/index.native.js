/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';

// For native mobile, just shortcircuit the Tooltip to return its child.
const Tooltip = ( props ) => Children.only( props.children );

export default Tooltip;
