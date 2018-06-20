/**
 * Internal dependencies
 */
import { registerToken } from '../tokens/registration';
import * as image from './image';

export const registerCoreTokens = () => {
	[
		image,
	].forEach( ( { name, settings } ) => {
		registerToken( name, settings );
	} );
};
