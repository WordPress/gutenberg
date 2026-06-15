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
	TextControl,
	ToolbarButton,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	flipHorizontal as flipHorizontalIcon,
	flipVertical as flipVerticalIcon,
	rotateRight,
} from '@wordpress/icons';
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	useBlockEditingMode,
	__experimentalUseColorProps as useColorProps,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	getDimensionsClassesAndStyles as useDimensionsProps,
} from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { SVG, Rect, Path } from '@wordpress/primitives';
import { useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import HtmlRenderer from '../utils/html-renderer';
import { CustomInserterModal } from './components';

const IconPlaceholder = ( { className, style } ) => (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 60 60"
		preserveAspectRatio="none"
		fill="none"
		aria-hidden="true"
		className={ clsx( 'wp-block-icon__placeholder', className ) }
		style={ style }
	>
		<Rect width="60" height="60" fill="currentColor" fillOpacity={ 0.1 } />
		<Path
			vectorEffect="non-scaling-stroke"
			stroke="currentColor"
			strokeOpacity={ 0.25 }
			d="M60 60 0 0"
		/>
	</SVG>
);

export function Edit( { attributes, setAttributes } ) {
	const { icon, ariaLabel, flipHorizontal, flipVertical, rotation } =
		attributes;

	const [ isInserterOpen, setInserterOpen ] = useState( false );

	const isContentOnlyMode = useBlockEditingMode() === 'contentOnly';

	const colorProps = useColorProps( attributes );
	const spacingProps = useSpacingProps( attributes );
	const borderProps = useBorderProps( attributes );
	const dimensionsProps = useDimensionsProps( attributes );

	const { selectedIcon, allIcons = [] } = useSelect(
		( select ) => {
			const { getEntityRecord, getEntityRecords } =
				select( coreDataStore );
			return {
				selectedIcon: icon
					? getEntityRecord( 'root', 'icon', icon )
					: null,
				allIcons: isInserterOpen
					? getEntityRecords( 'root', 'icon' )
					: undefined,
			};
		},
		[ isInserterOpen, icon ]
	);

	const iconToDisplay = selectedIcon?.content || '';

	const flipClasses = {
		'is-flip-horizontal': flipHorizontal,
		'is-flip-vertical': flipVertical,
	};

	const rotationStyle = rotation ? { rotate: `${ rotation }deg` } : {};

	const blockControls = (
		<>
			{ icon && (
				<BlockControls group="block">
					<ToolbarButton
						icon={ flipHorizontalIcon }
						label={ __( 'Flip horizontal' ) }
						isPressed={ flipHorizontal }
						onClick={ () =>
							setAttributes( {
								flipHorizontal: ! flipHorizontal,
							} )
						}
					/>
					<ToolbarButton
						icon={ flipVerticalIcon }
						label={ __( 'Flip vertical' ) }
						isPressed={ flipVertical }
						onClick={ () =>
							setAttributes( {
								flipVertical: ! flipVertical,
							} )
						}
					/>
					<ToolbarButton
						icon={ rotateRight }
						label={ __( 'Rotate' ) }
						onClick={ () =>
							setAttributes( {
								rotation: ( ( rotation || 0 ) + 90 ) % 360,
							} )
						}
					/>
				</BlockControls>
			) }
			<BlockControls group="other">
				<ToolbarButton
					onClick={ () => {
						setInserterOpen( true );
					} }
				>
					{ icon ? __( 'Replace' ) : __( 'Choose icon' ) }
				</ToolbarButton>
				{ isContentOnlyMode && icon && (
					// Add some extra controls for content attributes when content only mode is active.
					// With content only mode active, the inspector is hidden, so users need another way
					// to edit these attributes.
					<DropdownMenu
						icon=""
						toggleProps={ {
							as: ToolbarButton,
						} }
						popoverProps={ {
							className: 'is-alternate',
						} }
						text={ __( 'Label' ) }
					>
						{ () => (
							<TextControl
								className="wp-block-icon__toolbar-content"
								label={ __( 'Label' ) }
								value={ ariaLabel || '' }
								onChange={ ( value ) =>
									setAttributes( {
										ariaLabel: value,
									} )
								}
								help={ __(
									'Briefly describe the icon to help screen reader users. Leave blank for decorative icons.'
								) }
								__next40pxDefaultSize
							/>
						) }
					</DropdownMenu>
				) }
			</BlockControls>
		</>
	);
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const inspectorControls = icon && (
		<>
			<InspectorControls group="settings">
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () =>
						setAttributes( {
							ariaLabel: undefined,
						} )
					}
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Label' ) }
						isShownByDefault
						hasValue={ () => !! ariaLabel }
						onDeselect={ () =>
							setAttributes( { ariaLabel: undefined } )
						}
					>
						<TextControl
							label={ __( 'Label' ) }
							help={ __(
								'Briefly describe the icon to help screen reader users. Leave blank for decorative icons.'
							) }
							value={ ariaLabel || '' }
							onChange={ ( value ) =>
								setAttributes( { ariaLabel: value } )
							}
							__next40pxDefaultSize
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
		</>
	);

	return (
		<>
			{ blockControls }
			{ inspectorControls }
			<div { ...useBlockProps() }>
				{ icon ? (
					<HtmlRenderer
						html={ iconToDisplay }
						wrapperProps={ {
							className: clsx(
								colorProps.className,
								borderProps.className,
								spacingProps.className,
								dimensionsProps.className,
								flipClasses
							),
							style: {
								...colorProps.style,
								...borderProps.style,
								...spacingProps.style,
								...dimensionsProps.style,
								...rotationStyle,
							},
						} }
					/>
				) : (
					<IconPlaceholder
						className={ clsx(
							borderProps.className,
							spacingProps.className,
							dimensionsProps.className,
							flipClasses
						) }
						style={ {
							...borderProps.style,
							...spacingProps.style,
							...dimensionsProps.style,
							...rotationStyle,
							height: 'auto',
						} }
					/>
				) }
			</div>
			{ isInserterOpen && (
				<CustomInserterModal
					icons={ allIcons }
					setInserterOpen={ setInserterOpen }
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			) }
		</>
	);
}

export default Edit;
