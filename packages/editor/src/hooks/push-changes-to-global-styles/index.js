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
import { BaseControl, Button } from '@wordpress/components';
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
import {
	getStyle,
	getValueFromVariable,
} from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import setNestedValue from '../../utils/set-nested-value';
import { useGlobalStyles } from '../../components/global-styles/hooks';
import { getStyleLabel } from './style-labels';
import {
	formatStyleValue,
	formatBorderShorthand,
	formatBorderRadius,
	formatSpacingShorthand,
} from './format-style-value';
import ApplyGloballyModal from './apply-globally-modal';

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

const sides = [ 'top', 'right', 'bottom', 'left' ];

/**
 * Builds the border review rows.
 *
 * Border styles are grouped by scope so each row reads as a CSS `border`
 * shorthand rather than one row per longhand: a single "Border" row for the
 * all-sides shorthand, one row per side for split borders, and a "Border
 * radius" row. Grouping keeps the modal compact and legible.
 *
 * Global Styles requires per-side longhand configuration (to override per-side
 * theme.json settings) and a border style for a border to render, so the
 * all-sides shorthand is also written to every side and a `solid` style
 * fallback is added when a color or width is set without a style.
 *
 * @param {string[]} supports        Supported style keys for the block.
 * @param {Object}   attributes      Block attributes.
 * @param {Object}   blockUserConfig User Global Styles config for the block.
 *
 * @return {Array} Grouped border rows.
 */
function getBorderRows( supports, attributes, blockUserConfig ) {
	const rows = [];
	const border = attributes.style?.border;
	const userBorder = blockUserConfig?.border;

	const colorSupported = supports.includes( 'borderColor' );
	const widthSupported = supports.includes( 'borderWidth' );
	const styleSupported = supports.includes( 'borderStyle' );

	// All-sides (flat) border shorthand. A preset border color is stored as a
	// block attribute and pushed as a preset variable token.
	const presetBorderColor = attributes.borderColor;
	const flatColor = presetBorderColor
		? `var:preset|color|${ presetBorderColor }`
		: border?.color;
	const flatRow = buildBorderScopeRow( {
		id: 'border',
		primaryPath: [ 'border' ],
		side: null,
		color: colorSupported ? flatColor : undefined,
		width: widthSupported ? border?.width : undefined,
		style: styleSupported ? border?.style : undefined,
		userBorder,
		presetAttributes: presetBorderColor ? [ 'borderColor' ] : [],
	} );
	if ( flatRow ) {
		rows.push( flatRow );
	}

	// Per-side borders (split border configuration).
	sides.forEach( ( side ) => {
		const sideBorder = border?.[ side ];
		const sideRow = buildBorderScopeRow( {
			id: `border.${ side }`,
			primaryPath: [ 'border', side ],
			side,
			color: colorSupported ? sideBorder?.color : undefined,
			width: widthSupported ? sideBorder?.width : undefined,
			style: styleSupported ? sideBorder?.style : undefined,
			userBorder,
			presetAttributes: [],
		} );
		if ( sideRow ) {
			rows.push( sideRow );
		}
	} );

	// Border radius. Pushed as-is (a string or per-corner object) since Global
	// Styles accepts both forms.
	if (
		supports.includes( 'borderRadius' ) &&
		border?.radius !== undefined &&
		border?.radius !== ''
	) {
		rows.push( {
			id: 'border.radius',
			primaryPath: [ 'border', 'radius' ],
			paths: [ { path: [ 'border', 'radius' ], value: border.radius } ],
			presetAttributes: [],
			newValue: border.radius,
			format: 'borderRadius',
		} );
	}

	return rows;
}

