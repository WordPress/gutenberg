import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { InputControl } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

export default function LoginOutEdit( { attributes, setAttributes } ) {
	const { displayLoginAsForm, redirectToCurrent, loginText, logoutText } =
		attributes;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							displayLoginAsForm: false,
							redirectToCurrent: true,
							loginText: 'Log in',
							logoutText: 'Log out',
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Display login as form' ) }
						isShownByDefault
						hasValue={ () => displayLoginAsForm }
						onDeselect={ () =>
							setAttributes( { displayLoginAsForm: false } )
						}
					>
						<ToggleControl
							label={ __( 'Display login as form' ) }
							checked={ displayLoginAsForm }
							onChange={ () =>
								setAttributes( {
									displayLoginAsForm: ! displayLoginAsForm,
								} )
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Redirect to current URL' ) }
						isShownByDefault
						hasValue={ () => ! redirectToCurrent }
						onDeselect={ () =>
							setAttributes( { redirectToCurrent: true } )
						}
					>
						<ToggleControl
							label={ __( 'Redirect to current URL' ) }
							checked={ redirectToCurrent }
							onChange={ () =>
								setAttributes( {
									redirectToCurrent: ! redirectToCurrent,
								} )
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Login Text' ) }
						isShownByDefault
						hasValue={ () => loginText !== 'Log in' }
						onDeselect={ () =>
							setAttributes( { loginText: 'Log in' } )
						}
					>
						<InputControl
							label={ __( 'Login Text' ) }
							value={ loginText }
							onValueChange={ ( value ) =>
								setAttributes( { loginText: value } )
							}
							placeholder={ __( 'Enter login text' ) }
							description={ __(
								'Customize the text for the login.'
							) }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Logout Text' ) }
						isShownByDefault
						hasValue={ () => logoutText !== 'Log out' }
						onDeselect={ () =>
							setAttributes( { logoutText: 'Log out' } )
						}
					>
						<InputControl
							label={ __( 'Logout Text' ) }
							value={ logoutText }
							onValueChange={ ( value ) =>
								setAttributes( { logoutText: value } )
							}
							placeholder={ __( 'Enter logout text' ) }
							description={ __(
								'Customize the text for the logout.'
							) }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<div
				{ ...useBlockProps( {
					className: 'logged-in',
				} ) }
			>
				<a href="#login-pseudo-link">{ logoutText }</a>
			</div>
		</>
	);
}
