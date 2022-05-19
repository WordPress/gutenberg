/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import NewTemplate from './new-template';
import NewTemplatePart from './new-template-part';

export default function AddNewTemplate( { templateType = 'wp_template' } ) {
	const postType = useSelect(
		( select ) => select( coreStore ).getPostType( templateType ),
		[ templateType ]
	);

	if ( ! postType ) {
		return null;
	}

	if ( templateType === 'wp_template' ) {
		return <NewTemplate postType={ postType } />;
	} else if ( templateType === 'wp_template_part' ) {
		return <NewTemplatePart postType={ postType } />;
	}

	return null;
}