/**
 * Builds a single border row (all-sides or one side) that pushes the scope's
 * color, width, and style together and displays them as a CSS shorthand.
 *
 * @param {Object}   options                  Options.
 * @param {string}   options.id               Row id.
 * @param {string[]} options.primaryPath      Path used for the current-value lookup.
 * @param {?string}  options.side             Side name, or `null` for all sides.
 * @param {*}        options.color            Border color value, if any.
 * @param {*}        options.width            Border width value, if any.
 * @param {*}        options.style            Border style value, if any.
 * @param {Object}   options.userBorder       User Global Styles border config.
 * @param {string[]} options.presetAttributes Preset block attributes to clear.
 *
 * @return {?Object} The border row, or `null` when the scope has no values.
 */
function buildBorderScopeRow( {
	id,
	primaryPath,
	side,
	color,
	width,
	style,
	userBorder,
	presetAttributes,
} ) {
	if ( ! color && ! width && ! style ) {
		return null;
	}

	const paths = [];
	// The all-sides shorthand is also written to each side so it can override
	// per-side theme.json configuration.
	const targetSides = side ? [ side ] : sides;

	const addChange = ( property, value ) => {
		if ( value === undefined ) {
			return;
		}
		if ( ! side ) {
			// The shorthand entry is cleared from the block and set globally.
			paths.push( { path: [ 'border', property ], value } );
		}
		targetSides.forEach( ( targetSide ) => {
			paths.push( { path: [ 'border', targetSide, property ], value } );
		} );
	};

	addChange( 'color', color );
	addChange( 'width', width );
	addChange( 'style', style );

	// A visible border needs a style, so fall back to `solid` when a color or
	// width is set without one (unless Global Styles already define a style for
	// that side).
	let effectiveStyle = style;
	if ( ! style && ( color || width ) ) {
		targetSides.forEach( ( targetSide ) => {
			if ( ! userBorder?.[ targetSide ]?.style ) {
				paths.push( {
					path: [ 'border', targetSide, 'style' ],
					value: 'solid',
				} );
			}
		} );
		effectiveStyle = 'solid';
	}

	return {
		id,
		primaryPath,
		paths,
		presetAttributes,
		newValue: { color, width, style: effectiveStyle },
		format: 'border',
	};
}

/**
 * Derives the block-instance style changes that can be pushed to Global Styles,
 * grouped into logical rows.
 *
 * Each row represents a single logical style (e.g. "Font size") and carries all
 * of its expanded `{ path, value }` pairs so that a selection can push them
 * atomically. Border styles are grouped by scope into shorthand rows (see
 * `getBorderRows`).
 *
 * @param {Array}  supports        Supported style keys for the block.
 * @param {Object} attributes      Block attributes.
 * @param {Object} blockUserConfig User Global Styles config for the block.
 *
 * @return {Array<{id: string, primaryPath: string[], paths: Array<{path: string[], value: *}>, presetAttributes: string[], newValue: *, format?: string}>}
 *   Grouped change rows.
 */
