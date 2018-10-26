/**
 * Internal dependencies
 */
import { parse as specParse } from '../';
import { testParser } from '../shared-tests';

describe( 'block-serialization-spec-parser', testParser( specParse ) );
