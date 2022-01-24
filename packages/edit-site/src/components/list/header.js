/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __experimentalHeading as Heading } from '@wordpress/components';

/**
 * Internal dependencies
 */
import AddNewTemplate from '../add-new-template';

export default function Header( { templateType } ) {
	const postType = useSelect(
		( select ) => select( coreStore ).getPostType( templateType ),
		[ templateType ]
	);

	if ( ! postType ) {
		return null;
	}

	return (
		<header className="edit-site-list-header">
			<Heading level={ 1 } className="edit-site-list-header__title">
				{ postType.labels?.name }
			</Heading>

			<div className="edit-site-list-header__right">
				<AddNewTemplate templateType={ templateType } />
			</div>
		</header>
	);
}
