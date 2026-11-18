/**
 * Shows the Auto menu state on the Navigation block in the canvas (#86934,
 * #86939), as a labelled toolbar button. It opens a short explanation and the
 * same "Customize" step as the list view.
 */

import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	Button,
	Dropdown,
	ToolbarGroup,
	ToolbarButton,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';
import { Stack, Text } from '@wordpress/ui';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { update } from '@wordpress/icons';
import { useIsAutoMenu, AutoMenuDescription } from './auto-menu';
import {
	useCustomizeAutoMenu,
	AutoMenuCustomizeDialog,
} from './auto-menu-customize';

function AutoMenuToolbar( { clientId } ) {
	const [ isConfirming, setIsConfirming ] = useState( false );
	const { canCustomize, isBusy, customize } =
		useCustomizeAutoMenu( clientId );
	const { selectBlock } = useDispatch( blockEditorStore );

	return (
		<>
			<BlockControls group="other">
				<ToolbarGroup>
					<Dropdown
						popoverProps={ { placement: 'bottom-start' } }
						renderToggle={ ( { isOpen, onToggle } ) => (
							<ToolbarButton
								icon={ update }
								onClick={ onToggle }
								aria-expanded={ isOpen }
								aria-haspopup="true"
								className="wp-block-navigation-auto-menu__toolbar-button"
							>
								{ __( 'Auto menu' ) }
							</ToolbarButton>
						) }
						renderContent={ ( { onClose } ) => (
							<DropdownContentWrapper paddingSize="medium">
								<Stack
									direction="column"
									gap="sm"
									className="wp-block-navigation-auto-menu__toolbar-popover"
								>
									<Text
										variant="heading-sm"
										render={ <h3 /> }
									>
										{ __( 'Auto menu' ) }
									</Text>
									<AutoMenuDescription />
									<Button
										__next40pxDefaultSize
										variant="secondary"
										accessibleWhenDisabled
										disabled={ ! canCustomize }
										style={ { justifyContent: 'center' } }
										onClick={ () => {
											onClose();
											setIsConfirming( true );
										} }
									>
										{ __( 'Customize' ) }
									</Button>
								</Stack>
							</DropdownContentWrapper>
						) }
					/>
				</ToolbarGroup>
			</BlockControls>
			{ isConfirming && (
				<AutoMenuCustomizeDialog
					isBusy={ isBusy }
					onConfirm={ () => {
						setIsConfirming( false );
						customize();
						// The toolbar button goes away with the Auto menu, so
						// keep the Navigation block selected for its toolbar.
						selectBlock( clientId );
					} }
					onCancel={ () => setIsConfirming( false ) }
				/>
			) }
		</>
	);
}

/**
 * Renders the Auto menu toolbar button when the Navigation block is an Auto
 * menu and the experiment is on. Renders nothing otherwise.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId Client id of the Navigation block.
 */
export default function AutoMenuBlockControls( { clientId } ) {
	const isAutoMenu = useIsAutoMenu( clientId );
	if ( ! isAutoMenu ) {
		return null;
	}
	return <AutoMenuToolbar clientId={ clientId } />;
}
