/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuItem, MenuGroup } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as editPatternsPrivateApis } from '@wordpress/patterns';

/**
 * Internal dependencies
 */
import AddNewPostModal from '../add-new-post';
import { NewTemplateModal } from '../add-new-template';
import { unlock } from '../../lock-unlock';
import { PATTERN_TYPES } from '../../utils/constants';

const { useHistory } = unlock( routerPrivateApis );
const { CreatePatternModal } = unlock( editPatternsPrivateApis );

const POPOVER_PROPS = {
	position: 'bottom right',
};

export default function AddEntityMenu() {
	const [ showAddPostModal, setShowAddPostModal ] = useState( false );
	const [ showTemplateModal, setShowTemplateModal ] = useState( false );
	const [ showPatternModal, setShowPatternModal ] = useState( false );
	const history = useHistory();

	const { canCreatePattern } = useSelect( ( select ) => {
		const { canUser } = select( coreStore );
		return {
			canCreatePattern: canUser( 'create', {
				kind: 'postType',
				name: PATTERN_TYPES.user,
			} ),
		};
	}, [] );

	const handleNewPost = ( { type, id } ) => {
		history.navigate( `/${ type }/${ id }?canvas=edit` );
		setShowAddPostModal( false );
	};

	const handleCreatePattern = ( { pattern } ) => {
		setShowPatternModal( false );
		history.navigate(
			`/${ PATTERN_TYPES.user }/${ pattern.id }?canvas=edit`
		);
	};

	return (
		<>
			<DropdownMenu
				label={ __( 'Add new' ) }
				className="edit-site-site-hub_add_entity"
				icon={ plus }
				popoverProps={ POPOVER_PROPS }
			>
				{ ( { onClose } ) => (
					<MenuGroup label={ __( 'Add new' ) }>
						<MenuItem
							onClick={ () => {
								setShowAddPostModal( true );
								onClose();
							} }
						>
							{ __( 'Page' ) }
						</MenuItem>
						<MenuItem
							onClick={ () => {
								setShowTemplateModal( true );
								onClose();
							} }
						>
							{ __( 'Template' ) }
						</MenuItem>
						{ canCreatePattern && (
							<MenuItem
								onClick={ () => {
									setShowPatternModal( true );
									onClose();
								} }
							>
								{ __( 'Pattern' ) }
							</MenuItem>
						) }
					</MenuGroup>
				) }
			</DropdownMenu>

			{ showAddPostModal && (
				<AddNewPostModal
					postType="page"
					onSave={ handleNewPost }
					onClose={ () => setShowAddPostModal( false ) }
				/>
			) }

			{ showTemplateModal && (
				<NewTemplateModal
					onClose={ () => setShowTemplateModal( false ) }
				/>
			) }

			{ showPatternModal && (
				<CreatePatternModal
					onClose={ () => setShowPatternModal( false ) }
					onSuccess={ handleCreatePattern }
					onError={ () => setShowPatternModal( false ) }
				/>
			) }
		</>
	);
}
