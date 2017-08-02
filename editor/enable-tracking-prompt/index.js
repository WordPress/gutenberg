/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Button } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { removeNotice } from '../actions';

function EnableTrackingPrompt( props ) {
	function dismissTrackingPrompt( result ) {
		window.setUserSetting( 'gutenberg_tracking', result );
		props.removeNotice( 'notice:enable-tracking-prompt' );
	}

	return (
		<div className="enable-tracking-prompt">
			<div className="enable-tracking-prompt__message">
				{ __( 'Can Gutenberg collect data about your usage of the editor?' ) }
				<div className="enable-tracking-prompt__buttons">
					<Button
						isPrimary
						isSmall
						onClick={ () => dismissTrackingPrompt( 'on' ) }
					>
						{ __( 'Yes' ) }
					</Button>
					<Button
						isSecondary
						isSmall
						onClick={ () => dismissTrackingPrompt( 'off' ) }
					>
						{ __( 'No' ) }
					</Button>
				</div>
			</div>
			<div className="enable-tracking-prompt__clarification">
				{ __( 'Usage data is completely anonymous and will only be used to improve the editor.' ) }
			</div>
		</div>
	);
}

export default connect(
	undefined,
	{ removeNotice }
)( EnableTrackingPrompt );

