/**
 * WordPress dependencies
 */
import { MenuItem, VisuallyHidden } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { external } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import CopyContentMenuItem from './copy-content-menu-item';
import KeyboardShortcutsHelpMenuItem from './keyboard-shortcuts-help-menu-item';
import ToolsMoreMenuGroup from '../components/header/tools-more-menu-group';
import WelcomeGuideMenuItem from './welcome-guide-menu-item';

function ManagePatternsMenuItem() {
	const defaultUrl = addQueryArgs( 'edit.php', { postType: 'wp_block' } );
	const patternsUrl = addQueryArgs( 'site-editor.php', {
		path: '/patterns',
	} );

	const [ url, setUrl ] = useState( defaultUrl );

	useEffect( () => {
		window.fetch( patternsUrl ).then( ( response ) => {
			if ( response?.status === 200 ) {
				setUrl( patternsUrl );
			}
		} );
	}, [] );

	return (
		<MenuItem role="menuitem" href={ url }>
			{ __( 'Manage Patterns' ) }
		</MenuItem>
	);
}

registerPlugin( 'edit-post', {
	render() {
		return (
			<>
				<ToolsMoreMenuGroup>
					{ ( { onClose } ) => (
						<>
							<ManagePatternsMenuItem />
							<KeyboardShortcutsHelpMenuItem
								onSelect={ onClose }
							/>
							<WelcomeGuideMenuItem />
							<CopyContentMenuItem />
							<MenuItem
								role="menuitem"
								icon={ external }
								href={ __(
									'https://wordpress.org/documentation/article/wordpress-block-editor/'
								) }
								target="_blank"
								rel="noopener noreferrer"
							>
								{ __( 'Help' ) }
								<VisuallyHidden as="span">
									{
										/* translators: accessibility text */
										__( '(opens in a new tab)' )
									}
								</VisuallyHidden>
							</MenuItem>
						</>
					) }
				</ToolsMoreMenuGroup>
			</>
		);
	},
} );
