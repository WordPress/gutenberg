/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Button, Dropdown, Placeholder } from '@wordpress/components';
import { navigation as navigationIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PlaceholderPreview from './placeholder-preview';
import NavigationMenuSelector from '../navigation-menu-selector';
import NavigationMenuNameModal from '../navigation-menu-name-modal';

export default function SelectNavigationMenuStep( {
	canSwitchNavigationMenu,
	hasResolvedNavigationMenu,
	onCreateNew,
	onSelectExisting,
} ) {
	const [ isNewMenuModalVisible, setIsNewMenuModalVisible ] = useState(
		false
	);

	return (
		<>
			{ ! hasResolvedNavigationMenu && <PlaceholderPreview isLoading /> }
			{ hasResolvedNavigationMenu && (
				<Placeholder
					icon={ navigationIcon }
					label={ __( 'Navigation' ) }
					instructions={
						canSwitchNavigationMenu
							? __(
									'Choose an existing navigation menu or create a new one.'
							  )
							: __( 'New navigation menu.' )
					}
				>
					{ canSwitchNavigationMenu && (
						<Dropdown
							contentClassName="wp-block-template-part__placeholder-preview-dropdown-content"
							position="bottom right left"
							renderToggle={ ( { isOpen, onToggle } ) => (
								<Button
									variant="primary"
									onClick={ onToggle }
									aria-expanded={ isOpen }
								>
									{ __( 'Choose existing' ) }
								</Button>
							) }
							renderContent={ ( { onClose } ) => (
								<NavigationMenuSelector
									onSelect={ onSelectExisting }
									onClose={ onClose }
								/>
							) }
						/>
					) }
					<Button
						variant={
							canSwitchNavigationMenu ? 'tertiary' : 'primary'
						}
						onClick={ () => {
							setIsNewMenuModalVisible( true );
						} }
					>
						{ __( 'New menu' ) }
					</Button>
				</Placeholder>
			) }
			{ isNewMenuModalVisible && (
				<NavigationMenuNameModal
					title={ __( 'Create your new navigation menu' ) }
					onRequestClose={ () => {
						setIsNewMenuModalVisible( false );
					} }
					onFinish={ onCreateNew }
				/>
			) }
		</>
	);
}