export function getChangesToPush( supports, attributes, blockUserConfig ) {
	const rows = [];

	supports.forEach( ( key ) => {
		if ( ! STYLE_PROPERTY[ key ] ) {
			return;
		}
		// Border styles are grouped by scope and handled separately below.
		if ( key.startsWith( 'border' ) ) {
			return;
		}
		// Root-only properties (e.g. `--wp--style--root--padding`) duplicate
		// their non-root counterpart (`padding`) and only apply to the root,
		// so they are skipped here.
		if ( STYLE_PROPERTY[ key ].rootOnly ) {
			return;
		}
		const { value: path } = STYLE_PROPERTY[ key ];
		const presetAttributeKey = path.join( '.' );
		const presetAttributeName =
			STYLE_PATH_TO_PRESET_BLOCK_ATTRIBUTE[ presetAttributeKey ];
		const presetAttributeValue = presetAttributeName
			? attributes[ presetAttributeName ]
			: undefined;
		const value = presetAttributeValue
			? `var:preset|${ STYLE_PATH_TO_CSS_VAR_INFIX[ presetAttributeKey ] }|${ presetAttributeValue }`
			: getValueFromObjectPath( attributes.style, path );

		// A preset attribute is only cleared from the block when its
		// corresponding row is pushed (see `getStylesUpdate`).
		const presetAttributes = presetAttributeValue
			? [ presetAttributeName ]
			: [];

		// Links only have a single support entry but have two element
		// style properties, color and hover color. The following check
		// will add the hover color to the changes if required.
		if ( key === 'linkColor' ) {
			const paths = value ? [ { path, value } ] : [];
			const hoverPath = [ 'elements', 'link', ':hover', 'color', 'text' ];
			const hoverValue = getValueFromObjectPath(
				attributes.style,
				hoverPath
			);

			if ( hoverValue ) {
				paths.push( { path: hoverPath, value: hoverValue } );
			}

			if ( paths.length === 0 ) {
				return;
			}

			rows.push( {
				id: presetAttributeKey,
				primaryPath: path,
				paths,
				presetAttributes,
				newValue: value ?? hoverValue,
			} );
			return;
		}

		if ( value ) {
			// Padding and margin can be axial or per-side objects; a format
			// hint lets them render as a single CSS shorthand instead of one
			// row per side or a raw object.
			const format =
				key === 'padding' || key === 'margin' ? 'spacing' : undefined;
			rows.push( {
				id: presetAttributeKey,
				primaryPath: path,
				paths: [ { path, value } ],
				presetAttributes,
				newValue: value,
				format,
			} );
		}
	} );

	rows.push( ...getBorderRows( supports, attributes, blockUserConfig ) );

	return rows;
}

function useChangesToPush( name, attributes, userConfig ) {
	const supports = useSelect(
		( select ) => {
			return unlock( select( blocksStore ) ).getSupportedStyles( name );
		},
		[ name ]
	);
	const blockUserConfig = userConfig?.styles?.blocks?.[ name ];

	return useMemo(
		() => getChangesToPush( supports, attributes, blockUserConfig ),
		[ supports, attributes, blockUserConfig ]
	);
}

/**
 * Computes the block attribute and user Global Styles updates for a subset of
 * grouped rows without applying them.
 *
 * Preset block attributes are only cleared for rows that are part of the pushed
 * subset, so deselected preset styles are neither pushed nor wiped from the
 * block. Returns `null` when there is nothing to push.
 *
 * @param {Object} options            Options.
 * @param {Array}  options.rowsToPush Grouped rows to push.
 * @param {Object} options.attributes Current block attributes.
 * @param {Object} options.userConfig Current user Global Styles config.
 * @param {string} options.name       Block name.
 *
 * @return {?{newBlockAttributes: Object, newUserConfig: Object}} The computed
 *   updates, or `null` when the subset is empty.
 */
export function getStylesUpdate( {
	rowsToPush,
	attributes,
	userConfig,
	name,
} ) {
	if ( ! rowsToPush || rowsToPush.length === 0 ) {
		return null;
	}

	const selectedChanges = rowsToPush.flatMap( ( row ) => row.paths );

	if ( selectedChanges.length === 0 ) {
		return null;
	}

	const { style: blockStyles } = attributes;

	const newBlockStyles = structuredClone( blockStyles );
	const newUserConfig = structuredClone( userConfig );

	for ( const { path, value } of selectedChanges ) {
		setNestedValue( newBlockStyles, path, undefined );
		setNestedValue(
			newUserConfig,
			[ 'styles', 'blocks', name, ...path ],
			value
		);
	}

	// Only clear the preset block attributes that belong to the pushed rows.
	// Clearing them unconditionally would wipe deselected preset styles from
	// the block without pushing them to Global Styles.
	const newBlockAttributes = {
		style: cleanEmptyObject( newBlockStyles ),
	};
	for ( const presetAttribute of rowsToPush.flatMap(
		( row ) => row.presetAttributes
	) ) {
		newBlockAttributes[ presetAttribute ] = undefined;
	}

	return { newBlockAttributes, newUserConfig };
}

