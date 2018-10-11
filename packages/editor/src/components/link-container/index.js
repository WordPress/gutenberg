import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	Popover,
	IconButton,
} from '@wordpress/components';

class LinkContainer extends Component {
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
			renderPreviewState,
			renderSettings,
			position,
			onClickOutside,
		} = this.props;

		const {
			isSettingsExpanded,
		} = this.state;

		const showSettings = isSettingsExpanded && !! renderSettings;

		return (
			<Popover
				focusOnMount={ isEditing ? 'firstElement' : false }
				position={ position || 'bottom center' }
				onClickOutside={ onClickOutside }
			>
				<div className="editor-link-container__popover-row">
					{ isEditing ? renderEditingState() : renderPreviewState() }
					<IconButton
						className="editor-link-container__settings-toggle"
						icon="ellipsis"
						label={ __( 'Link Settings' ) }
						onClick={ this.toggleSettingsVisibility }
						aria-expanded={ isSettingsExpanded }
					/>
				</div>
				{ showSettings ? (
					<div className="editor-link-container__popover-row editor-link-container__settings">
						{ renderSettings() }
					</div>
				) : null }
			</Popover>
		);
	}
}

export default LinkContainer;
