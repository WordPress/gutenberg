/**
 * WordPress dependencies
 */
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';

export default function LoginOutEdit( { attributes, setAttributes } ) {
	const { displayLoginAsForm, redirectToCurrent } = attributes;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Login/out settings' ) }>
					<ToggleControl
						label={ __( 'Display login as form' ) }
						checked={ displayLoginAsForm }
						onChange={ () =>
							setAttributes( {
								displayLoginAsForm: ! displayLoginAsForm,
							} )
						}
					/>
					<ToggleControl
						label={ __( 'Redirect to current URL' ) }
						checked={ redirectToCurrent }
						onChange={ () =>
							setAttributes( {
								redirectToCurrent: ! redirectToCurrent,
							} )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div
				{ ...useBlockProps( {
					className: 'logged-in',
				} ) }
			>
				<a href="#login-pseudo-link">{ __( 'Log out' ) }</a>
			</div>
		</>
	);
}
