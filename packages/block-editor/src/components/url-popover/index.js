/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	Popover,
	IconButton,
} from '@wordpress/components';

class URLPopover extends Component {
	constructor() {
		super( ...arguments );

		this.toggleSettingsVisibility = this.toggleSettingsVisibility.bind( this );

		this.state = {
			isSettingsExpanded: false,
		};
	}

	toggleSettingsVisibility() {
		this.setState( {
			isSettingsExpanded: ! this.state.isSettingsExpanded,
		} );
	}

	render() {
		const {
			children,
			renderSettings,
			onClose,
			onClickOutside,
			position = 'bottom center',
			focusOnMount = 'firstElement',
		} = this.props;

		const {
			isSettingsExpanded,
		} = this.state;

		const showSettings = !! renderSettings && isSettingsExpanded;

		return (
			<Popover
				className="editor-url-popover block-editor-url-popover"
				focusOnMount={ focusOnMount }
				position={ position }
				onClose={ onClose }
				onClickOutside={ onClickOutside }
			>
				<div className="editor-url-popover__row block-editor-url-popover__row">
					{ children }
					{ !! renderSettings && (
						<IconButton
							className="editor-url-popover__settings-toggle block-editor-url-popover__settings-toggle"
							icon="arrow-down-alt2"
							label={ __( 'Link Settings' ) }
							onClick={ this.toggleSettingsVisibility }
							aria-expanded={ isSettingsExpanded }
						/>
					) }
				</div>
				{ showSettings && (
					<div className="editor-url-popover__row block-editor-url-popover__row editor-url-popover__settings block-editor-url-popover__settings">
						{ renderSettings() }
					</div>
				) }
			</Popover>
		);
	}
}

export default URLPopover;
