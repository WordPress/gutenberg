/**
 * WordPress dependencies
 */

 /**
  * Internal dependencies
  */
 import metadata from './block.json';

 const { name } = metadata;
 export { metadata, name };

 export const settings = {
	 edit: () => {},
	 save: () => {},
 };
