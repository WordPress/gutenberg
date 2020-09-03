/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function LoginOutEdit( {
	attributes: { logInText, logOutText },
	setAttributes,
} ) {
	logInText = logInText || __( 'Log In' );
	logOutText = logOutText || __( 'Log Out' );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Link Text' ) }>
					<TextControl
						label={ __( 'Login Text' ) }
						value={ logInText }
						default={ __( 'Log In' ) }
						onChange={ ( value ) => {
							setAttributes( { logInText: value } );
						} }
					/>
					<TextControl
						label={ __( 'Logout Text' ) }
						value={ logOutText }
						default={ __( 'Log In' ) }
						onChange={ ( value ) => {
							setAttributes( { logOutText: value } );
						} }
					/>
				</PanelBody>
			</InspectorControls>

			<Block.div className={ classnames() }>
				<span className="wp-block-loginout">{ logOutText }</span>
			</Block.div>
		</>
	);
}

export default LoginOutEdit;
