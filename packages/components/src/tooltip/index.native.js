import { Children } from '@wordpress/element';

// For native mobile, just shortcircuit the Tooltip to return its child.
export default ( props ) => Children.only( props.children );
