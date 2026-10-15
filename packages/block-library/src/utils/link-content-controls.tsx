import type { ReactNode } from 'react';
import {
	Button,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { CheckboxControl, InputControl } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import {
	privateApis as blockEditorPrivateApis,
	// @ts-expect-error No exported types
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { external } from '@wordpress/icons';
import { useToolsPanelDropdownMenuProps } from './use-tools-panel-dropdown-menu-props';
import { unlock } from '../lock-unlock';

const { LinkPicker, isHashLink, isRelativePath } = unlock(
	blockEditorPrivateApis
);

interface LinkContentControlsProps {
	/** The link text, shown stripped of markup. */
	text?: string;
	/** Called with the new text, or an empty string on reset. */
	onTextChange: ( text: string ) => void;
	/** The link URL. */
	url?: string;
	/** Preview data for the link picker, from `useLinkPreview`. */
	preview: object;
	/** Called with the suggestion picked in the link picker. */
	onLinkSelect: ( suggestion: object ) => void;
	/** Called when the link is reset from the panel menu. */
	onLinkRemove: () => void;
	/** Search options for the link picker's suggestions. */
	suggestionsQuery?: object;
	/** Help text under the link picker. */
	linkHelp?: string;
	/** Whether the link opens in a new tab. */
	opensInNewTab: boolean;
	/** Called with the new "Open in new tab" state. */
	onOpensInNewTabChange: ( opensInNewTab: boolean ) => void;
	/** Whether the link fields are shown. Defaults to true. */
	isLinkEditable?: boolean;
	/** Called when the whole panel is reset. */
	onResetAll: () => void;
	/** Extra buttons placed with the View button, such as Edit. */
	actions?: ReactNode;
	/** Extra panel items shown after the shared ones. */
	children?: ReactNode;
}

/**
 * The content Settings panel shared by link-like blocks: Text, Link to,
 * Open in new tab, and View. A block maps its own attributes onto these
 * props, so a Button and a Navigation Link edit the same way.
 *
 * @param props                       Component props.
 * @param props.text                  The link text, shown stripped of markup.
 * @param props.onTextChange          Called with the new text, or an empty string on reset.
 * @param props.url                   The link URL.
 * @param props.preview               Preview data for the link picker, from `useLinkPreview`.
 * @param props.onLinkSelect          Called with the suggestion picked in the link picker.
 * @param props.onLinkRemove          Called when the link is reset from the panel menu.
 * @param props.suggestionsQuery      Search options for the link picker's suggestions.
 * @param props.linkHelp              Help text under the link picker.
 * @param props.opensInNewTab         Whether the link opens in a new tab.
 * @param props.onOpensInNewTabChange Called with the new "Open in new tab" state.
 * @param props.isLinkEditable        Whether the link fields are shown. Defaults to true.
 * @param props.onResetAll            Called when the whole panel is reset.
 * @param props.actions               Extra buttons placed with the View button, such as Edit.
 * @param props.children              Extra panel items shown after the shared ones.
 */
export default function LinkContentControls( {
	text,
	onTextChange,
	url,
	preview,
	onLinkSelect,
	onLinkRemove,
	suggestionsQuery,
	linkHelp,
	opensInNewTab,
	onOpensInNewTabChange,
	isLinkEditable = true,
	onResetAll,
	actions,
	children,
}: LinkContentControlsProps ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const homeUrl = useSelect(
		( select ) =>
			(
				select( coreStore ).getEntityRecord(
					'root',
					'__unstableBase'
				) as { home?: string } | undefined
			 )?.home,
		[]
	);

	// Hash links and relative paths other than site-root paths can't be
	// opened on their own.
	const isViewableUrl =
		!! url &&
		( ! isHashLink( url ) ||
			( isRelativePath( url ) && ! url.startsWith( '/' ) ) );
	// Site-root paths open against the home URL.
	const viewUrl =
		isViewableUrl && url.startsWith( '/' ) && homeUrl ? homeUrl + url : url;

	return (
		<ToolsPanel
			label={ __( 'Settings' ) }
			resetAll={ onResetAll }
			dropdownMenuProps={ dropdownMenuProps }
		>
			<ToolsPanelItem
				hasValue={ () => !! text }
				label={ __( 'Text' ) }
				onDeselect={ () => onTextChange( '' ) }
				isShownByDefault
			>
				<InputControl
					label={ __( 'Text' ) }
					value={ text ? stripHTML( text ) : '' }
					onValueChange={ onTextChange }
					autoComplete="off"
				/>
			</ToolsPanelItem>

			{ isLinkEditable && (
				<>
					<ToolsPanelItem
						hasValue={ () => !! url }
						label={ __( 'Link to' ) }
						onDeselect={ onLinkRemove }
						isShownByDefault
					>
						<LinkPicker
							preview={ preview }
							onSelect={ onLinkSelect }
							suggestionsQuery={ suggestionsQuery }
							label={ __( 'Link to' ) }
							help={ linkHelp }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => !! opensInNewTab }
						label={ __( 'Open in new tab' ) }
						onDeselect={ () => onOpensInNewTabChange( false ) }
						isShownByDefault
					>
						<CheckboxControl
							label={ __( 'Open in new tab' ) }
							checked={ opensInNewTab }
							onCheckedChange={ onOpensInNewTabChange }
						/>
					</ToolsPanelItem>
					{ actions }
					{ isViewableUrl && (
						<Button
							variant="secondary"
							href={ viewUrl }
							target="_blank"
							icon={ external }
							iconPosition="right"
							__next40pxDefaultSize
							className="navigation-link-to__action-button"
						>
							{ __( 'View' ) }
						</Button>
					) }
				</>
			) }

			{ children }
		</ToolsPanel>
	);
}
