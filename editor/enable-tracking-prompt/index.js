/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, InlineHelpPopover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { bumpStat, removeNotice } from '../actions';

export const TRACKING_PROMPT_NOTICE_ID = 'notice:enable-tracking-prompt';

export class EnableTrackingPrompt extends Component {
	constructor() {
		super();
		this.dismissTrackingPrompt = this.dismissTrackingPrompt.bind( this );
	}

	dismissTrackingPrompt( enableTracking ) {
		window.setUserSetting(
			'gutenberg_tracking',
			enableTracking ? 'on' : 'off'
		);
		if ( enableTracking ) {
			this.props.bumpStat( 'tracking', 'opt-in' );
		}
		this.props.removeNotice( TRACKING_PROMPT_NOTICE_ID );
	}

	render() {
		return (
			<div className="enable-tracking-prompt">
				<p className="enable-tracking-prompt__message">
					{ __( 'Can Gutenberg collect data about your usage of the editor?' ) }
				</p>
				<div className="enable-tracking-prompt__buttons">
					<Button
						isPrimary
						isSmall
						onClick={ () => this.dismissTrackingPrompt( true ) }
					>
						{ __( 'Yes' ) }
					</Button>
					<Button
						isSecondary
						isSmall
						onClick={ () => this.dismissTrackingPrompt( false ) }
					>
						{ __( 'No' ) }
					</Button>
					<InlineHelpPopover
						className="enable-tracking-prompt__more-info"
						text={ __( 'More info' ) }
						popoverPosition="bottom right"
						popoverClassName="enable-tracking-prompt__clarification"
					>
						{ __( 'Usage data is completely anonymous, does not include your post content, and will only be used to improve the editor.' ) }
					</InlineHelpPopover>
				</div>
			</div>
		);
	}
}

export default connect(
	undefined,
	{ bumpStat, removeNotice }
)( EnableTrackingPrompt );
