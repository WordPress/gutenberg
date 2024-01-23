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
import { store as editSiteStore } from '../../store';

export default function Header( { templateType } ) {
	const { canCreate, postType } = useSelect(
		( select ) => {
			const { supportsTemplatePartsMode } =
				select( editSiteStore ).getSettings();
			return {
				postType: select( coreStore ).getPostType( templateType ),
				canCreate: ! supportsTemplatePartsMode,
			};
		},
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

			{ canCreate && (
				<div className="edit-site-list-header__right">
					<AddNewTemplate
						templateType={ templateType }
						showIcon={ false }
						toggleProps={ { variant: 'primary' } }
					/>
				</div>
			) }
		</header>
	);
}
