/**
 * Internal dependencies
 */
import { annotation } from './annotation';

/**
 * WordPress dependencies
 */
import {
	registerFormatType,
} from '@wordpress/rich-text';

const { name, ...settings } = annotation;

registerFormatType( name, settings );
