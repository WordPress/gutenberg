/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import NewTemplate from './new-template';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';

export default function AddNewTemplate( {
	templateType = TEMPLATE_POST_TYPE,
	...props
} ) {
	const postType = useSelect(
		( select ) => select( coreStore ).getPostType( templateType ),
		[ templateType ]
	);

	if ( ! postType ) {
		return null;
	}

	if ( templateType === TEMPLATE_POST_TYPE ) {
		return <NewTemplate { ...props } postType={ postType } />;
	}

	return null;
}
