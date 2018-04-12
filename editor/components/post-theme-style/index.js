/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { FormToggle, withInstanceId } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { getEditedPostAttribute } from '../../store/selectors';
import { editPost } from '../../store/actions';

function PostThemeStyle( { themeStyleStatus = 'open', instanceId, ...props } ) {
	const onToggleThemeStyle = () => props.editPost( { theme_style_status: themeStyleStatus === 'open' ? 'closed' : 'open' } );

	const themeStyleToggleId = 'allow-theme-style-toggle-' + instanceId;

	return [
		<label key="label" htmlFor={ themeStyleToggleId }>{ __( 'Use theme style' ) }</label>,
		<FormToggle
			key="toggle"
			checked={ themeStyleStatus === 'open' }
			onChange={ onToggleThemeStyle }
			showHint={ false }
			id={ themeStyleToggleId }
		/>,
	];
}

export default connect(
	( state ) => {
		return {
			themeStyleStatus: getEditedPostAttribute( state, 'theme_style_status' ),
		};
	},
	{
		editPost,
	}
)( withInstanceId( PostThemeStyle ) );

