/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	Dropdown,
	Flex,
	FlexItem,
	Modal,
	Placeholder,
	TextControl,
} from '@wordpress/components';
import { navigation as navigationIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PlaceholderPreview from './placeholder-preview';
import NavigationMenuSelector from '../navigation-menu-selector';

export default function SelectNavigationMenuStep( {
	canSwitchNavigationMenu,
	hasResolvedNavigationMenu,
	onCreateNew,
	onSelectExisting,
} ) {
	const [ isNewMenuModalVisible, setIsNewMenuModalVisible ] = useState(
		false
	);
	const [ title, setTitle ] = useState( __( 'Untitled Menu' ) );

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
				<Modal
					title={ __( 'Create your new navigation menu' ) }
					closeLabel={ __( 'Cancel' ) }
					onRequestClose={ () => {
						setIsNewMenuModalVisible( false );
					} }
					overlayClassName="wp-block-template-part__placeholder-create-new__title-form"
				>
					<form
						onSubmit={ ( event ) => {
							event.preventDefault();
							onCreateNew( title );
						} }
					>
						<TextControl
							label={ __( 'Name' ) }
							value={ title }
							onChange={ setTitle }
						/>
						<Flex
							className="wp-block-template-part__placeholder-create-new__title-form-actions"
							justify="flex-end"
						>
							<FlexItem>
								<Button
									variant="secondary"
									onClick={ () => {
										setIsNewMenuModalVisible( false );
									} }
								>
									{ __( 'Cancel' ) }
								</Button>
							</FlexItem>
							<FlexItem>
								<Button
									variant="primary"
									type="submit"
									disabled={ ! title.length }
									aria-disabled={ ! title.length }
								>
									{ __( 'Create' ) }
								</Button>
							</FlexItem>
						</Flex>
					</form>
				</Modal>
			) }
		</>
	);
}
