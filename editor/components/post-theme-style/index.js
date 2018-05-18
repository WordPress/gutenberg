/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { FormToggle, withInstanceId } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/element';

function PostThemeStyle( { onToggleThemeStyle, themeStyle = false, instanceId } ) {
	const themeStyleToggleId = 'theme-style-toggle-' + instanceId;

	return [
		<label htmlFor={ themeStyleToggleId }>{ __( 'Display theme-style' ) }</label>,
		<FormToggle
			key="toggle"
			checked={ themeStyle }
			onChange={ () => onToggleThemeStyle( ! themeStyle ) }
			id={ themeStyleToggleId }
		/>,
	];
}

export default compose( [
	withSelect( ( select ) => {
		return {
			themeStyle: select( 'core/editor' ).getEditedPostAttribute( 'theme_style' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		return {
			onToggleThemeStyle( themeStyle ) {
				dispatch( 'core/editor' ).editPost( { theme_style: themeStyle } )
			}
		};
	} ),
	withInstanceId,
] )( PostThemeStyle );

