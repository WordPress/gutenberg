import fastDeepEqual from 'fast-deep-equal';
import { __EXPERIMENTAL_STYLE_PROPERTY } from '@wordpress/blocks';

const SPACING_SIDES = [ 'top', 'right', 'bottom', 'left' ];

const ATTRIBUTE_STYLE_SUPPORTS = {
	backgroundColor: 'backgroundColor',
	borderColor: 'borderColor',
	fontFamily: 'fontFamily',
	fontSize: 'fontSize',
	gradient: 'background',
	textColor: 'color',
};

const ATTRIBUTE_STYLE_PATHS = {
	backgroundColor: [ 'color', 'background' ],
	borderColor: [ 'border', 'color' ],
	fontFamily: [ 'typography', 'fontFamily' ],
	fontSize: [ 'typography', 'fontSize' ],
	gradient: [ 'color', 'gradient' ],
	textColor: [ 'color', 'text' ],
};

const FONT_SIZE_PATH = ATTRIBUTE_STYLE_PATHS.fontSize;
const LINK_COLOR_PATH = [ 'elements', 'link', 'color', 'text' ];
const TEXT_COLOR_PATH = ATTRIBUTE_STYLE_PATHS.textColor;

function isObject( value ) {
	return (
		value !== null && typeof value === 'object' && ! Array.isArray( value )
	);
}

function cleanEmptyObject( object ) {
	if ( ! isObject( object ) ) {
		return object;
	}

	const entries = Object.entries( object )
		.map( ( [ key, value ] ) => [ key, cleanEmptyObject( value ) ] )
		.filter( ( [ , value ] ) => value !== undefined );

	return entries.length ? Object.fromEntries( entries ) : undefined;
}

function getValueFromPath( object, path ) {
	return path.reduce( ( value, key ) => value?.[ key ], object );
}

function hasOwn( object, key ) {
	return Object.prototype.hasOwnProperty.call( object, key );
}

function isSamePath( firstPath, secondPath ) {
	return (
		firstPath.length === secondPath.length &&
		firstPath.every( ( key, index ) => key === secondPath[ index ] )
	);
}

function getStyleChange( styleChanges, path ) {
	return styleChanges.find( ( change ) => isSamePath( change.path, path ) );
}

function isSameSettingItem( firstItem, secondItem ) {
	if (
		isObject( firstItem ) &&
		isObject( secondItem ) &&
		firstItem.slug !== undefined &&
		secondItem.slug !== undefined
	) {
		return firstItem.slug === secondItem.slug;
	}

	return fastDeepEqual( firstItem, secondItem );
}

function getCommonSettingValue( sourceValue, targetValues ) {
	if ( targetValues.every( ( value ) => value === undefined ) ) {
		return sourceValue;
	}

	if ( Array.isArray( sourceValue ) ) {
		if ( targetValues.some( ( value ) => ! Array.isArray( value ) ) ) {
			return [];
		}

		return sourceValue.filter( ( sourceItem ) =>
			targetValues.every( ( targetItems ) =>
				targetItems.some( ( targetItem ) =>
					isSameSettingItem( sourceItem, targetItem )
				)
			)
		);
	}

	if ( isObject( sourceValue ) ) {
		if ( targetValues.every( ( value ) => value === true ) ) {
			return sourceValue;
		}

		if (
			targetValues.some(
				( value ) => value !== true && ! isObject( value )
			)
		) {
			return false;
		}

		return Object.fromEntries(
			Object.entries( sourceValue ).map( ( [ key, value ] ) => [
				key,
				getCommonSettingValue(
					value,
					targetValues.map( ( targetValue ) =>
						targetValue === true ? undefined : targetValue?.[ key ]
					)
				),
			] )
		);
	}

	if ( typeof sourceValue === 'boolean' ) {
		return sourceValue && targetValues.every( Boolean );
	}

	return targetValues.every( ( value ) =>
		fastDeepEqual( sourceValue, value )
	)
		? sourceValue
		: undefined;
}

function getAttributeStyleValue(
	attributes,
	attributeName,
	stylePath,
	presetType
) {
	const attributeValue = attributes?.[ attributeName ];
	return attributeValue
		? `var:preset|${ presetType }|${ attributeValue }`
		: getValueFromPath( attributes?.style, stylePath );
}

function getChangedAttributeStyleValue(
	targetAttributes,
	{ styleChanges, attributeChanges },
	attributeName,
	stylePath,
	presetType
) {
	const attributeValue = hasOwn( attributeChanges, attributeName )
		? attributeChanges[ attributeName ]
		: targetAttributes?.[ attributeName ];
	const styleChange = getStyleChange( styleChanges, stylePath );
	const styleValue = styleChange
		? styleChange.value
		: getValueFromPath( targetAttributes?.style, stylePath );

	return attributeValue
		? `var:preset|${ presetType }|${ attributeValue }`
		: styleValue;
}

