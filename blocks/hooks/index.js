/**
 * WordPress dependencies
 */
import * as hooks from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import anchor from './anchor';
import customClassName from './custom-class-name';
import generatedClassName from './generated-class-name';
import matchers from './matchers';

anchor( hooks );
customClassName( hooks );
generatedClassName( hooks );
matchers( hooks );
