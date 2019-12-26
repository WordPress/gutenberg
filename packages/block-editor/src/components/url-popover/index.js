/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	Button,
	Popover,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import LinkViewer from './link-viewer';
import LinkEditor from './link-editor';

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
			additionalControls,
			children,
			renderSettings,
			position = 'bottom center',
			focusOnMount = 'firstElement',
			...popoverProps
		} = this.props;

		const {
			isSettingsExpanded,
		} = this.state;

		const showSettings = !! renderSettings && isSettingsExpanded;

		return (
			<Popover
				className="block-editor-url-popover"
				focusOnMount={ focusOnMount }
				position={ position }
				{ ...popoverProps }
			>
				<div className="block-editor-url-popover__input-container">
					<div className="block-editor-url-popover__row">
						{ children }
						{ !! renderSettings && (
							<Button
								className="block-editor-url-popover__settings-toggle"
								icon="arrow-down-alt2"
								label={ __( 'Link settings' ) }
								onClick={ this.toggleSettingsVisibility }
								aria-expanded={ isSettingsExpanded }
							/>
						) }
					</div>
					{ showSettings && (
						<div className="block-editor-url-popover__row block-editor-url-popover__settings">
							{ renderSettings() }
						</div>
					) }
				</div>
				{ additionalControls && ! showSettings && (
					<div
						className="block-editor-url-popover__additional-controls"
					>
						{ additionalControls }
					</div>
				) }
			</Popover>
		);
	}
}

URLPopover.LinkEditor = LinkEditor;

URLPopover.LinkViewer = LinkViewer;

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/url-popover/README.md
 */
export default URLPopover;