function getChangedLeaves( previousValue, nextValue, path = [] ) {
	if ( fastDeepEqual( previousValue, nextValue ) ) {
		return [];
	}

	if ( isObject( previousValue ) || isObject( nextValue ) ) {
		const keys = new Set( [
			...Object.keys( previousValue || {} ),
			...Object.keys( nextValue || {} ),
		] );

		return Array.from( keys ).flatMap( ( key ) =>
			getChangedLeaves( previousValue?.[ key ], nextValue?.[ key ], [
				...path,
				key,
			] )
		);
	}

	return [ { path, value: nextValue } ];
}

function setValueAtPath( object, path, value ) {
	const [ key, ...remainingPath ] = path;
	const nextObject = isObject( object ) ? object : {};

	if ( remainingPath.length === 0 ) {
		return { ...nextObject, [ key ]: value };
	}

	return {
		...nextObject,
		[ key ]: setValueAtPath( nextObject[ key ], remainingPath, value ),
	};
}

function isSupportedPath( path, supportedPaths ) {
	return supportedPaths.some(
		( supportedPath ) =>
			supportedPath.length <= path.length &&
			supportedPath.every( ( key, index ) => key === path[ index ] )
	);
}

function getSpacingSides( blockType, feature ) {
	const support = blockType?.supports?.spacing?.[ feature ];

	if ( ! support ) {
		return [];
	}

	if ( support === true ) {
		return SPACING_SIDES;
	}

	if ( Array.isArray( support ) ) {
		return support;
	}

	return support.sides || SPACING_SIDES;
}

/**
 * Returns registered text-category blocks without changing their input order.
 *
 * @param {string[]} clientIds    Block client IDs in document order.
 * @param {Function} getBlockName Resolves a client ID to its block name.
 * @param {Function} getBlockType Resolves a block name to its registered type.
 * @return {string[]} Eligible block client IDs.
 */
export function getTextStyleTargetClientIds(
	clientIds,
	getBlockName,
	getBlockType
) {
	return clientIds.filter( ( clientId ) => {
		const blockName = getBlockName( clientId );
		return getBlockType( blockName )?.category === 'text';
	} );
}

/**
 * Returns the content-only descendants represented by section blocks while
 * excluding descendants already represented beneath a List View item.
 *
 * @param {string[]} sectionClientIds          Section block client IDs.
 * @param {Function} getClientIdsOfDescendants Resolves all descendants.
 * @param {Function} getBlockEditingMode       Resolves a block editing mode.
 * @param {Function} shouldRenderBlockListView Whether a block has List View UI.
 * @return {string[]} Represented descendant client IDs in document order.
 */
export function getContentOnlySectionClientIds(
	sectionClientIds,
	getClientIdsOfDescendants,
	getBlockEditingMode,
	shouldRenderBlockListView
) {
	const representedClientIds = new Set();

	sectionClientIds.forEach( ( sectionClientId ) => {
		const descendants = getClientIdsOfDescendants( sectionClientId );
		const listViewDescendants = new Set();

		descendants.forEach( ( clientId ) => {
			if ( shouldRenderBlockListView( clientId ) ) {
				getClientIdsOfDescendants( clientId ).forEach( ( childId ) =>
					listViewDescendants.add( childId )
				);
			}
		} );

		descendants.forEach( ( clientId ) => {
			if (
				! listViewDescendants.has( clientId ) &&
				getBlockEditingMode( clientId ) === 'contentOnly'
			) {
				representedClientIds.add( clientId );
			}
		} );
	} );

	return Array.from( representedClientIds );
}

/**
 * Expands selected sections in place so eligible text targets retain document
 * order across direct selections and represented section descendants.
 *
 * @param {string[]} clientIds                  Selected block client IDs.
 * @param {string[]} sectionClientIds           Selected section client IDs.
 * @param {Function} getSectionContentClientIds Resolves represented descendants.
 * @param {Function} getBlockName               Resolves a client ID to its name.
 * @param {Function} getBlockType               Resolves a name to its block type.
 * @return {string[]} Eligible text target client IDs in document order.
 */
