/**
 * WordPress dependencies
 */
import { __experimentalColorEdit as ColorEdit } from '@wordpress/components';

const EMPTY_ARRAY = [];

export default ( { contextName, getSetting, setSetting } ) => {
	const colors = getSetting( contextName, 'color.palette' ) || EMPTY_ARRAY;
	return (
		<ColorEdit
			colors={ colors }
			onChange={ ( newColors ) => {
				setSetting( contextName, 'color.palette', newColors );
			} }
		/>
	);
};