/**
 * Formats a raw style value for display, using the row's `format` hint so
 * border scopes render as CSS shorthands rather than raw objects.
 *
 * @param {string}   format  Optional format hint (`border`, `borderRadius`,
 *                           `spacing`).
 * @param {*}        value   The raw style value.
 * @param {Function} resolve Resolver for preset tokens (used for spacing).
 *
 * @return {string} A human-friendly representation of the value.
 */
function formatReviewValue( format, value, resolve ) {
	if ( format === 'border' ) {
		return formatBorderShorthand( value );
	}
	if ( format === 'borderRadius' ) {
		return formatBorderRadius( value );
	}
	if ( format === 'spacing' ) {
		return formatSpacingShorthand( value, resolve );
	}
	return formatStyleValue( value );
}

/**
 * Enriches grouped change rows with a human-readable label and the current
 * effective Global Styles value for the block type, plus display-formatted
 * versions of the current and new values.
 *
 * @param {Array}  rows   Grouped rows from `useChangesToPush`.
 * @param {Object} merged Merged Global Styles config.
 * @param {string} name   Block name.
 *
 * @return {Array} Rows extended with `label`, `currentValue`,
 *                 `formattedCurrentValue`, and `formattedNewValue`.
 */
export function useReviewRows( rows, merged, name ) {
	return useMemo( () => {
		// Resolves preset tokens (e.g. `var:preset|spacing|40`) to their actual
		// values so spacing reads as a real size rather than a preset slug.
		const resolve = ( value ) =>
			getValueFromVariable( merged, name, value );

		return rows.map( ( row ) => {
			const currentValue = getStyle(
				merged,
				row.primaryPath.join( '.' ),
				name
			);
			return {
				...row,
				label: getStyleLabel( row.primaryPath ),
				currentValue,
				formattedCurrentValue: formatReviewValue(
					row.format,
					currentValue,
					resolve
				),
				formattedNewValue: formatReviewValue(
					row.format,
					row.newValue,
					resolve
				),
			};
		} );
	}, [ rows, merged, name ] );
}

function PushChangesToGlobalStylesControl( {
	name,
	attributes,
	setAttributes,
} ) {
	const { user: userConfig, setUser: setUserConfig } = useGlobalStyles();

	const rows = useChangesToPush( name, attributes, userConfig );

	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	// Pushes the given subset of grouped rows to Global Styles. Defaults to all
	// rows so the caller can push everything without change to prior behaviour.
	const pushChanges = useCallback(
		( rowsToPush = rows ) => {
			const update = getStylesUpdate( {
				rowsToPush,
				attributes,
				userConfig,
				name,
			} );

			if ( ! update ) {
				return;
			}

			const { newBlockAttributes, newUserConfig } = update;

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
			rows,
			createSuccessNotice,
			name,
			setAttributes,
			setUserConfig,
			userConfig,
		]
	);

	return (
		<BaseControl
			className="editor-push-changes-to-global-styles-control"
			help={ sprintf(
				// translators: %s: Title of the block e.g. 'Heading'.
				__(
					'Review and apply this block’s typography, spacing, dimensions, and color styles to all %s blocks.'
				),
				getBlockType( name ).title
			) }
		>
			<BaseControl.VisualLabel>
				{ __( 'Styles' ) }
			</BaseControl.VisualLabel>
			<Button
				__next40pxDefaultSize
				variant="secondary"
				accessibleWhenDisabled
				disabled={ rows.length === 0 }
				onClick={ () => setIsModalOpen( true ) }
			>
				{ __( 'Apply globally' ) }
			</Button>
			{ isModalOpen && (
				<ApplyGloballyModal
					name={ name }
					rows={ rows }
					onApply={ pushChanges }
					onRequestClose={ () => setIsModalOpen( false ) }
				/>
			) }
		</BaseControl>
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
