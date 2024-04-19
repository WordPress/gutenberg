/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState, memo } from '@wordpress/element';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import CreateTemplatePartModal from '../create-template-part-modal';
import { TEMPLATE_PART_POST_TYPE } from '../../utils/constants';

const { useHistory } = unlock( routerPrivateApis );

function AddNewTemplatePart() {
	const { canCreate, postType } = useSelect( ( select ) => {
		const { supportsTemplatePartsMode } =
			select( editSiteStore ).getSettings();
		return {
			canCreate: ! supportsTemplatePartsMode,
			postType: select( coreStore ).getPostType(
				TEMPLATE_PART_POST_TYPE
			),
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
							postType: TEMPLATE_PART_POST_TYPE,
							canvas: 'edit',
						} );
					} }
					onError={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}

export default memo( AddNewTemplatePart );
