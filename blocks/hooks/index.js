/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import anchor from './anchor';
import customClassName from './custom-class-name';
import generatedClassName from './generated-class-name';
import matchers from './matchers';

const hooks = { addFilter };

anchor( hooks );
customClassName( hooks );
generatedClassName( hooks );
matchers( hooks );
