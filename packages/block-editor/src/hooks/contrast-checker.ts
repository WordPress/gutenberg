import { useEffect, useLayoutEffect, useReducer } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { getBlockSelector } from '@wordpress/global-styles-engine';
import { speak } from '@wordpress/a11y';
import { colord } from 'colord';
import { getContrastWarning } from '../components/contrast-checker';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';
import {
	getGradientStopColors,
	getLowestContrastColor,
} from './contrast-checker-utils';
import type {
	BlockElementColors,
	UseBlockColorContrastWarningOptions,
} from './types';

function getComputedValue( node: Element, property: string ) {
	// A rendered block element has a window.
	return node.ownerDocument
		.defaultView!.getComputedStyle( node )
		.getPropertyValue( property );
}

/**
 * Returns the color the reader sees for an element's text. A transparent fill
 * shows the background of the nearest element clipping its background to the
 * text, which for a gradient is its lowest contrast stop against the backdrop.
 * Returns `undefined` when that can't be measured, such as for an image.
 *
 * @param element  Element holding the text.
 * @param backdrop Color behind the text.
 * @return The visible text color, if it can be measured.
 */
function getVisibleTextColor(
	element: Element,
	backdrop: string
): string | undefined {
	const fill = getComputedValue( element, '-webkit-text-fill-color' );
	// Without the property, as in jsdom, the fill is the text color.
	if ( ! colord( fill ).isValid() ) {
		return getComputedValue( element, 'color' );
	}
	if ( colord( fill ).alpha() > 0 ) {
		return fill;
	}

	let clipElement: Element | null = element;
	while (
		clipElement &&
		'text' !== getComputedValue( clipElement, 'background-clip' )
	) {
		clipElement = clipElement.parentElement;
	}
	// Nothing shows through, so report the fill for the transparency warning.
	if ( ! clipElement ) {
		return fill;
	}

	const backgroundImage = getComputedValue( clipElement, 'background-image' );
	if ( 'none' === backgroundImage ) {
		return getComputedValue( clipElement, 'background-color' );
	}
	const stops = getGradientStopColors( backgroundImage );
	return stops ? getLowestContrastColor( stops, backdrop ) : undefined;
}

export function getBlockElementColors(
	blockEl: Element | null,
	blockType: BlockType | null | undefined
): BlockElementColors {
	if ( ! blockEl || ! blockType ) {
		return {};
	}

	// Get color-specific selectors.
	const textSelector = getBlockSelector( blockType, 'color.text', {
		fallback: true,
	} );
	const backgroundSelector = getBlockSelector(
		blockType,
		'color.background',
		{ fallback: true }
	);

	// Find target elements - querySelector handles all the complexity
	// The `fallback` option always returns a selector.
	const textElement = blockEl.querySelector( textSelector! ) || blockEl;
	const backgroundElement =
		blockEl.querySelector( backgroundSelector! ) || blockEl;
	const linkElement = blockEl.querySelector( 'a' );

	// A background clipped to the text paints the box only through the
	// glyphs, so the backdrop is the nearest background that isn't clipped.
	let backgroundColorNode: Element | null = backgroundElement;
	let backgroundColor = 'rgba(0, 0, 0, 0)';
	while ( backgroundColorNode ) {
		backgroundColor = getComputedValue(
			backgroundColorNode,
			'background-color'
		);
		if (
			backgroundColor !== 'rgba(0, 0, 0, 0)' &&
			'text' !==
				getComputedValue( backgroundColorNode, 'background-clip' )
		) {
			break;
		}
		backgroundColorNode = backgroundColorNode.parentElement;
	}
	if ( ! backgroundColorNode ) {
		backgroundColor = 'rgba(0, 0, 0, 0)';
	}

	const textColor = getVisibleTextColor( textElement, backgroundColor );
	const linkColor =
		linkElement && linkElement.textContent
			? getVisibleTextColor( linkElement, backgroundColor )
			: undefined;

	return {
		textColor,
		backgroundColor,
		linkColor,
	};
}

/**
 * Computes the rendered font size in pixels for the block element whose
 * foreground color is evaluated by contrast checking.
 *
 * @param blockEl                Rendered block element.
 * @param blockType              Block type definition.
 * @param options                Evaluation options matching the contrast check.
 * @param options.checkTextColor Whether block text contrast is evaluated.
 * @param options.checkLinkColor Whether link contrast is evaluated.
 * @return Computed font size in pixels, if measurable.
 */
