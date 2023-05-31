/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import PatternEditV1 from './v1/edit';
import PatternEditV2 from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = window?.__experimentalEnablePatternEnhancements
	? { edit: PatternEditV2 }
	: { edit: PatternEditV1 };

export const init = () => initBlock( { name, metadata, settings } );
