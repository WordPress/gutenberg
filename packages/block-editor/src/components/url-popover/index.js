/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	Popover,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import LinkViewer from './link-viewer';
import LinkEditor from './link-editor';
import { unlock } from '../../lock-unlock';

const { __experimentalPopoverLegacyPositionToPlacement } = unlock(
	componentsPrivateApis
);

const DEFAULT_PLACEMENT = 'bottom';

function URLPopover( {
	additionalControls,
	children,
	renderSettings,
	// The DEFAULT_PLACEMENT value is assigned inside the function's body
	placement,
	focusOnMount = 'firstElement',
	// Deprecated
	position,
	// Rest
	...popoverProps
} ) {
	if ( position !== undefined ) {
		deprecated( '`position` prop in wp.blockEditor.URLPopover', {
			since: '6.2',
			alternative: '`placement` prop',
		} );
	}

	// Compute popover's placement:
	// - give priority to `placement` prop, if defined
	// - otherwise, compute it from the legacy `position` prop (if defined)
	// - finally, fallback to the DEFAULT_PLACEMENT.
	let computedPlacement;
	if ( placement !== undefined ) {
		computedPlacement = placement;
	} else if ( position !== undefined ) {
		computedPlacement =
			__experimentalPopoverLegacyPositionToPlacement( position );
	}
	computedPlacement = computedPlacement || DEFAULT_PLACEMENT;

	const [ isSettingsExpanded, setIsSettingsExpanded ] = useState( false );

	const showSettings = !! renderSettings && isSettingsExpanded;

	const toggleSettingsVisibility = () => {
		setIsSettingsExpanded( ! isSettingsExpanded );
	};

	return (
		<Popover
			className="block-editor-url-popover"
			focusOnMount={ focusOnMount }
			placement={ computedPlacement }
			shift
			{ ...popoverProps }
		>
			<div className="block-editor-url-popover__input-container">
				<div className="block-editor-url-popover__row">
					{ children }
					{ !! renderSettings && (
						<Button
							className="block-editor-url-popover__settings-toggle"
							icon={ chevronDown }
							label={ __( 'Link settings' ) }
							onClick={ toggleSettingsVisibility }
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
				<div className="block-editor-url-popover__additional-controls">
					{ additionalControls }
				</div>
			) }
		</Popover>
	);
}

URLPopover.LinkEditor = LinkEditor;

URLPopover.LinkViewer = LinkViewer;

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/url-popover/README.md
 */
export default URLPopover;
