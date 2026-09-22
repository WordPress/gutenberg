import { __ } from '@wordpress/i18n';
import {
	Button,
	PanelBody,
	Popover,
	ToolbarButton,
	ToggleControl,
	ToolbarGroup,
	__experimentalItem as Item,
	__experimentalItemGroup as ItemGroup,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { Stack, Text, ValidatedInputControl } from '@wordpress/ui';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { chevronDown, chevronUp, pencil, trash } from '@wordpress/icons';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { toSourceList } from './sources';

// Anchors a row's flyout beside the sidebar, the way the other inspector lists
// that are edited from a popover do.
const SOURCE_POPOVER_PROPS = {
	placement: 'left-start',
	offset: 36,
	shift: true,
};

/**
 * The two things core can tell about a URL without knowing the provider: that
 * it is not already listed, and that it is not the URL the block embeds
 * already. Whether the video behind it exists, plays, or matches the one above
 * is for whoever knows the provider to say.
 *
 * The shape of the URL itself is left to the field's `url` type, so the
 * browser reports it in the reader's own language.
 *
 * @param {string}   url          URL being entered.
 * @param {string[]} otherSources URLs already listed, apart from this one.
 * @param {string}   embeddedURL  URL the block embeds.
 *
 * @return {{type: 'invalid', message: string}|undefined} Validity to report, if any.
 */
function getCustomValidity( url, otherSources, embeddedURL ) {
	const trimmed = url.trim();

	if ( ! trimmed ) {
		return undefined;
	}

	if ( trimmed === embeddedURL?.trim() ) {
		return {
			type: 'invalid',
			message: __( 'This is the URL the block already embeds.' ),
		};
	}

	if ( otherSources.includes( trimmed ) ) {
		return {
			type: 'invalid',
			message: __( 'This source is already in the list.' ),
		};
	}

	return undefined;
}

/**
 * One alternate source: a row showing its URL, which opens a flyout holding
 * everything that can be done to it.
 *
 * @param {Object}   props
 * @param {string}   props.url          The source URL.
 * @param {string[]} props.otherSources URLs listed under the other rows.
 * @param {string}   props.embeddedURL  URL the block embeds.
 * @param {boolean}  props.isFirst      Whether the row is the first in the list.
 * @param {boolean}  props.isLast       Whether the row is the last in the list.
 * @param {Function} props.onChange     Called with the edited URL.
 * @param {Function} props.onMoveUp     Moves the source one place earlier.
 * @param {Function} props.onMoveDown   Moves the source one place later.
 * @param {Function} props.onRemove     Drops the source from the list.
 */
function SourceRow( {
	url,
	otherSources,
	embeddedURL,
	isFirst,
	isLast,
	onChange,
	onMoveUp,
	onMoveDown,
	onRemove,
} ) {
	const [ isOpen, setIsOpen ] = useState( false );
	// Held in state rather than a ref so the flyout re-renders once the row it
	// is anchored to exists.
	const [ rowElement, setRowElement ] = useState( null );
	// The field edits a copy: the row keeps showing the URL the block has
	// until the edit is saved.
	const [ draft, setDraft ] = useState( url );

	const close = () => setIsOpen( false );
	const toggle = () => {
		if ( ! isOpen ) {
			setDraft( url );
		}
		setIsOpen( ! isOpen );
	};

	const editedURL = draft.trim();

	return (
		<>
			<Item
				ref={ setRowElement }
				onClick={ toggle }
				aria-expanded={ isOpen }
				className="wp-block-embed__source"
			>
				{ url }
			</Item>
			{ isOpen && rowElement && (
				// Rendered beside the row rather than inside it: the flyout is
				// portalled out of the row, but a click in it would still
				// travel up to the row's toggle through the React tree. It
				// waits for the row so it never opens without an anchor to
				// sit beside.
				<Popover
					{ ...SOURCE_POPOVER_PROPS }
					anchor={ rowElement }
					onClose={ close }
					onFocusOutside={ close }
				>
					<form
						className="wp-block-embed__source-editor"
						onSubmit={ ( event ) => {
							event.preventDefault();
							onChange( editedURL );
							close();
						} }
					>
						<Stack direction="column" gap="md">
							<ValidatedInputControl
								type="url"
								label={ __( 'Source URL' ) }
								value={ draft }
								onValueChange={ ( value ) =>
									setDraft( value ?? '' )
								}
								customValidity={ getCustomValidity(
									draft,
									otherSources,
									embeddedURL
								) }
							/>
							<Stack
								direction="row"
								gap="xs"
								justify="space-between"
								align="center"
							>
								<Stack direction="row" gap="xs">
									<Button
										size="compact"
										icon={ chevronUp }
										label={ __( 'Move up' ) }
										disabled={ isFirst }
										accessibleWhenDisabled
										onClick={ onMoveUp }
									/>
									<Button
										size="compact"
										icon={ chevronDown }
										label={ __( 'Move down' ) }
										disabled={ isLast }
										accessibleWhenDisabled
										onClick={ onMoveDown }
									/>
									<Button
										size="compact"
										icon={ trash }
										isDestructive
										label={ __( 'Remove source' ) }
										onClick={ onRemove }
									/>
								</Stack>
								<Button
									__next40pxDefaultSize
									variant="primary"
									type="submit"
									disabled={
										! editedURL || editedURL === url
									}
									accessibleWhenDisabled
								>
									{ __( 'Save' ) }
								</Button>
							</Stack>
						</Stack>
					</form>
				</Popover>
			) }
		</>
	);
}

/**
 * The field a source is added from. It holds what is typed until it is
 * submitted, so a half-written URL never reaches the block.
 *
 * @param {Object}   props
 * @param {string[]} props.sources     URLs already listed.
 * @param {string}   props.embeddedURL URL the block embeds.
 * @param {Object}   props.fieldRef    Ref to the field, so focus can be sent back to it.
 * @param {Function} props.onAdd       Called with a URL to add to the list.
 */
function AddSourceForm( { sources, embeddedURL, fieldRef, onAdd } ) {
	const [ draft, setDraft ] = useState( '' );

	const newURL = draft.trim();

	return (
		<form
			className="wp-block-embed__add-source"
			onSubmit={ ( event ) => {
				event.preventDefault();
				onAdd( newURL );
				setDraft( '' );
			} }
		>
			<Stack direction="column" gap="sm" align="flex-start">
				<ValidatedInputControl
					ref={ fieldRef }
					type="url"
					label={ __( 'Add a source' ) }
					value={ draft }
					onValueChange={ ( value ) => setDraft( value ?? '' ) }
					customValidity={ getCustomValidity(
						draft,
						sources,
						embeddedURL
					) }
				/>
				<Button
					__next40pxDefaultSize
					variant="secondary"
					type="submit"
					disabled={ ! newURL }
					accessibleWhenDisabled
				>
					{ __( 'Add' ) }
				</Button>
			</Stack>
		</form>
	);
}

/**
 * The block's alternate sources: the list, and the field a source is added
 * from. Each listed source is edited, reordered and removed from the flyout
 * its row opens.
 *
 * @param {Object}   props
 * @param {unknown}  props.fallbacks    Alternate source URLs stored on the block.
 * @param {Function} props.setFallbacks Stores a new list of alternate source URLs.
 * @param {string}   props.embeddedURL  URL the block embeds.
 */
function AlternateSourcesControl( { fallbacks, setFallbacks, embeddedURL } ) {
	const sources = toSourceList( fallbacks );
	const [ shouldFocusAddField, setShouldFocusAddField ] = useState( false );
	const addFieldRef = useRef();

	useEffect( () => {
		if ( shouldFocusAddField ) {
			setShouldFocusAddField( false );
			addFieldRef.current?.focus();
		}
	}, [ shouldFocusAddField ] );

	const moveSource = ( index, offset ) => {
		const next = [ ...sources ];
		const [ url ] = next.splice( index, 1 );

		next.splice( index + offset, 0, url );
		setFallbacks( next );
	};

	const removeSource = ( index ) => {
		setFallbacks( sources.filter( ( _, position ) => position !== index ) );
		// The button that removes a source sits in the flyout that goes away
		// with it, so focus has to be sent somewhere deliberately.
		setShouldFocusAddField( true );
	};

	return (
		<Stack direction="column" gap="md" className="wp-block-embed__sources">
			<Text
				variant="body-sm"
				className="wp-block-embed__sources-description"
			>
				{ __(
					'Mirrors of this content, tried in order when the embed above will not play. They are saved with the block for a theme or plugin to use.'
				) }
			</Text>
			{ sources.length > 0 && (
				<ItemGroup
					isBordered
					isSeparated
					aria-label={ __( 'Alternate sources' ) }
				>
					{ sources.map( ( url, index ) => (
						// Keyed by the URL, which the list holds only once, so
						// a reordered row takes its open flyout, and the focus
						// inside it, along to its new place.
						<SourceRow
							key={ url }
							url={ url }
							otherSources={ sources.filter(
								( _, position ) => position !== index
							) }
							embeddedURL={ embeddedURL }
							isFirst={ index === 0 }
							isLast={ index === sources.length - 1 }
							onChange={ ( value ) =>
								setFallbacks(
									sources.map( ( source, position ) =>
										position === index ? value : source
									)
								)
							}
							onMoveUp={ () => moveSource( index, -1 ) }
							onMoveDown={ () => moveSource( index, 1 ) }
							onRemove={ () => removeSource( index ) }
						/>
					) ) }
				</ItemGroup>
			) }
			{ sources.length > 1 && (
				<Stack direction="row" justify="flex-start">
					<Button
						size="compact"
						variant="tertiary"
						isDestructive
						onClick={ () => {
							setFallbacks( [] );
							setShouldFocusAddField( true );
						} }
					>
						{ __( 'Remove all' ) }
					</Button>
				</Stack>
			) }
			<AddSourceForm
				sources={ sources }
				embeddedURL={ embeddedURL }
				fieldRef={ addFieldRef }
				onAdd={ ( url ) => setFallbacks( [ ...sources, url ] ) }
			/>
		</Stack>
	);
}

function getResponsiveHelp( checked ) {
	return checked
		? __(
				'This embed will preserve its aspect ratio when the browser is resized.'
			)
		: __(
				'This embed may not preserve its aspect ratio when the browser is resized.'
			);
}

const EmbedControls = ( {
	blockSupportsResponsive,
	showEditButton,
	themeSupportsResponsive,
	allowResponsive,
	toggleResponsive,
	switchBackToURLInput,
	url,
	fallbacks,
	setFallbacks,
} ) => {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	// `PanelBody` reads `initialOpen` on every render until it is toggled by
	// hand, so the answer is taken once: a panel that opened for a block with
	// sources must not shut itself the moment the last one is removed.
	const [ hasSourcesOnMount ] = useState(
		() => toSourceList( fallbacks ).length > 0
	);

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					{ showEditButton && (
						<ToolbarButton
							className="components-toolbar__control"
							label={ __( 'Edit URL' ) }
							icon={ pencil }
							onClick={ switchBackToURLInput }
						/>
					) }
				</ToolbarGroup>
			</BlockControls>
			{ themeSupportsResponsive && blockSupportsResponsive && (
				<InspectorControls>
					<ToolsPanel
						label={ __( 'Media settings' ) }
						resetAll={ () => {
							toggleResponsive( true );
						} }
						dropdownMenuProps={ dropdownMenuProps }
					>
						<ToolsPanelItem
							label={ __( 'Media settings' ) }
							isShownByDefault
							hasValue={ () => ! allowResponsive }
							onDeselect={ () => {
								toggleResponsive( ! allowResponsive );
							} }
						>
							<ToggleControl
								label={ __( 'Resize for smaller devices' ) }
								checked={ allowResponsive }
								help={ getResponsiveHelp }
								onChange={ toggleResponsive }
							/>
						</ToolsPanelItem>
					</ToolsPanel>
				</InspectorControls>
			) }
			<InspectorControls>
				{ /*
				 * A plain panel rather than a ToolsPanel: the sources are
				 * content, not an optional setting, and a ToolsPanel would
				 * offer its own reset for the list beside the one below it.
				 */ }
				<PanelBody
					title={ __( 'Alternate sources' ) }
					initialOpen={ hasSourcesOnMount }
				>
					<AlternateSourcesControl
						fallbacks={ fallbacks }
						setFallbacks={ setFallbacks }
						embeddedURL={ url }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
};

export default EmbedControls;
