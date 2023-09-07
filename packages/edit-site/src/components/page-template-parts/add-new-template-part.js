/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import CreateTemplatePartModal from '../create-template-part-modal';

const { useHistory } = unlock( routerPrivateApis );

export default function AddNewTemplatePart() {
	const { canCreate, postType } = useSelect( ( select ) => {
		const { supportsTemplatePartsMode } =
			select( editSiteStore ).getSettings();
		return {
			canCreate: ! supportsTemplatePartsMode,
			postType: select( coreStore ).getPostType( 'wp_template_part' ),
		};
	}, [] );
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const history = useHistory();

	if ( ! canCreate || ! postType ) {
		return null;
	}

	return (
		<>
			<Button variant="primary" onClick={ () => setIsModalOpen( true ) }>
				{ postType.labels.add_new_item }
			</Button>
			{ isModalOpen && (
				<CreateTemplatePartModal
					closeModal={ () => setIsModalOpen( false ) }
					blocks={ [] }
					onCreate={ ( templatePart ) => {
						setIsModalOpen( false );
						history.push( {
							postId: templatePart.id,
							postType: 'wp_template_part',
							canvas: 'edit',
						} );
					} }
					onError={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}
