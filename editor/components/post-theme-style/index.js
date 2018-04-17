/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { FormToggle, withInstanceId } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/element';

function PostThemeStyle( { themeStyleStatus = 'open', instanceId, ...props } ) {
	const onToggleThemeStyle = () => props.editPost( { theme_style_status: themeStyleStatus === 'open' ? 'closed' : 'open' } );

	const themeStyleToggleId = 'allow-theme-style-toggle-' + instanceId;

	return [
		<label key="label" htmlFor={ themeStyleToggleId }>{ __( 'Display theme-style' ) }</label>,
		<FormToggle
			key="toggle"
			checked={ themeStyleStatus === 'open' }
			onChange={ onToggleThemeStyle }
			showHint={ false }
			id={ themeStyleToggleId }
		/>,
	];
}

export default compose( [
	withSelect( ( select ) => {
		return {
			themeStyleStatus: select( 'core/editor' ).getEditedPostAttribute( 'theme_style_status' ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		editPost: dispatch( 'core/editor' ).editPost,
	} ) ),
	withInstanceId,
] )( PostThemeStyle );

