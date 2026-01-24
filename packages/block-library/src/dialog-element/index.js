/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import save from './save';
import registerDialogElementLabelBinding from './block-bindings';

import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	edit,
	save,
};

export const init = () => {
	registerDialogElementLabelBinding();
	return initBlock( { name, metadata, settings } );
};
