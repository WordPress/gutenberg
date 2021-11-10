/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	__experimentalHeading as Heading,
	Button,
} from '@wordpress/components';

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

			<div>
				<Button variant="primary">{ postType.labels?.add_new }</Button>
			</div>
		</header>
	);
}
