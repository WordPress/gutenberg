import React from 'react';

// for the native mobile, just shortcircuit the Tooltip to return its child
export default ( props ) => React.Children.only( props.children );
