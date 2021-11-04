/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import {
	useEntityId,
	useEntityProp,
	store as coreStore,
} from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigationMenuNameModal from './navigation-menu-name-modal';

export default function NavigationMenuPublishButton() {
	const [ isNameModalVisible, setIsNameModalVisible ] = useState( false );
	const id = useEntityId( 'postType', 'wp_navigation' );
	const [ navigationMenuTitle ] = useEntityProp(
		'postType',
		'wp_navigation',
		'title'
	);
	const { editEntityRecord, saveEditedEntityRecord } = useDispatch(
		coreStore
	);

	return (
		<>
			<ToolbarButton onClick={ () => setIsNameModalVisible( true ) }>
				{ __( 'Save as' ) }
			</ToolbarButton>
			{ isNameModalVisible && (
				<NavigationMenuNameModal
					title={ __( 'Save your new navigation menu' ) }
					value={ navigationMenuTitle }
					onRequestClose={ () => setIsNameModalVisible( false ) }
					finishButtonText={ __( 'Save' ) }
					onFinish={ ( updatedTitle ) => {
						editEntityRecord( 'postType', 'wp_navigation', id, {
							title: updatedTitle,
							status: 'publish',
						} );
						saveEditedEntityRecord(
							'postType',
							'wp_navigation',
							id
						);
					} }
				/>
			) }
		</>
	);
}
