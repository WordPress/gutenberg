/**
 * WordPress dependencies
 */
import { createRoot, createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { WorkflowMenu } from './components/workflow-menu';

const root = document.createElement( 'div' );
document.body.appendChild( root );
createRoot( root ).render( createElement( WorkflowMenu ) );
