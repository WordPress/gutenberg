/**
 * Internal dependencies
 */
import { registrationFlags } from '../api/registration';

// Note - not using import statements here because they would be hoisted to the
// top of the file, which would cause setting this flag to do nothing.
registrationFlags.ALLOW_CORE_NAMESPACES = true;
require( './paragraph' );
require( './image' );
require( './gallery' );
require( './heading' );
require( './quote' );
require( './embed' );
require( './list' );
require( './separator' );
require( './more' );
require( './button' );
require( './pullquote' );
require( './table' );
require( './preformatted' );
require( './code' );
require( './html' );
require( './freeform' );
require( './latest-posts' );
require( './cover-image' );
require( './cover-text' );
require( './verse' );
registrationFlags.ALLOW_CORE_NAMESPACES = false;
