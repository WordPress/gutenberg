/**
 * WordPress dependencies
 */
import { registerFormatType } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { annotation } from './annotation';

const { name, ...settings } = annotation;

registerFormatType( name, settings );
