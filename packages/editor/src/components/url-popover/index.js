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
			isEditing,
			renderEditingState,
			renderViewingState,
			renderSettings,
			position,
			onClickOutside,
		} = this.props;

		const {
			isSettingsExpanded,
		} = this.state;

		const showSettings = !! renderSettings && isSettingsExpanded;

		return (
			<Popover
				focusOnMount={ isEditing ? 'firstElement' : false }
				position={ position || 'bottom center' }
				onClickOutside={ onClickOutside }
			>
				<div className="editor-url-popover__row">
					{ isEditing ? renderEditingState() : renderViewingState() }
					<IconButton
						className="editor-url-popover__settings-toggle"
						icon="ellipsis"
						label={ __( 'Link Settings' ) }
						onClick={ this.toggleSettingsVisibility }
						aria-expanded={ isSettingsExpanded }
					/>
				</div>
				{ showSettings ? (
					<div className="editor-url-popover__row editor-url-popover__settings">
						{ renderSettings() }
					</div>
				) : null }
			</Popover>
		);
	}
}

export default URLPopover;
