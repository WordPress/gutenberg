import clsx from 'clsx';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import {
	useBlockProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	RichText,
	getTypographyClassesAndStyles as useTypographyProps,
	useSettings,
	store as blockEditorStore,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	Button,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { Field } from '@wordpress/ui';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import HtmlRenderer from '../utils/html-renderer';
import CustomInserterModal from '../icon/components/custom-inserter';

// Matches the icon name pattern accepted by /wp/v2/icons/<name> REST route.
const ICON_NAME_REGEX =
	/^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\/[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/;

function IconPickerTile( { stateLabel, value, resolvedContent, onChange } ) {
	const [ isInserterOpen, setInserterOpen ] = useState( false );
	const actionLabel = value ? __( 'Replace' ) : __( 'Choose icon' );

	return (
		<>
			<Button
				className={ clsx( 'wp-block-accordion-heading__icon-picker', {
					'is-set': !! value,
				} ) }
				__next40pxDefaultSize
				aria-label={ sprintf(
					/* translators: 1: Icon state, e.g. "Closed". 2: Action, e.g. "Replace". */
					__( '%1$s icon: %2$s' ),
					stateLabel,
					actionLabel
				) }
				onClick={ () => setInserterOpen( true ) }
			>
				<span
					className="wp-block-accordion-heading__icon-picker-preview"
					aria-hidden="true"
				>
					{ resolvedContent ? (
						<HtmlRenderer html={ resolvedContent } />
					) : (
						'+'
					) }
				</span>
				<span className="wp-block-accordion-heading__icon-picker-state">
					{ stateLabel }
				</span>
			</Button>
			{ isInserterOpen && (
				<CustomInserterModal
					onClose={ () => setInserterOpen( false ) }
					value={ value }
					onChange={ ( name ) => {
						onChange( name );
						setInserterOpen( false );
					} }
				/>
			) }
		</>
	);
}

export default function Edit( { attributes, setAttributes, context } ) {
	const { title, icon, iconStates } = attributes;
	const {
		'core/accordion-icon-position': iconPosition,
		'core/accordion-show-icon': showIcon,
		'core/accordion-heading-level': headingLevel,
	} = context;
	const TagName = 'h' + headingLevel;
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	// Set icon attributes.
	useEffect( () => {
		if ( iconPosition !== undefined && showIcon !== undefined ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				iconPosition,
				showIcon,
			} );
		}
	}, [
		iconPosition,
		showIcon,
		setAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	const [ fluidTypographySettings, layout ] = useSettings(
		'typography.fluid',
		'layout'
	);
	const typographyProps = useTypographyProps( attributes, {
		typography: {
			fluid: fluidTypographySettings,
		},
		layout: {
			wideSize: layout?.wideSize,
		},
	} );

	const blockProps = useBlockProps( {
		className: clsx( {
			'has-icon': showIcon,
			'has-icon-left': showIcon && iconPosition === 'left',
			'has-icon-right': showIcon && iconPosition === 'right',
		} ),
	} );
	const spacingProps = useSpacingProps( attributes );

	// Icon references are namespaced names resolved through the icon
	// library; anything else falls back to the legacy `+` glyph.
	const isStateful = typeof icon === 'string' && icon !== '';
	const expandedIconName =
		typeof iconStates?.expanded === 'string' && iconStates.expanded !== ''
			? iconStates.expanded
			: undefined;

	// Resolve stored references so the editor previews the same SVGs the
	// front end renders from the registry.
	const { restContent, expandedContent } = useSelect(
		( select ) => {
			const getIconContent = ( name ) => {
				if ( ! name || ! ICON_NAME_REGEX.test( name ) ) {
					return null;
				}
				return (
					select( coreDataStore ).getEntityRecord(
						'root',
						'icon',
						name
					)?.content ?? null
				);
			};
			return {
				restContent: getIconContent( isStateful ? icon : undefined ),
				expandedContent: getIconContent( expandedIconName ),
			};
		},
		[ expandedIconName, icon, isStateful ]
	);

	const setStatefulIcons = ( nextStates ) => {
		setAttributes( {
			iconStates: Object.keys( nextStates ).length
				? nextStates
				: undefined,
		} );
	};

	const setExpandedIcon = ( name ) =>
		setStatefulIcons( { ...( iconStates ?? {} ), expanded: name } );

	const resetStatefulIcons = () => {
		setAttributes( { icon: undefined, iconStates: undefined } );
	};

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const editorControls = showIcon && (
		<InspectorControls group="settings">
			<ToolsPanel
				label={ __( 'Settings' ) }
				resetAll={ resetStatefulIcons }
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					label={ __( 'Icon' ) }
					isShownByDefault
					hasValue={ () => isStateful || !! expandedIconName }
					onDeselect={ resetStatefulIcons }
				>
					<div className="wp-block-accordion-heading__icon-picker-control">
						<Field.VisualLabel>{ __( 'Icon' ) }</Field.VisualLabel>
						<div className="wp-block-accordion-heading__icon-picker-grid">
							<IconPickerTile
								stateLabel={ __( 'Closed' ) }
								value={ isStateful ? icon : undefined }
								resolvedContent={ restContent }
								onChange={ ( name ) =>
									setAttributes( { icon: name } )
								}
							/>
							{ isStateful && (
								<IconPickerTile
									stateLabel={ __( 'Open' ) }
									value={ expandedIconName }
									resolvedContent={ expandedContent }
									onChange={ setExpandedIcon }
								/>
							) }
						</div>
					</div>
				</ToolsPanelItem>
			</ToolsPanel>
		</InspectorControls>
	);

	/*
	 * The editor previews the resting state so that picking icons is not
	 * disrupted by the item's open state in the canvas; the front end swaps
	 * between the stored references.
	 */
	const renderToggleIcon = () => {
		if ( ! isStateful ) {
			return (
				<span
					className="wp-block-accordion-heading__toggle-icon"
					aria-hidden="true"
				>
					+
				</span>
			);
		}
		return (
			<span
				className="wp-block-accordion-heading__toggle-icon is-stateful"
				aria-hidden="true"
			>
				{ restContent ? <HtmlRenderer html={ restContent } /> : '+' }
			</span>
		);
	};

	return (
		<>
			{ editorControls }
			<TagName { ...blockProps }>
				<button
					className="wp-block-accordion-heading__toggle"
					style={ spacingProps.style }
					tabIndex="-1"
				>
					{ showIcon &&
						iconPosition === 'left' &&
						renderToggleIcon() }
					<RichText
						identifier="title"
						withoutInteractiveFormatting
						disableLineBreaks
						tagName="span"
						value={ title }
						onChange={ ( newTitle ) =>
							setAttributes( { title: newTitle } )
						}
						placeholder={ __( 'Accordion title' ) }
						className="wp-block-accordion-heading__toggle-title"
						style={ {
							letterSpacing: typographyProps.style.letterSpacing,
							textDecoration:
								typographyProps.style.textDecoration,
						} }
					/>
					{ showIcon &&
						iconPosition === 'right' &&
						renderToggleIcon() }
				</button>
			</TagName>
		</>
	);
}
