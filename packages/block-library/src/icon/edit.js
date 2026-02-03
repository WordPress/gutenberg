/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	ExternalLink,
	TextControl,
	ToolbarButton,
	ToolbarGroup,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	useBlockEditingMode,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import {
	createInterpolateElement,
	useState,
	useEffect,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { IconPlaceholder, InserterModal } from './components';
import { parseIcon, useToolsPanelDropdownMenuProps } from './utils';
import getIcons from './icons';

/**
 * The edit function for the Icon Block.
 *
 * @param {Object} props All props passed to this function.
 */
export function Edit( props ) {
	const { attributes, setAttributes } = props;
	const { icon, label, title, style } = attributes;

	const [ isInserterOpen, setInserterOpen ] = useState( false );
	const [ iconToDisplay, setIconToDisplay ] = useState();
	const [ allIcons, setAllIcons ] = useState();

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const isContentOnlyMode = useBlockEditingMode() === 'contentOnly';

	// Load the icons once.
	useEffect( () => {
		const requestIcons = async () => {
			const iconList = await getIcons();
			setAllIcons( iconList );
		};
		requestIcons();
	}, [] );

	// Update the active icons when it's changed.
	useEffect( () => {
		if ( icon && allIcons ) {
			const selectedIcon = allIcons.find( ( { name } ) => name === icon );
			setIconToDisplay( parseIcon( selectedIcon?.content ) );
		}
	}, [ allIcons, icon ] );

	// Is the width value is 0, reset it to the default value.
	useEffect( () => {
		if (
			! style?.dimensions?.width ||
			parseFloat( style?.dimensions?.width ) === 0
		) {
			// To avoid interfering with undo/redo operations any changes in this
			// effect must not make history and should be preceded by
			// `__unstableMarkNextChangeAsNotPersistent()`.
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { style: { dimensions: { width: '48px' } } } );
		}
	}, [ style, setAttributes, __unstableMarkNextChangeAsNotPersistent ] );

	function resetAll() {
		setAttributes( {
			label: undefined,
		} );
	}

	const blockControls = (
		<>
			{ icon && (
				<BlockControls group="block">
					<ToolbarGroup
						className={ clsx( 'components-toolbar-group', {
							'wp-block-outermost-icon-block__toolbar':
								! isContentOnlyMode,
						} ) }
					></ToolbarGroup>
				</BlockControls>
			) }
			<BlockControls group={ isContentOnlyMode ? 'inline' : 'other' }>
				<ToolbarButton
					onClick={ () => {
						setInserterOpen( true );
					} }
				>
					{ icon ? __( 'Replace' ) : __( 'Add icon' ) }
				</ToolbarButton>
			</BlockControls>
			{ isContentOnlyMode && icon && (
				// Add some extra controls for content attributes when content only mode is active.
				// With content only mode active, the inspector is hidden, so users need another way
				// to edit these attributes.
				<BlockControls group="other">
					<ToolbarGroup className="components-toolbar-group">
						<DropdownMenu
							icon=""
							popoverProps={ {
								className:
									'outermost-icon-block__replace-popover is-alternate',
							} }
							text={ __( 'Label' ) }
						>
							{ () => (
								<TextControl
									className="wp-block-outermost-icon-block__toolbar_content"
									label={ __( 'Label' ) }
									value={ label || '' }
									onChange={ ( value ) =>
										setAttributes( { label: value } )
									}
									help={ __(
										'Briefly describe the icon to help screen reader users.'
									) }
									__next40pxDefaultSize
								/>
							) }
						</DropdownMenu>
					</ToolbarGroup>
				</BlockControls>
			) }
		</>
	);
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const inspectorControls = icon && (
		<>
			<InspectorControls group="settings">
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ resetAll }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Label' ) }
						isShownByDefault
						hasValue={ () => !! label }
						onDeselect={ () =>
							setAttributes( { label: undefined } )
						}
					>
						<TextControl
							label={ __( 'Label' ) }
							help={ __(
								'Briefly describe the icon to help screen reader users.'
							) }
							value={ label || '' }
							onChange={ ( value ) =>
								setAttributes( { label: value } )
							}
							__next40pxDefaultSize
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>

			<InspectorControls group="advanced">
				<TextControl
					label={ __( 'Title attribute' ) }
					className="outermost-icon-block__title-control"
					value={ title || '' }
					onChange={ ( value ) => setAttributes( { title: value } ) }
					help={ createInterpolateElement(
						__(
							'Describe the role of this icon on the page. <a>Note: many devices and browsers do not display this text.</a>'
						),
						{
							a: (
								<ExternalLink href="https://www.w3.org/TR/html52/dom.html#the-title-attribute" />
							),
						}
					) }
					__next40pxDefaultSize
				/>
			</InspectorControls>
		</>
	);

	return (
		<>
			{ blockControls }
			{ inspectorControls }
			<div { ...useBlockProps() }>
				{ icon ? (
					iconToDisplay
				) : (
					<IconPlaceholder
						setInserterOpen={ setInserterOpen }
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
				) }
			</div>
			<InserterModal
				isInserterOpen={ isInserterOpen }
				setInserterOpen={ setInserterOpen }
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		</>
	);
}

export default Edit;
