/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import './style.scss';
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { IconButton, ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import UrlInput from './';

class UrlInputButton extends Component {
	constructor() {
		super(...arguments);
		this.toggle = this.toggle.bind(this);
		this.submitLink = this.submitLink.bind(this);
		this.toggleLinkSettingsVisibility = this.toggleLinkSettingsVisibility.bind(this);
		this.setLinkTarget = this.setLinkTarget.bind(this);

		this.state = {
			expanded: false,
			settingsVisible: false,
			opensInNewWindow: false,
		};
	}

	// this.state = {
	//
	// 	linkValue: '',
	// };

	toggle() {
		this.setState({ expanded: !this.state.expanded });
	}



	submitLink(event) {
		event.preventDefault();
		this.toggle();
	}

	toggleLinkSettingsVisibility() {
		this.setState((state) => ({ settingsVisible: !state.settingsVisible }));
	}

	setLinkTarget(opensInNewWindow) {
		this.setState({ opensInNewWindow });
		if (opensInNewWindow) {
			console.log(this.props)

			this.props.setAttributes({ target: '_blank' })
		}
	}


	render() {
		const { url, onChange } = this.props;
		const { expanded, settingsVisible, opensInNewWindow } = this.state;
		const buttonLabel = url ? __('Edit Link') : __('Insert Link');

		const linkSettings = settingsVisible && (
			<div className="editor-format-toolbar__link-modal-line editor-format-toolbar__link-settings">
				<ToggleControl
					label={__('Open in new window')}
					checked={opensInNewWindow}
					onChange={this.setLinkTarget}
				/>
			</div>
		);

		return (
			<div className="editor-url-input__button">
				<IconButton
					icon="admin-links"
					label={buttonLabel}
					onClick={this.toggle}
					className={classnames('components-toolbar__control', {
						'is-active': url,
					})}
				/>
				{expanded &&
					<form
						className="editor-url-input__button-modal"
						onSubmit={this.submitLink}
					>
						<div className="editor-url-input__button-modal-line">
							<UrlInput value={url || ''} onChange={onChange} data-test="UrlInput" />
							<IconButton
								icon="editor-break"
								label={__('Submit')}
								type="submit"
							/>
							<IconButton
								className="editor-format-toolbar__link-settings-toggle"
								icon="ellipsis"
								label={__('Link Settings')}
								onClick={this.toggleLinkSettingsVisibility}
							// aria-expanded={settingsVisible}
							/>
						</div>
						{linkSettings}
					</form>
				}
			</div>
		);
	}
}

export default UrlInputButton;
