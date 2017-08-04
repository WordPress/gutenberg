/**
 * External dependencies
 */
import { connect } from 'react-redux';
import clickOutside from 'react-click-outside';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { bumpStat } from '../utils/tracking';
import { removeNotice } from '../actions';

export const TRACKING_PROMPT_NOTICE_ID = 'notice:enable-tracking-prompt';

export class EnableTrackingPrompt extends Component {
	constructor() {
		super();
		this.state = {
			showInfoPopover: false,
		};
		this.dismissTrackingPrompt = this.dismissTrackingPrompt.bind( this );
		this.toggleInfoPopover = this.toggleInfoPopover.bind( this );
		this.handleClickOutside = this.handleClickOutside.bind( this );
	}

	dismissTrackingPrompt( enableTracking ) {
		window.setUserSetting(
			'gutenberg_tracking',
			enableTracking ? 'on' : 'off'
		);
		if ( enableTracking ) {
			bumpStat( 'tracking', 'opt-in' );
		}
		this.props.removeNotice( TRACKING_PROMPT_NOTICE_ID );
	}

	toggleInfoPopover( event ) {
		event.stopPropagation();
		this.setState( {
			showInfoPopover: ! this.state.showInfoPopover,
		} );
	}

	handleClickOutside() {
		this.setState( {
			showInfoPopover: false,
		} );
	}

	render() {
		return (
			// Ignore reason: This event handler exists only to catch click
			// events in the notice but outside the "More info" popover.
			// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role
			<div
				className="enable-tracking-prompt"
				onClick={ this.handleClickOutside }
			>
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
					<span className="enable-tracking-prompt__more-info">
						<Button
							onClick={ this.toggleInfoPopover }
							aria-expanded={ this.state.showInfoPopover }
						>
							{ __( 'More info' ) }
						</Button>
						{ this.state.showInfoPopover && (
							<Popover
								position="bottom right"
								className="enable-tracking-prompt__clarification"
							>
								{ __( 'Usage data is completely anonymous, does not include your post content, and will only be used to improve the editor.' ) }
							</Popover>
						) }
					</span>
				</div>
			</div>
		);
	}
}

export default connect(
	undefined,
	{ removeNotice }
)( clickOutside( EnableTrackingPrompt ) );