export function getExpandedTextStyleTargetClientIds(
	clientIds,
	sectionClientIds,
	getSectionContentClientIds,
	getBlockName,
	getBlockType
) {
	const sections = new Set( sectionClientIds );
	const expandedClientIds = Array.from(
		new Set(
			clientIds.flatMap( ( clientId ) =>
				sections.has( clientId )
					? getSectionContentClientIds( clientId )
					: [ clientId ]
			)
		)
	);

	return getTextStyleTargetClientIds(
		expandedClientIds,
		getBlockName,
		getBlockType
	);
}

/**
 * Intersects supported style names while retaining the first list's order.
 *
 * @param {string[][]} supportedStylesByBlock Supported styles per block type.
 * @return {string[]} Style names shared by every block type.
 */
export function getCommonSupportedStyles( supportedStylesByBlock ) {
	if ( ! supportedStylesByBlock.length ) {
		return [];
	}

	const remainingStyleSets = supportedStylesByBlock
		.slice( 1 )
		.map( ( styles ) => new Set( styles ) );

	return supportedStylesByBlock[ 0 ].filter( ( style ) =>
		remainingStyleSets.every( ( styles ) => styles.has( style ) )
	);
}

/**
 * Restricts source settings to values available to every target instance.
 * Settings absent from every target are retained because some controls derive
 * defaults from block supports rather than theme settings.
 *
 * @param {Object}   sourceSettings   Resolved settings for the source block.
 * @param {Object[]} settingsByTarget Raw editor settings for every target.
 * @return {Object} Settings shared by every target.
 */
export function getCommonStyleSettings( sourceSettings, settingsByTarget ) {
	if ( ! settingsByTarget.length ) {
		return sourceSettings;
	}

	return getCommonSettingValue( sourceSettings, settingsByTarget );
}

/**
 * Builds a nested settings object from ordered setting paths and values.
 *
 * @param {string[]} paths  Dot-separated setting paths.
 * @param {Array}    values Values matching the path order.
 * @return {Object} Nested settings object.
 */
export function createBlockStyleSettings( paths, values ) {
	return paths.reduce(
		( settings, path, index ) =>
			setValueAtPath( settings, path.split( '.' ), values[ index ] ),
		{}
	);
}

/**
 * Returns spacing sides supported by every block type.
 *
 * @param {Object[]} blockTypes Registered block types.
 * @param {string}   feature    Spacing feature.
 * @return {string[]} Common spacing sides.
 */
export function getCommonSpacingSides( blockTypes, feature ) {
	if ( ! blockTypes.length ) {
		return [];
	}

	const [ firstBlockType, ...remainingBlockTypes ] = blockTypes;
	const remainingSides = remainingBlockTypes.map(
		( blockType ) => new Set( getSpacingSides( blockType, feature ) )
	);

	return getSpacingSides( firstBlockType, feature ).filter( ( side ) =>
		remainingSides.every( ( sides ) => sides.has( side ) )
	);
}

/**
 * Restricts source settings to style features shared by every target.
 *
 * @param {Object}   settings              Source block settings.
 * @param {string[]} commonSupportedStyles Shared style names.
 * @param {Object[]} blockTypes            Target block types.
 * @return {Object} Shared settings.
 */