export function getBlockElementFontSize(
	blockEl: Element | null,
	blockType: BlockType | null | undefined,
	{
		checkTextColor = true,
		checkLinkColor = true,
	}: Pick<
		UseBlockColorContrastWarningOptions,
		'checkTextColor' | 'checkLinkColor'
	> = {}
): number | undefined {
	if ( ! blockEl || ! blockType ) {
		return undefined;
	}

	let targetElement: Element | null = null;
	if ( ! checkTextColor && checkLinkColor ) {
		const linkElement = blockEl.querySelector( 'a' );
		if ( linkElement && linkElement.textContent ) {
			targetElement = linkElement;
		}
	}

	if ( ! targetElement ) {
		const candidates = [
			getBlockSelector( blockType, 'typography.fontSize' ),
			getBlockSelector( blockType, 'typography.root' ),
			getBlockSelector( blockType, 'typography' ),
			getBlockSelector( blockType, 'color.text', {
				fallback: true,
			} ),
		];
		const fontSizeSelector = candidates.find(
			( selector ): selector is string =>
				typeof selector === 'string' && selector.length > 0
		);
		targetElement =
			( fontSizeSelector && blockEl.querySelector( fontSizeSelector ) ) ||
			blockEl;
	}

	const fontSize = Number.parseFloat(
		getComputedValue( targetElement, 'font-size' )
	);
	return Number.isFinite( fontSize ) ? fontSize : undefined;
}

interface ContrastMeasurements extends BlockElementColors {
	fontSize?: number;
}

const MEASUREMENT_KEYS = [
	'textColor',
	'backgroundColor',
	'linkColor',
	'fontSize',
] as const;

function getBlockContrastMeasurements(
	blockEl: Element | null,
	blockType: BlockType | null | undefined,
	checkTextColor: boolean,
	checkLinkColor: boolean
): ContrastMeasurements {
	return {
		...getBlockElementColors( blockEl, blockType ),
		fontSize: getBlockElementFontSize( blockEl, blockType, {
			checkTextColor,
			checkLinkColor,
		} ),
	};
}

function reducer(
	prevState: ContrastMeasurements,
	newState: ContrastMeasurements
): ContrastMeasurements {
	const hasChanged = MEASUREMENT_KEYS.some(
		( key ) => prevState[ key ] !== newState[ key ]
	);

	// Do not re-render if the measurements have not changed.
	return hasChanged ? newState : prevState;
}

/**
 * Returns a contrast warning message for a block's computed colors, or
 * `undefined` when contrast is sufficient or checking is disabled.
 *
 * Colors are read from the rendered block element so that inherited values
 * (e.g. from Global Styles or ancestor blocks) are taken into account.
 *
 * @param props                 Hook options.
 * @param props.clientId        Block client ID.
 * @param props.name            Block name.
 * @param props.enabled         Whether contrast checking is active.
 * @param props.checkTextColor  Whether to evaluate the text/background pair.
 * @param props.checkLinkColor  Whether to evaluate the link/background pair.
 * @param props.messageOverride Caller-provided copy used in place of the generic guidance.
 *
 * @return The warning message, if any.
 */
export default function useBlockColorContrastWarning( {
	clientId,
	name,
	enabled = true,
	checkTextColor = true,
	checkLinkColor = true,
	messageOverride,
}: UseBlockColorContrastWarningOptions ) {
	const blockEl = useBlockElement( clientId );
	const [ measurements, setMeasurements ] = useReducer( reducer, {} );

	const blockType = useSelect(
		( select ) => {
			return name && enabled
				? select( blocksStore ).getBlockType( name )
				: undefined;
		},
		[ name, enabled ]
	);

	// There are so many things that can change the color of a block
	// So we perform this check on every render.
	useLayoutEffect( () => {
		if ( ! enabled || ! blockEl || ! blockType ) {
			return;
		}

		// Combine `useLayoutEffect` and two rAF calls to ensure that values are read
		// after the current paint but before the next paint.
		window.requestAnimationFrame( () =>
			window.requestAnimationFrame( () =>
				setMeasurements(
					getBlockContrastMeasurements(
						blockEl,
						blockType,
						checkTextColor,
						checkLinkColor
					)
				)
			)
		);
	} );

	// Runs in its own effect with dependencies so the observer is only
	// recreated when the block element or block type changes.
	useLayoutEffect( () => {
		if ( ! enabled || ! blockEl || ! blockType ) {
			return;
		}

		const observer = new window.MutationObserver( () => {
			setMeasurements(
				getBlockContrastMeasurements(
					blockEl,
					blockType,
					checkTextColor,
					checkLinkColor
				)
			);
		} );

		observer.observe( blockEl, {
			attributes: true,
			attributeFilter: [ 'class', 'style' ],
			subtree: true,
		} );

		return () => {
			observer.disconnect();
		};
	}, [ enabled, blockEl, blockType, checkTextColor, checkLinkColor ] );

	const warning = enabled
		? getContrastWarning( {
				backgroundColor: measurements.backgroundColor,
				textColor: checkTextColor ? measurements.textColor : undefined,
				linkColor: checkLinkColor ? measurements.linkColor : undefined,
				fontSize: measurements.fontSize,
				messageOverride,
				enableAlphaChecker: true,
			} )
		: null;

	// The popover Notice that displays this warning is muted
	// (`spokenMessage={ null }`), so this hook is the single source of the
	// spoken announcement. Announce only when the warning message itself
	// appears or changes; keying off `speakMessage` rather than the raw
	// computed `colors` avoids re-announcing the same warning when colors
	// recompute without changing the outcome.
	const speakMessage = warning?.speakMessage;
	useEffect( () => {
		if ( speakMessage ) {
			speak( speakMessage );
		}
	}, [ speakMessage ] );

	return warning?.message;
}
