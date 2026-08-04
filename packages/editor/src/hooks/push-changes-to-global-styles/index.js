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

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import setNestedValue from '../../utils/set-nested-value';
import { useGlobalStyles } from '../../components/global-styles/hooks';
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
 * One style change shown as a single row. It holds every `{ path, value }` pair
 * the change covers so they all get pushed together.
 *
 * @typedef {Object} ChangeRow
 * @property {string}                            id               Unique row id.
 * @property {string[]}                          primaryPath      Path used to look up the current value.
 * @property {Array<{path: string[], value: *}>} paths            The path/value pairs to push.
 * @property {string[]}                          presetAttributes Preset block attributes to clear when pushed.
 * @property {*}                                 newValue         Value shown in the "New" column.
 * @property {string}                            [format]         How to display the value (`border`, `borderRadius`, `spacing`).
 */

// Builds the border rows, grouped so each one reads as a single CSS `border`
// value (all sides, one side, and radius) instead of a row per property.
function getBorderRows( supports, attributes, blockUserConfig ) {
	const rows = [];
	const border = attributes.style?.border;
	const userBorder = blockUserConfig?.border;

	const colorSupported = supports.includes( 'borderColor' );
	const widthSupported = supports.includes( 'borderWidth' );
	const styleSupported = supports.includes( 'borderStyle' );

	// The all-sides border. A preset border color lives in a block attribute
	// and is pushed as a preset value.
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

	// Border radius, pushed as-is (a string or an object per corner) since
	// Global Styles takes either.
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

// Builds one border row (all sides or a single side) that pushes its color,
// width and style together and shows them as one CSS value. Returns `null`
// when there's nothing set.
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
	// The all-sides value is also written to each side so it can override any
	// per-side values from theme.json.
	const targetSides = side ? [ side ] : sides;

	const addChange = ( property, value ) => {
		if ( value === undefined ) {
			return;
		}
		if ( ! side ) {
			paths.push( { path: [ 'border', property ], value } );
		}
		targetSides.forEach( ( targetSide ) => {
			paths.push( { path: [ 'border', targetSide, property ], value } );
		} );
	};

	addChange( 'color', color );
	addChange( 'width', width );
	addChange( 'style', style );

	// A border only shows with a style, so use `solid` when a color or width
	// is set without one (unless Global Styles already sets a style for that
	// side, which is kept).
	let effectiveStyle = style;
	if ( ! style && ( color || width ) ) {
		const sideStyles = targetSides.map(
			( targetSide ) => userBorder?.[ targetSide ]?.style
		);
		targetSides.forEach( ( targetSide, index ) => {
			if ( ! sideStyles[ index ] ) {
				paths.push( {
					path: [ 'border', targetSide, 'style' ],
					value: 'solid',
				} );
			}
		} );
		// Show the style the border will actually have after Apply: the shared
		// Global Styles style when every side agrees on one, else `solid`.
		const sharedStyle = sideStyles.every(
			( sideStyle ) => sideStyle === sideStyles[ 0 ]
		)
			? sideStyles[ 0 ]
			: undefined;
		effectiveStyle = sharedStyle || 'solid';
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
 * Works out which of the block's style changes can be pushed to Global Styles,
 * grouped into rows (see `ChangeRow`).
 *
 * @param {Array}  supports        Supported style keys for the block.
 * @param {Object} attributes      Block attributes.
 * @param {Object} blockUserConfig The block's user Global Styles config.
 *
 * @return {ChangeRow[]} The changes, grouped into rows.
 */
export function getChangesToPush( supports, attributes, blockUserConfig ) {
	const rows = [];

	supports.forEach( ( key ) => {
		if ( ! STYLE_PROPERTY[ key ] ) {
			return;
		}
		// Border styles are grouped and handled separately below.
		if ( key.startsWith( 'border' ) ) {
			return;
		}
		// Root-only properties (e.g. `--wp--style--root--padding`) repeat their
		// normal version (`padding`) and only apply to the root, so skip them.
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

		// A preset attribute is only removed from the block when its row is
		// pushed (see `getStylesUpdate`).
		const presetAttributes = presetAttributeValue
			? [ presetAttributeName ]
			: [];

		// Links have a single support but two styles: color and hover color.
		// Add the hover color to the changes when it's set.
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
			// Padding and margin can be axial or per-side objects. The format
			// hint lets them show as one CSS value instead of a row per side
			// or a raw object. Block gap can be an axial `{ top, left }` object.
			let format;
			if ( key === 'padding' || key === 'margin' ) {
				format = 'spacing';
			} else if ( key === 'blockGap' ) {
				format = 'blockGap';
			}
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
 * Works out the block attribute and user Global Styles updates for the chosen
 * rows, without applying them. Returns `null` when there's nothing to push.
 *
 * @param {Object} options            Options.
 * @param {Array}  options.rowsToPush The rows to push.
 * @param {Object} options.attributes Current block attributes.
 * @param {Object} options.userConfig Current user Global Styles config.
 * @param {string} options.name       Block name.
 *
 * @return {?{newBlockAttributes: Object, newUserConfig: Object}} The updates,
 *   or `null` when no rows were chosen.
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

	// Only clear the preset attributes from the rows being pushed. Clearing
	// them all would wipe unselected preset styles from the block without
	// pushing them to Global Styles.
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

	const pushChanges = useCallback(
		( rowsToPush ) => {
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
