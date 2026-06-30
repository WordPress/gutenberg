/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import {
	InspectorAdvancedControls,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import {
	BaseControl,
	Button,
	CheckboxControl,
	Modal,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import {
	__EXPERIMENTAL_STYLE_PROPERTY,
	getBlockType,
	hasBlockSupport,
	store as blocksStore,
} from '@wordpress/blocks';
import { useMemo, useCallback, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import setNestedValue from '../../utils/set-nested-value';
import { useGlobalStyles } from '../../components/global-styles/hooks';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

// Block Gap is a special case and isn't defined within the blocks
// style properties config. We'll add it here to allow it to be pushed
// to global styles as well.
const STYLE_PROPERTY = {
	...__EXPERIMENTAL_STYLE_PROPERTY,
	blockGap: { value: [ 'spacing', 'blockGap' ] },
};

// TODO: Temporary duplication of constant in @wordpress/block-editor. Can be
// removed by moving PushChangesToGlobalStylesControl to
// @wordpress/block-editor.
const STYLE_PATH_TO_CSS_VAR_INFIX = {
	'border.color': 'color',
	'color.background': 'color',
	'color.text': 'color',
	'elements.link.color.text': 'color',
	'elements.link.:hover.color.text': 'color',
	'elements.link.typography.fontFamily': 'font-family',
	'elements.link.typography.fontSize': 'font-size',
	'elements.button.color.text': 'color',
	'elements.button.color.background': 'color',
	'elements.button.typography.fontFamily': 'font-family',
	'elements.button.typography.fontSize': 'font-size',
	'elements.caption.color.text': 'color',
	'elements.heading.color': 'color',
	'elements.heading.color.background': 'color',
	'elements.heading.typography.fontFamily': 'font-family',
	'elements.heading.gradient': 'gradient',
	'elements.heading.color.gradient': 'gradient',
	'elements.h1.color': 'color',
	'elements.h1.color.background': 'color',
	'elements.h1.typography.fontFamily': 'font-family',
	'elements.h1.color.gradient': 'gradient',
	'elements.h2.color': 'color',
	'elements.h2.color.background': 'color',
	'elements.h2.typography.fontFamily': 'font-family',
	'elements.h2.color.gradient': 'gradient',
	'elements.h3.color': 'color',
	'elements.h3.color.background': 'color',
	'elements.h3.typography.fontFamily': 'font-family',
	'elements.h3.color.gradient': 'gradient',
	'elements.h4.color': 'color',
	'elements.h4.color.background': 'color',
	'elements.h4.typography.fontFamily': 'font-family',
	'elements.h4.color.gradient': 'gradient',
	'elements.h5.color': 'color',
	'elements.h5.color.background': 'color',
	'elements.h5.typography.fontFamily': 'font-family',
	'elements.h5.color.gradient': 'gradient',
	'elements.h6.color': 'color',
	'elements.h6.color.background': 'color',
	'elements.h6.typography.fontFamily': 'font-family',
	'elements.h6.color.gradient': 'gradient',
	'color.gradient': 'gradient',
	blockGap: 'spacing',
	'typography.fontSize': 'font-size',
	'typography.fontFamily': 'font-family',
};

// TODO: Temporary duplication of constant in @wordpress/block-editor. Can be
// removed by moving PushChangesToGlobalStylesControl to
// @wordpress/block-editor.
const STYLE_PATH_TO_PRESET_BLOCK_ATTRIBUTE = {
	'border.color': 'borderColor',
	'color.background': 'backgroundColor',
	'color.text': 'textColor',
	'color.gradient': 'gradient',
	'typography.fontSize': 'fontSize',
	'typography.fontFamily': 'fontFamily',
};

const SUPPORTED_STYLES = [ 'border', 'color', 'spacing', 'typography' ];

const getValueFromObjectPath = ( object, path ) => {
	let value = object;
	path.forEach( ( fieldName ) => {
		value = value?.[ fieldName ];
	} );
	return value;
};

const flatBorderProperties = [ 'borderColor', 'borderWidth', 'borderStyle' ];
const sides = [ 'top', 'right', 'bottom', 'left' ];

function getBorderStyleChanges( border, presetColor, userStyle ) {
	if ( ! border && ! presetColor ) {
		return [];
	}

	const changes = [
		...getFallbackBorderStyleChange( 'top', border, userStyle ),
		...getFallbackBorderStyleChange( 'right', border, userStyle ),
		...getFallbackBorderStyleChange( 'bottom', border, userStyle ),
		...getFallbackBorderStyleChange( 'left', border, userStyle ),
	];

	// Handle a flat border i.e. all sides the same, CSS shorthand.
	const { color: customColor, style, width } = border || {};
	const hasColorOrWidth = presetColor || customColor || width;

	if ( hasColorOrWidth && ! style ) {
		// Global Styles need individual side configurations to overcome
		// theme.json configurations which are per side as well.
		sides.forEach( ( side ) => {
			// Only add fallback border-style if global styles don't already
			// have something set.
			if ( ! userStyle?.[ side ]?.style ) {
				changes.push( {
					path: [ 'border', side, 'style' ],
					value: 'solid',
					// Auto-injected fallback, not a user choice; flagged so the
					// review modal can hide it and push it only alongside a kept
					// border change. See `isRideAlongBorderStyle`.
					isRideAlong: true,
				} );
			}
		} );
	}

	return changes;
}

function getFallbackBorderStyleChange( side, border, globalBorderStyle ) {
	if ( ! border?.[ side ] || globalBorderStyle?.[ side ]?.style ) {
		return [];
	}

	const { color, style, width } = border[ side ];
	const hasColorOrWidth = color || width;

	if ( ! hasColorOrWidth || style ) {
		return [];
	}

	return [
		{
			path: [ 'border', side, 'style' ],
			value: 'solid',
			isRideAlong: true,
		},
	];
}

function useChangesToPush( name, attributes, userConfig ) {
	const supports = useSelect(
		( select ) => {
			return unlock( select( blocksStore ) ).getSupportedStyles( name );
		},
		[ name ]
	);
	const blockUserConfig = userConfig?.styles?.blocks?.[ name ];

	return useMemo( () => {
		const changes = supports.flatMap( ( key ) => {
			if ( ! STYLE_PROPERTY[ key ] ) {
				return [];
			}
			const { value: path } = STYLE_PROPERTY[ key ];
			const presetAttributeKey = path.join( '.' );
			const presetAttributeValue =
				attributes[
					STYLE_PATH_TO_PRESET_BLOCK_ATTRIBUTE[ presetAttributeKey ]
				];
			const value = presetAttributeValue
				? `var:preset|${ STYLE_PATH_TO_CSS_VAR_INFIX[ presetAttributeKey ] }|${ presetAttributeValue }`
				: getValueFromObjectPath( attributes.style, path );

			// Links only have a single support entry but have two element
			// style properties, color and hover color. The following check
			// will add the hover color to the changes if required.
			if ( key === 'linkColor' ) {
				const linkChanges = value ? [ { path, value } ] : [];
				const hoverPath = [
					'elements',
					'link',
					':hover',
					'color',
					'text',
				];
				const hoverValue = getValueFromObjectPath(
					attributes.style,
					hoverPath
				);

				if ( hoverValue ) {
					linkChanges.push( { path: hoverPath, value: hoverValue } );
				}

				return linkChanges;
			}

			// The shorthand border styles can't be mapped directly as global
			// styles requires longhand config.
			if ( flatBorderProperties.includes( key ) && value ) {
				// The shorthand config path is included to clear the block attribute.
				const borderChanges = [ { path, value } ];
				sides.forEach( ( side ) => {
					const currentPath = [ ...path ];
					currentPath.splice( -1, 0, side );
					borderChanges.push( { path: currentPath, value } );
				} );
				return borderChanges;
			}

			return value ? [ { path, value } ] : [];
		} );

		// To ensure display of a visible border, global styles require a
		// default border style if a border color or width is present.
		getBorderStyleChanges(
			attributes.style?.border,
			attributes.borderColor,
			blockUserConfig?.border
		).forEach( ( change ) => changes.push( change ) );

		return changes;
	}, [ supports, attributes, blockUserConfig ] );
}

// Human-readable labels for the style paths surfaced in the review modal,
// keyed by the change's group key (see `getChangeGroupKey`).
const STYLE_CHANGE_LABELS = {
	'typography.fontSize': __( 'Font size' ),
	'typography.fontFamily': __( 'Font family' ),
	'typography.fontStyle': __( 'Font style' ),
	'typography.fontWeight': __( 'Font weight' ),
	'typography.lineHeight': __( 'Line height' ),
	'typography.letterSpacing': __( 'Letter spacing' ),
	'typography.textDecoration': __( 'Text decoration' ),
	'typography.textTransform': __( 'Text transform' ),
	'color.text': __( 'Text color' ),
	'color.background': __( 'Background color' ),
	'color.gradient': __( 'Gradient' ),
	'elements.link.color.text': __( 'Link color' ),
	'elements.link.:hover.color.text': __( 'Link hover color' ),
	'border.color': __( 'Border color' ),
	'border.width': __( 'Border width' ),
	'border.style': __( 'Border style' ),
	'border.radius': __( 'Border radius' ),
	'spacing.blockGap': __( 'Block spacing' ),
	blockGap: __( 'Block spacing' ),
};

const SIDE_LABELS = {
	top: __( 'Top' ),
	right: __( 'Right' ),
	bottom: __( 'Bottom' ),
	left: __( 'Left' ),
};

// The auto-injected border-style fallbacks added by `getBorderStyleChanges`
// are plumbing, not user choices, and are tagged `isRideAlong` at their source.
// They are hidden from the checklist and pushed only alongside a kept border
// change. Inferring this from the path shape/value would also catch a user's
// explicit per-side `border-style: solid`, so we rely on the explicit flag.
function isRideAlongBorderStyle( change ) {
	return change.isRideAlong === true;
}

// Collapse border shorthand (a base path plus its four per-side paths) into a
// single row per property; everything else groups by its full path.
function getChangeGroupKey( path ) {
	if ( path[ 0 ] === 'border' ) {
		return `border.${ path[ path.length - 1 ] }`;
	}
	return path.join( '.' );
}

function humanizeSegment( segment ) {
	const words = String( segment )
		// Split camelCase, e.g. `fontSize` -> `font Size`.
		.replace( /([a-z])([A-Z])/g, '$1 $2' )
		.replace( /[-_]/g, ' ' )
		.toLowerCase()
		.trim();
	return words.charAt( 0 ).toUpperCase() + words.slice( 1 );
}

function getChangeLabel( groupKey, path ) {
	if ( STYLE_CHANGE_LABELS[ groupKey ] ) {
		return STYLE_CHANGE_LABELS[ groupKey ];
	}
	// Per-side spacing, e.g. `spacing.padding.top` -> "Top padding".
	if (
		path[ 0 ] === 'spacing' &&
		( path[ 1 ] === 'padding' || path[ 1 ] === 'margin' ) &&
		path[ 2 ]
	) {
		const side = SIDE_LABELS[ path[ 2 ] ] ?? humanizeSegment( path[ 2 ] );
		return path[ 1 ] === 'padding'
			? sprintf(
					/* translators: %s: a box side, e.g. "Top". */
					__( '%s padding' ),
					side
			  )
			: sprintf(
					/* translators: %s: a box side, e.g. "Top". */
					__( '%s margin' ),
					side
			  );
	}
	// Element-scoped paths, e.g. `elements.heading.color.text` -> "Heading text
	// color", so two same-named controls (block vs element) stay distinct.
	if ( path[ 0 ] === 'elements' && path[ 1 ] ) {
		const restKey = path.slice( 2 ).join( '.' );
		const restLabel =
			STYLE_CHANGE_LABELS[ restKey ] ??
			humanizeSegment( path[ path.length - 1 ] );
		return sprintf(
			/* translators: 1: element name, e.g. "Heading"; 2: style label, e.g. "text color". */
			__( '%1$s %2$s' ),
			humanizeSegment( path[ 1 ] ),
			restLabel.toLowerCase()
		);
	}
	return humanizeSegment( path[ path.length - 1 ] );
}

function getChangeValueLabel( value ) {
	if ( typeof value === 'number' ) {
		return String( value );
	}
	if ( typeof value === 'string' ) {
		// Presets arrive as `var:preset|font-size|large`; show the slug.
		const presetMatch = value.match( /^var:preset\|[^|]+\|(.+)$/ );
		if ( presetMatch ) {
			return humanizeSegment( presetMatch[ 1 ] );
		}
		return value;
	}
	return __( 'Custom' );
}

// Groups the flat change list into the user-facing rows shown in the modal.
function useReviewItems( changes ) {
	return useMemo( () => {
		const groups = new Map();
		for ( const change of changes ) {
			if ( isRideAlongBorderStyle( change ) ) {
				continue;
			}
			const key = getChangeGroupKey( change.path );
			if ( ! groups.has( key ) ) {
				groups.set( key, {
					key,
					label: getChangeLabel( key, change.path ),
					valueLabel: getChangeValueLabel( change.value ),
					changes: [],
				} );
			}
			groups.get( key ).changes.push( change );
		}
		return [ ...groups.values() ];
	}, [ changes ] );
}

function PushChangesToGlobalStylesControl( {
	name,
	attributes,
	setAttributes,
} ) {
	const { user: userConfig, setUser: setUserConfig } = useGlobalStyles();

	const changes = useChangesToPush( name, attributes, userConfig );
	const reviewItems = useReviewItems( changes );

	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ selectedKeys, setSelectedKeys ] = useState( () => new Set() );

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const pushChanges = useCallback(
		( changesToApply ) => {
			if ( ! changesToApply?.length ) {
				return;
			}

			const { style: blockStyles } = attributes;

			const newBlockStyles = structuredClone( blockStyles );
			const newUserConfig = structuredClone( userConfig );

			for ( const { path, value } of changesToApply ) {
				setNestedValue( newBlockStyles, path, undefined );
				setNestedValue(
					newUserConfig,
					[ 'styles', 'blocks', name, ...path ],
					value
				);
			}

			const newBlockAttributes = {
				borderColor: undefined,
				backgroundColor: undefined,
				textColor: undefined,
				gradient: undefined,
				fontSize: undefined,
				fontFamily: undefined,
				style: cleanEmptyObject( newBlockStyles ),
			};

			// @wordpress/core-data doesn't support editing multiple entity types in
			// a single undo level. So for now, we disable @wordpress/core-data undo
			// tracking and implement our own Undo button in the snackbar
			// notification.
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( newBlockAttributes );
			setUserConfig( newUserConfig, { undoIgnore: true } );
			createSuccessNotice(
				sprintf(
					// translators: %s: Title of the block e.g. 'Heading'.
					__( '%s styles applied.' ),
					getBlockType( name ).title
				),
				{
					type: 'snackbar',
					actions: [
						{
							label: __( 'Undo' ),
							onClick() {
								__unstableMarkNextChangeAsNotPersistent();
								setAttributes( attributes );
								setUserConfig( userConfig, {
									undoIgnore: true,
								} );
							},
						},
					],
				}
			);
		},
		[
			__unstableMarkNextChangeAsNotPersistent,
			attributes,
			createSuccessNotice,
			name,
			setAttributes,
			setUserConfig,
			userConfig,
		]
	);

	const openModal = useCallback( () => {
		// Seed every change as selected when the review opens.
		setSelectedKeys( new Set( reviewItems.map( ( item ) => item.key ) ) );
		setIsModalOpen( true );
	}, [ reviewItems ] );

	const toggleKey = useCallback( ( key, isChecked ) => {
		setSelectedKeys( ( previous ) => {
			const next = new Set( previous );
			if ( isChecked ) {
				next.add( key );
			} else {
				next.delete( key );
			}
			return next;
		} );
	}, [] );

	const applySelected = useCallback( () => {
		const selected = reviewItems
			.filter( ( item ) => selectedKeys.has( item.key ) )
			.flatMap( ( item ) => item.changes );

		// The synthetic border-style fallbacks aren't shown as rows; include
		// them only when a border change is actually being pushed.
		const keepsBorder = selected.some(
			( change ) => change.path[ 0 ] === 'border'
		);
		const rideAlong = keepsBorder
			? changes.filter( isRideAlongBorderStyle )
			: [];

		pushChanges( [ ...selected, ...rideAlong ] );
		setIsModalOpen( false );
	}, [ reviewItems, selectedKeys, changes, pushChanges ] );

	const blockTitle = getBlockType( name )?.title ?? name;

	return (
		<>
			<BaseControl
				className="editor-push-changes-to-global-styles-control"
				help={ sprintf(
					// translators: %s: Title of the block e.g. 'Heading'.
					__(
						'Apply this block’s typography, spacing, dimensions, and color styles to all %s blocks.'
					),
					blockTitle
				) }
			>
				<BaseControl.VisualLabel>
					{ __( 'Styles' ) }
				</BaseControl.VisualLabel>
				<Button
					__next40pxDefaultSize
					variant="secondary"
					accessibleWhenDisabled
					disabled={ changes.length === 0 }
					onClick={ openModal }
				>
					{ __( 'Apply globally' ) }
				</Button>
			</BaseControl>
			{ isModalOpen && (
				<Modal
					title={ sprintf(
						// translators: %s: Title of the block e.g. 'Heading'.
						__( 'Apply %s styles globally' ),
						blockTitle
					) }
					onRequestClose={ () => setIsModalOpen( false ) }
					className="editor-push-changes-to-global-styles-modal"
				>
					<p>
						{ sprintf(
							// translators: %s: Title of the block e.g. 'Heading'.
							__(
								'Choose which styles to make the default for all %s blocks.'
							),
							blockTitle
						) }
					</p>
					<Stack
						direction="column"
						gap="sm"
						className="editor-push-changes-to-global-styles-modal__list"
					>
						{ reviewItems.map( ( item ) => (
							<CheckboxControl
								key={ item.key }
								checked={ selectedKeys.has( item.key ) }
								onChange={ ( isChecked ) =>
									toggleKey( item.key, isChecked )
								}
								label={ item.label }
								help={ item.valueLabel }
							/>
						) ) }
					</Stack>
					<Stack
						justify="flex-end"
						gap="sm"
						className="editor-push-changes-to-global-styles-modal__actions"
					>
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ () => setIsModalOpen( false ) }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							accessibleWhenDisabled
							disabled={ selectedKeys.size === 0 }
							onClick={ applySelected }
						>
							{ __( 'Apply' ) }
						</Button>
					</Stack>
				</Modal>
			) }
		</>
	);
}

function PushChangesToGlobalStyles( props ) {
	const blockEditingMode = useBlockEditingMode();
	const isBlockBasedTheme = useSelect(
		( select ) => select( coreStore ).getCurrentTheme()?.is_block_theme,
		[]
	);
	const supportsStyles = SUPPORTED_STYLES.some( ( feature ) =>
		hasBlockSupport( props.name, feature )
	);
	const isDisplayed =
		blockEditingMode === 'default' && supportsStyles && isBlockBasedTheme;

	if ( ! isDisplayed ) {
		return null;
	}

	return (
		<InspectorAdvancedControls>
			<PushChangesToGlobalStylesControl { ...props } />
		</InspectorAdvancedControls>
	);
}

const withPushChangesToGlobalStyles = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => (
		<>
			<BlockEdit key="edit" { ...props } />
			{ props.isSelected && <PushChangesToGlobalStyles { ...props } /> }
		</>
	)
);

addFilter(
	'editor.BlockEdit',
	'core/editor/push-changes-to-global-styles',
	withPushChangesToGlobalStyles
);
