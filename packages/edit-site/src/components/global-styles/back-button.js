/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { __experimentalNavigatorToParentButton as NavigatorToParentButton } from '@wordpress/components';
import { chevronRight, chevronLeft } from '@wordpress/icons';

function GlobalStylesBackButton( { onBack } ) {
	return (
		<NavigatorToParentButton
			style={
				// TODO: This style override is also used in ToolsPanelHeader.
				// It should be supported out-of-the-box by Button.
				{ minWidth: 24, padding: 0 }
			}
			icon={ isRTL() ? chevronRight : chevronLeft }
			isSmall
			aria-label={ __( 'Navigate to the previous view' ) }
			onClick={ onBack }
		/>
	);
}

export default GlobalStylesBackButton;
