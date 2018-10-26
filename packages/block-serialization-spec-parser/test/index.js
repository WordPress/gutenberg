/**
 * Internal dependencies
 */
import { parse } from '../';
import { testParser } from '../shared-tests';

describe( 'block-serialization-spec-parser', testParser( parse ) );