export function getSharedStyleSettings(
	settings,
	commonSupportedStyles,
	blockTypes
) {
	const supportedStyles = new Set( commonSupportedStyles );
	const sharedSettings = { ...settings };

	if ( ! supportedStyles.has( 'fontSize' ) ) {
		sharedSettings.typography = {
			...sharedSettings.typography,
			fontSizes: {},
			customFontSize: false,
			defaultFontSizes: false,
		};
	}

	if ( ! supportedStyles.has( 'fontFamily' ) ) {
		sharedSettings.typography = {
			...sharedSettings.typography,
			fontFamilies: {},
		};
	}

	sharedSettings.color = {
		...sharedSettings.color,
		text: sharedSettings.color?.text && supportedStyles.has( 'color' ),
		background:
			sharedSettings.color?.background &&
			( supportedStyles.has( 'background' ) ||
				supportedStyles.has( 'backgroundColor' ) ),
		button:
			sharedSettings.color?.button &&
			supportedStyles.has( 'buttonColor' ),
		heading:
			sharedSettings.color?.heading &&
			supportedStyles.has( 'headingColor' ),
		link: sharedSettings.color?.link && supportedStyles.has( 'linkColor' ),
		caption:
			sharedSettings.color?.caption &&
			supportedStyles.has( 'captionColor' ),
	};

	if (
		! supportedStyles.has( 'background' ) &&
		! supportedStyles.has( 'backgroundGradient' )
	) {
		sharedSettings.color.gradients = [];
		sharedSettings.color.customGradient = false;
	}

	[
		'lineHeight',
		'fontStyle',
		'fontWeight',
		'letterSpacing',
		'textAlign',
		'textTransform',
		'textDecoration',
		'textIndent',
		'writingMode',
	].forEach( ( key ) => {
		if ( ! supportedStyles.has( key ) ) {
			sharedSettings.typography = {
				...sharedSettings.typography,
				[ key ]: false,
			};
		}
	} );

	if ( ! supportedStyles.has( 'columnCount' ) ) {
		sharedSettings.typography = {
			...sharedSettings.typography,
			textColumns: false,
		};
	}

	[ 'padding', 'margin', 'blockGap' ].forEach( ( key ) => {
		if ( ! supportedStyles.has( key ) ) {
			sharedSettings.spacing = {
				...sharedSettings.spacing,
				[ key ]: false,
			};
			return;
		}

		if ( key === 'blockGap' ) {
			return;
		}

		const sides = getCommonSpacingSides( blockTypes, key );
		if ( sides.length < SPACING_SIDES.length ) {
			sharedSettings.spacing = {
				...sharedSettings.spacing,
				[ key ]: sides.length
					? {
							...( isObject( sharedSettings.spacing?.[ key ] )
								? sharedSettings.spacing[ key ]
								: {} ),
							sides,
					  }
					: false,
			};
		}
	} );

	[ 'aspectRatio', 'height', 'minHeight', 'minWidth', 'width' ].forEach(
		( key ) => {
			if ( ! supportedStyles.has( key ) ) {
				sharedSettings.dimensions = {
					...sharedSettings.dimensions,
					[ key ]: false,
				};
			}
		}
	);

	[
		[ 'radius', 'borderRadius' ],
		[ 'color', 'borderColor' ],
		[ 'style', 'borderStyle' ],
		[ 'width', 'borderWidth' ],
	].forEach( ( [ settingKey, styleName ] ) => {
		if ( ! supportedStyles.has( styleName ) ) {
			sharedSettings.border = {
				...sharedSettings.border,
				[ settingKey ]: false,
			};
		}
	} );

	[
		[ 'backgroundImage', 'backgroundImage' ],
		[ 'backgroundSize', 'backgroundSize' ],
		[ 'backgroundGradient', 'gradient' ],
	].forEach( ( [ styleName, settingKey ] ) => {
		if ( ! supportedStyles.has( styleName ) ) {
			sharedSettings.background = {
				...sharedSettings.background,
				[ settingKey ]: false,
			};
		}
	} );

	sharedSettings.shadow = supportedStyles.has( 'shadow' )
		? sharedSettings.shadow
		: false;

	return sharedSettings;
}

/**
 * Builds the style paths and top-level attributes that shared panels may edit.
 *
 * @param {string[]} commonSupportedStyles Shared style names.
 * @param {Object[]} blockTypes            Target block types.
 * @return {{ stylePaths: string[][], attributeNames: string[] }} Supported paths.
 */
export function getSharedStylePaths( commonSupportedStyles, blockTypes ) {
	const supportedStyles = new Set( commonSupportedStyles );
	const stylePaths = commonSupportedStyles.flatMap( ( styleName ) => {
		const path = __EXPERIMENTAL_STYLE_PROPERTY[ styleName ]?.value;
		if ( ! path ) {
			return [];
		}

		if ( [ 'margin', 'padding' ].includes( styleName ) ) {
			const sides = getCommonSpacingSides( blockTypes, styleName );
			if ( sides.length < SPACING_SIDES.length ) {
				return sides.map( ( side ) => [ ...path, side ] );
			}
		}

		return [ path ];
	} );

	if ( supportedStyles.has( 'blockGap' ) ) {
		stylePaths.push( [ 'spacing', 'blockGap' ] );
	}
	if ( supportedStyles.has( 'shadow' ) ) {
		stylePaths.push( [ 'shadow' ] );
	}
	// The background-size control also owns background position.
	if (
		supportedStyles.has( 'backgroundSize' ) &&
		! supportedStyles.has( 'backgroundPosition' )
	) {
		stylePaths.push( [ 'background', 'backgroundPosition' ] );
	}

	const attributeNames = Object.entries( ATTRIBUTE_STYLE_SUPPORTS )
		.filter( ( [ , styleName ] ) => supportedStyles.has( styleName ) )
		.map( ( [ attributeName ] ) => attributeName );

	if (
		blockTypes.length &&
		blockTypes.every(
			( blockType ) =>
				getValueFromPath( blockType.supports, [
					'typography',
					'fitText',
				] ) === true
		)
	) {
		attributeNames.push( 'fitText' );
	}

	return { stylePaths, attributeNames };
}

