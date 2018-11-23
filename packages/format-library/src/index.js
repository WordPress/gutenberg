/**
 * WordPress dependencies
 */
import {
	registerFormatType,
} from '@wordpress/rich-text';

import formats from './default-formats';

formats.forEach( ( { name, ...settings } ) => registerFormatType( name, settings ) );
