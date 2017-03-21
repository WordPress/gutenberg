/**
 * External dependencies
 */
import chai from 'chai';
import dirtyChai from 'dirty-chai';

/** Internal dependencies */
import * as blocks from './modules/blocks';
import * as element from './modules/element';

chai.use( dirtyChai );

global.wp = { blocks, element };
