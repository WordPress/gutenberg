/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { parse, serialize, createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getUniqueTemplatePartTitle, getCleanTemplatePartSlug } from './utils';
import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from '../constants';
import { unlock } from '../../lock-unlock';

const TEXT_COLOR_ATTRIBUTES = [ 'textColor', 'customTextColor' ];
const FONT_SIZE_ATTRIBUTES = [ 'fontSize', 'customFontSize' ];
const TYPOGRAPHY_ATTRIBUTES = [
	'fontStyle',
	'fontWeight',
	'lineHeight',
	'textTransform',
	'letterSpacing',
	'textDecoration',
];

const hasOwn = ( object, key ) =>
	!! object && Object.prototype.hasOwnProperty.call( object, key );

function getInheritedNavigationAttributes( attributes = {} ) {
	const inheritedAttributes = {};

	for ( const attribute of [
		...TEXT_COLOR_ATTRIBUTES,
		...FONT_SIZE_ATTRIBUTES,
		'fontFamily',
	] ) {
		if ( hasOwn( attributes, attribute ) ) {
			inheritedAttributes[ attribute ] = attributes[ attribute ];
		}
	}

	const typography = attributes.style?.typography;
	const inheritedTypography = {};
	for ( const attribute of [
		'fontFamily',
		'fontSize',
		...TYPOGRAPHY_ATTRIBUTES,
	] ) {
		if ( hasOwn( typography, attribute ) ) {
			inheritedTypography[ attribute ] = typography[ attribute ];
		}
	}

	if ( Object.keys( inheritedTypography ).length ) {
		inheritedAttributes.style = {
			typography: inheritedTypography,
		};
	}

	return inheritedAttributes;
}

function inheritNavigationBlockAttributes(
	blockAttributes = {},
	inheritedAttributes
) {
	const nextAttributes = { ...blockAttributes };

	const hasTextColor =
		TEXT_COLOR_ATTRIBUTES.some( ( attribute ) =>
			hasOwn( nextAttributes, attribute )
		) || hasOwn( nextAttributes.style?.color, 'text' );

	if ( ! hasTextColor ) {
		for ( const attribute of TEXT_COLOR_ATTRIBUTES ) {
			if ( hasOwn( inheritedAttributes, attribute ) ) {
				nextAttributes[ attribute ] = inheritedAttributes[ attribute ];
			}
		}
	}

	const hasFontSize =
		FONT_SIZE_ATTRIBUTES.some( ( attribute ) =>
			hasOwn( nextAttributes, attribute )
		) || hasOwn( nextAttributes.style?.typography, 'fontSize' );

	if ( ! hasFontSize ) {
		for ( const attribute of FONT_SIZE_ATTRIBUTES ) {
			if ( hasOwn( inheritedAttributes, attribute ) ) {
				nextAttributes[ attribute ] = inheritedAttributes[ attribute ];
			}
		}

		const inheritedTypography = inheritedAttributes.style?.typography;
		if ( hasOwn( inheritedTypography, 'fontSize' ) ) {
			nextAttributes.style = {
				...nextAttributes.style,
				typography: {
					...nextAttributes.style?.typography,
					fontSize: inheritedTypography.fontSize,
				},
			};
		}
	}

	const hasFontFamily =
		hasOwn( nextAttributes, 'fontFamily' ) ||
		hasOwn( nextAttributes.style?.typography, 'fontFamily' );

	if ( ! hasFontFamily ) {
		if ( hasOwn( inheritedAttributes, 'fontFamily' ) ) {
			nextAttributes.fontFamily = inheritedAttributes.fontFamily;
		} else if (
			hasOwn( inheritedAttributes.style?.typography, 'fontFamily' )
		) {
			nextAttributes.style = {
				...nextAttributes.style,
				typography: {
					...nextAttributes.style?.typography,
					fontFamily: inheritedAttributes.style.typography.fontFamily,
				},
			};
		}
	}

	for ( const attribute of TYPOGRAPHY_ATTRIBUTES ) {
		if (
			hasOwn( inheritedAttributes.style?.typography, attribute ) &&
			! hasOwn( nextAttributes.style?.typography, attribute )
		) {
			nextAttributes.style = {
				...nextAttributes.style,
				typography: {
					...nextAttributes.style?.typography,
					[ attribute ]:
						inheritedAttributes.style.typography[ attribute ],
				},
			};
		}
	}

	return nextAttributes;
}

function inheritNavigationStyles( blocks, inheritedAttributes ) {
	if ( ! Object.keys( inheritedAttributes ).length ) {
		return blocks;
	}

	return blocks.map( ( block ) => ( {
		...block,
		attributes:
			block.name === 'core/navigation'
				? inheritNavigationBlockAttributes(
						block.attributes,
						inheritedAttributes
				  )
				: block.attributes,
		innerBlocks: block.innerBlocks
			? inheritNavigationStyles( block.innerBlocks, inheritedAttributes )
			: block.innerBlocks,
	} ) );
}

/**
 * Hook to create a new overlay template part.
 *
 * @param {Array}  overlayTemplateParts Array of existing overlay template parts.
 * @param {Object} navigationAttributes Parent Navigation block attributes.
 * @return {Function} Function that creates a new overlay template part.
 */
export default function useCreateOverlayTemplatePart(
	overlayTemplateParts,
	navigationAttributes = {}
) {
	const { saveEntityRecord } = useDispatch( coreStore );
	const pattern = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).getPatternBySlug(
				'core/navigation-overlay'
			),
		[]
	);

	const createOverlayTemplatePart = useCallback( async () => {
		// Generate unique name using only overlay area template parts
		// Filter to only include template parts with titles for uniqueness check
		const templatePartsWithTitles = overlayTemplateParts.filter(
			( templatePart ) => templatePart.title?.rendered
		);
		const uniqueTitle = getUniqueTemplatePartTitle(
			__( 'Navigation Overlay' ),
			templatePartsWithTitles
		);
		const cleanSlug = getCleanTemplatePartSlug( uniqueTitle );

		let initialContent = '';

		if ( pattern?.content ) {
			// Parse the pattern content into blocks and serialize it
			const blocks = parse( pattern.content, {
				__unstableSkipMigrationLogs: true,
			} );
			initialContent = serialize(
				inheritNavigationStyles(
					blocks,
					getInheritedNavigationAttributes( navigationAttributes )
				)
			);
		} else {
			// Fallback to empty paragraph if pattern is not found
			initialContent = serialize( [ createBlock( 'core/paragraph' ) ] );
		}

		// Create the template part
		const templatePart = await saveEntityRecord(
			'postType',
			'wp_template_part',
			{
				slug: cleanSlug,
				title: uniqueTitle,
				content: initialContent,
				area: NAVIGATION_OVERLAY_TEMPLATE_PART_AREA,
			},
			{ throwOnError: true }
		);

		return templatePart;
	}, [
		overlayTemplateParts,
		saveEntityRecord,
		pattern,
		navigationAttributes,
	] );

	return createOverlayTemplatePart;
}
