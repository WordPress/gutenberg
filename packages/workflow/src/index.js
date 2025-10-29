/**
 * WordPress dependencies
 */
import { createRoot, createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { WorkflowMenu } from './components/workflow-menu';

// Initialize the workflow palette if the experiment is enabled
if ( window.wpWorkflowPaletteEnabled ) {
	const root = document.createElement( 'div' );
	document.body.appendChild( root );

	if ( createRoot ) {
		createRoot( root ).render( createElement( WorkflowMenu ) );
	}
}
