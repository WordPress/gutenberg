/**
 * Internal dependencies
 */
import { testParser } from '../shared-tests';
import { parse } from '../';

describe( 'block-serialization-spec-parser', testParser( parse ) );
