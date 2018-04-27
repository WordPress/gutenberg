/**
 * Internal dependencies
 *
 * @format
 */
import {
	registerBlockType,
} from '../api';
import * as code from './code';

export const registerCoreBlocks = () => {
	[
		code,
	].forEach( ( { name, settings } ) => {
		registerBlockType( name, settings );
	} );
};
