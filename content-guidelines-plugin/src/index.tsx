import { createRoot } from '@wordpress/element';
import { bootstrapBlockRegistry } from './bootstrap-block-registry';
import { stage as ContentGuidelinesPage } from './stage';

bootstrapBlockRegistry();

const root = document.getElementById( 'content-guidelines-root' );
if ( root ) {
	const reactRoot = createRoot( root );
	reactRoot.render( <ContentGuidelinesPage /> );
}
