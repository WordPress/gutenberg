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
			...popoverProps
		} = this.props;

		const {
			isSettingsExpanded,
		} = this.state;

		const showSettings = isSettingsExpanded && !! renderSettings;

		return (
			<Popover
				focusOnMount={ isEditing ? 'firstElement' : false }
				{ ...popoverProps }
			>
				<div className="editor-format-toolbar__link-modal-line">
					{ isEditing ? renderEditingState() : renderPreviewState() }
					<IconButton
						className="editor-format-toolbar__link-settings-toggle"
						icon="ellipsis"
						label={ __( 'Link Settings' ) }
						onClick={ this.toggleSettingsVisibility }
						aria-expanded={ isSettingsExpanded }
					/>
				</div>
				{ showSettings ? (
					<div className="editor-format-toolbar__link-modal-line editor-format-toolbar__link-settings">
						{ renderSettings() }
					</div>
				) : null }
			</Popover>
		);
	}
}

export default LinkContainer;
