/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { bumpStat } from '../utils/tracking';
import { removeNotice } from '../actions';

export const TRACKING_PROMPT_NOTICE_ID = 'notice:enable-tracking-prompt';

export function EnableTrackingPrompt( props ) {
	function dismissTrackingPrompt( enableTracking ) {
		window.setUserSetting(
			'gutenberg_tracking',
			enableTracking ? 'on' : 'off'
		);
		if ( enableTracking ) {
			bumpStat( 'tracking', 'opt-in' );
		}
		props.removeNotice( TRACKING_PROMPT_NOTICE_ID );
	}

	return (
		<div className="enable-tracking-prompt">
			<div className="enable-tracking-prompt__message">
				{ __( 'Can Gutenberg collect data about your usage of the editor?' ) }
				<div className="enable-tracking-prompt__buttons">
					<Button
						isPrimary
						isSmall
						onClick={ () => dismissTrackingPrompt( true ) }
					>
						{ __( 'Yes' ) }
					</Button>
					<Button
						isSecondary
						isSmall
						onClick={ () => dismissTrackingPrompt( false ) }
					>
						{ __( 'No' ) }
					</Button>
				</div>
			</div>
			<div className="enable-tracking-prompt__clarification">
				{ __( 'Usage data is completely anonymous, does not include your post content, and will only be used to improve the editor.' ) }
			</div>
		</div>
	);
}

export default connect(
	undefined,
	{ removeNotice }
)( EnableTrackingPrompt );