/**
 * Diffs a source block update and keeps only shared style changes.
 *
 * @param {Object}     previousAttributes Source attributes before the update.
 * @param {Object}     nextAttributes     Source attributes after the update.
 * @param {string[][]} stylePaths         Supported nested style paths.
 * @param {string[]}   attributeNames     Supported top-level style attributes.
 * @return {{ styleChanges: Object[], attributeChanges: Object }} Shared changes.
 */
export function getSharedStyleAttributeChanges(
	previousAttributes,
	nextAttributes,
	stylePaths,
	attributeNames
) {
	const attributeChanges = {};

	attributeNames.forEach( ( attributeName ) => {
		if (
			! fastDeepEqual(
				previousAttributes?.[ attributeName ],
				nextAttributes?.[ attributeName ]
			)
		) {
			attributeChanges[ attributeName ] =
				nextAttributes?.[ attributeName ];
		}
	} );

	const styleChanges = getChangedLeaves(
		previousAttributes?.style,
		nextAttributes?.style
	).filter( ( { path } ) => isSupportedPath( path, stylePaths ) );

	Object.entries( ATTRIBUTE_STYLE_PATHS ).forEach(
		( [ attributeName, stylePath ] ) => {
			if ( ! attributeNames.includes( attributeName ) ) {
				return;
			}

			const styleChange = getStyleChange( styleChanges, stylePath );
			if (
				! hasOwn( attributeChanges, attributeName ) &&
				! styleChange
			) {
				return;
			}

			// Preset attributes and their custom style paths are mutually
			// exclusive. Carry both final values so a target cannot retain the
			// representation that happened to be absent from the source.
			attributeChanges[ attributeName ] =
				nextAttributes?.[ attributeName ];
			if ( ! styleChange ) {
				styleChanges.push( {
					path: stylePath,
					value: getValueFromPath( nextAttributes?.style, stylePath ),
				} );
			}
		}
	);

	return { styleChanges, attributeChanges };
}

/**
 * Applies shared style changes to one target without replacing unrelated styles.
 *
 * @param {Object}   targetAttributes         Target block attributes.
 * @param {Object}   changes                  Shared style changes.
 * @param {Object[]} changes.styleChanges     Nested style changes.
 * @param {Object}   changes.attributeChanges Top-level attribute changes.
 * @return {Object} Attribute patch for the target.
 */
export function applySharedStyleAttributeChanges(
	targetAttributes,
	{ styleChanges, attributeChanges }
) {
	const attributePatch = { ...attributeChanges };
	const textColorChanged =
		hasOwn( attributeChanges, 'textColor' ) ||
		!! getStyleChange( styleChanges, TEXT_COLOR_PATH );
	const linkColorChange = getStyleChange( styleChanges, LINK_COLOR_PATH );
	const nextTextColor = getChangedAttributeStyleValue(
		targetAttributes,
		{ styleChanges, attributeChanges },
		'textColor',
		TEXT_COLOR_PATH,
		'color'
	);
	const targetTextColor = getAttributeStyleValue(
		targetAttributes,
		'textColor',
		TEXT_COLOR_PATH,
		'color'
	);
	const targetLinkColor = getValueFromPath(
		targetAttributes?.style,
		LINK_COLOR_PATH
	);
	const preserveTargetLinkColor =
		textColorChanged &&
		linkColorChange &&
		fastDeepEqual( linkColorChange.value, nextTextColor ) &&
		targetLinkColor !== undefined &&
		! fastDeepEqual( targetLinkColor, targetTextColor );
	const targetStyleChanges = preserveTargetLinkColor
		? styleChanges.filter(
				( { path } ) => ! isSamePath( path, LINK_COLOR_PATH )
		  )
		: styleChanges;

	if ( targetStyleChanges.length ) {
		const style = targetStyleChanges.reduce(
			( nextStyle, { path, value } ) =>
				setValueAtPath( nextStyle, path, value ),
			targetAttributes?.style
		);
		attributePatch.style = cleanEmptyObject( style );
	}

	const fontSizeChanged =
		hasOwn( attributeChanges, 'fontSize' ) ||
		!! getStyleChange( styleChanges, FONT_SIZE_PATH );
	const nextFontSize = getChangedAttributeStyleValue(
		targetAttributes,
		{ styleChanges, attributeChanges },
		'fontSize',
		FONT_SIZE_PATH,
		'font-size'
	);
	if ( fontSizeChanged && nextFontSize && targetAttributes?.fitText ) {
		attributePatch.fitText = undefined;
	}

	return attributePatch;
}
