/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	ExternalLink,
	Fill,
	IconButton,
	Popover,
	ToggleControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import PositionedAtSelection from './positioned-at-selection';
import URLInput from '../../url-input';
import { filterURLForDisplay } from '../../../utils/url';

const stopKeyPropagation = ( event ) => event.stopPropagation();

const LinkContainer = ( props ) => {
	const {
		editLink,
		formats,
		isEditing,
		isPreviewing,
		linkValue,
		onChangeLinkValue,
		onKeyDown,
		opensInNewWindow,
		selectedNodeId,
		setLinkTarget,
		settingsVisible,
		submitLink,
		toggleLinkSettingsVisibility,
	} = props;

	const linkSettings = settingsVisible && (
		<div className="editor-format-toolbar__link-modal-line editor-format-toolbar__link-settings">
			<ToggleControl
				label={ __( 'Open in New Window' ) }
				checked={ opensInNewWindow }
				onChange={ setLinkTarget } />
		</div>
	);

	return (
		<Fill name="RichText.Siblings">
			<PositionedAtSelection
				className="editor-format-toolbar__link-container"
				key={ selectedNodeId /* Used to force remount on change to ensure popover repositions */ }
			>
				<Popover
					position="bottom center"
					focusOnMount={ isEditing ? 'firstElement' : false }
				>
					{ isEditing && (
						// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
						/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
						<form
							className="editor-format-toolbar__link-modal"
							onKeyPress={ stopKeyPropagation }
							onKeyDown={ onKeyDown }
							onSubmit={ submitLink }>
							<div className="editor-format-toolbar__link-modal-line">
								<URLInput value={ linkValue } onChange={ onChangeLinkValue } />
								<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
								<IconButton
									className="editor-format-toolbar__link-settings-toggle"
									icon="ellipsis"
									label={ __( 'Link Settings' ) }
									onClick={ toggleLinkSettingsVisibility }
									aria-expanded={ settingsVisible }
								/>
							</div>
							{ linkSettings }
						</form>
						/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
					) }

					{ isPreviewing && (
						// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
						/* eslint-disable jsx-a11y/no-static-element-interactions */
						<div
							className="editor-format-toolbar__link-modal"
							onKeyPress={ stopKeyPropagation }
						>
							<div className="editor-format-toolbar__link-modal-line">
								<ExternalLink
									className="editor-format-toolbar__link-value"
									href={ formats.link.value }
								>
									{ formats.link.value && filterURLForDisplay( decodeURI( formats.link.value ) ) }
								</ExternalLink>
								<IconButton icon="edit" label={ __( 'Edit' ) } onClick={ editLink } />
								<IconButton
									className="editor-format-toolbar__link-settings-toggle"
									icon="ellipsis"
									label={ __( 'Link Settings' ) }
									onClick={ toggleLinkSettingsVisibility }
									aria-expanded={ settingsVisible }
								/>
							</div>
							{ linkSettings }
						</div>
						/* eslint-enable jsx-a11y/no-static-element-interactions */
					) }
				</Popover>
			</PositionedAtSelection>
		</Fill>
	);
};

export default LinkContainer;
