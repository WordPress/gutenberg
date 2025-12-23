/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

export default function LoginOutEdit( { attributes, setAttributes } ) {
	const { displayLoginAsForm, displayAsButton, redirectToCurrent } =
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
						label={ __( 'Display as button' ) }
						isShownByDefault
						hasValue={ () => displayAsButton }
						onDeselect={ () =>
							setAttributes( { displayAsButton: false } )
						}
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Display as button' ) }
							checked={ displayAsButton }
							onChange={ () =>
								setAttributes( {
									displayAsButton: ! displayAsButton,
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
				</ToolsPanel>
			</InspectorControls>
			<div
				{ ...useBlockProps( {
					className: `logged-in${
						displayAsButton ? ' wp-block-button' : ''
					}`,
				} ) }
			>
				{ displayAsButton ? (
					<div className="wp-block-button__link wp-element-button">
						<a href="#login-pseudo-link">{ __( 'Log out' ) }</a>
					</div>
				) : (
					<a href="#login-pseudo-link">{ __( 'Log out' ) }</a>
				) }
			</div>
		</>
	);
}
