/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

// Register the same store used by the `test/render-element` block, so the
// region's directives resolve against it.
store( 'test/render-element', {} );
