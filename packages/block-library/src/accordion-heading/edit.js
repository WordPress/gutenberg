/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import {
	useBlockProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	RichText,
	getTypographyClassesAndStyles as useTypographyProps,
	useSettings,
	store as blockEditorStore,
	BlockStyleSettingsMenuControls,
} from '@wordpress/block-editor';
import { MenuItem } from '@wordpress/components';
import { useDispatch, useRegistry } from '@wordpress/data';

const SYNCED_STYLES_SOURCE = 'core/synced-styles';
const SYNCED_STYLES_CONTEXT_KEY = 'core/synced-styles/accordion-heading';
// NOTE: Keep in sync with $gutenberg_synced_styles_bindable_attributes in
// lib/compat/wordpress-7.1/synced-styles-block-bindings.php.
const STYLE_ATTRIBUTES = [
	'style',
	'textColor',
	'backgroundColor',
	'gradient',
	'fontSize',
	'fontFamily',
	'borderColor',
];

export default function Edit( {
	clientId,
	attributes,
	setAttributes,
	context,
} ) {
	const { title } = attributes;
	const {
		'core/accordion-icon-position': iconPosition,
		'core/accordion-show-icon': showIcon,
		'core/accordion-heading-level': headingLevel,
	} = context;
	const TagName = 'h' + headingLevel;
	const registry = useRegistry();
	const { __unstableMarkNextChangeAsNotPersistent, updateBlockAttributes } =
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

	const blockProps = useBlockProps();
	const spacingProps = useSpacingProps( attributes );

	const isSyncedStyles =
		attributes.metadata?.bindings?.__default?.source ===
		SYNCED_STYLES_SOURCE;
	const isUnlinkedSyncedStyles =
		attributes.metadata?.unlinkedSyncedStyles === true;

	const handleUnlink = () => {
		// Snapshot the current computed style values (resolved from context via
		// the binding) into the block's own attributes before removing the
		// binding, so the block retains its appearance after unlinking.
		const styleSnapshot = Object.fromEntries(
			STYLE_ATTRIBUTES.filter(
				( attr ) => attributes[ attr ] !== undefined
			).map( ( attr ) => [ attr, attributes[ attr ] ] )
		);
		// Remove bindings from metadata directly, preserving other metadata.
		const { bindings: _bindings, ...metadataWithoutBindings } =
			attributes.metadata ?? {};
		registry.batch( () => {
			updateBlockAttributes( clientId, {
				...styleSnapshot,
				metadata: {
					...metadataWithoutBindings,
					unlinkedSyncedStyles: true,
				},
			} );
		} );
	};

	const handleRelink = () => {
		// Remove locally stored style attributes and re-add the __default binding.
		const styleReset = Object.fromEntries(
			STYLE_ATTRIBUTES.map( ( attr ) => [ attr, undefined ] )
		);
		const { unlinkedSyncedStyles: _flag, ...metadataWithoutFlag } =
			attributes.metadata ?? {};
		registry.batch( () => {
			updateBlockAttributes( clientId, {
				...styleReset,
				metadata: {
					...metadataWithoutFlag,
					bindings: {
						__default: {
							source: SYNCED_STYLES_SOURCE,
							args: { context: SYNCED_STYLES_CONTEXT_KEY },
						},
					},
				},
			} );
		} );
	};

	return (
		<>
			{ ( isSyncedStyles || isUnlinkedSyncedStyles ) && (
				<BlockStyleSettingsMenuControls>
					{ ( { onClose, selectedClientIds } ) =>
						selectedClientIds?.length === 1 &&
						clientId === selectedClientIds[ 0 ] && (
							<MenuItem
								onClick={ () => {
									if ( isSyncedStyles ) {
										handleUnlink();
									} else {
										handleRelink();
									}
									onClose?.();
								} }
							>
								{ isSyncedStyles
									? __( 'Unlink styles' )
									: __( 'Link styles' ) }
							</MenuItem>
						)
					}
				</BlockStyleSettingsMenuControls>
			) }
			<TagName { ...blockProps }>
				<button
					className="wp-block-accordion-heading__toggle"
					style={ spacingProps.style }
					tabIndex="-1"
				>
					{ showIcon && iconPosition === 'left' && (
						<span
							className="wp-block-accordion-heading__toggle-icon"
							aria-hidden="true"
						>
							+
						</span>
					) }
					<RichText
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
					{ showIcon && iconPosition === 'right' && (
						<span
							className="wp-block-accordion-heading__toggle-icon"
							aria-hidden="true"
						>
							+
						</span>
					) }
				</button>
			</TagName>
		</>
	);
}
