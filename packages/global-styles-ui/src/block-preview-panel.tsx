/**
 * WordPress dependencies
 */
// @ts-expect-error: Not typed yet.
import { BlockPreview } from '@wordpress/block-editor';
import { getBlockType, getBlockFromExample } from '@wordpress/blocks';
import { __experimentalSpacer as Spacer } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import {
	getViewportBreakpoints,
	__unstableGeneratePreviewStateStyles as generatePreviewStateStyles,
} from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { getVariationClassName } from './utils';

interface BlockPreviewPanelProps {
	name: string;
	variation?: string;
	selectedViewport?: string;
	selectedState?: string;
	stateStyles?: any;
	viewportSettings?: {
		mobile?: string;
		tablet?: string;
	};
}

const DEFAULT_PREVIEW_WIDTH_BY_VIEWPORT: Record< string, number > = {
	default: 783,
	'@tablet': 600,
	'@mobile': 480,
};

// We assume a default font size of 16px when calculating preview widths.
const DEFAULT_FONT_SIZE = 16;

function getPixelValue( value: string ) {
	const match = value.match( /^(\d+|\d*\.\d+)(px|em|rem)$/ );
	if ( ! match ) {
		return undefined;
	}

	const numericValue = Number.parseFloat( match[ 1 ] );
	const unit = match[ 2 ];

	return unit === 'px' ? numericValue : numericValue * DEFAULT_FONT_SIZE;
}

function getPreviewWidthByViewport(
	selectedViewport: string,
	viewportSettings: BlockPreviewPanelProps[ 'viewportSettings' ]
) {
	const breakpoints = getViewportBreakpoints( viewportSettings );
	const mobileWidth = getPixelValue( breakpoints.mobile );

	if ( selectedViewport === 'mobile' && mobileWidth ) {
		return mobileWidth;
	}

	const tabletWidth = getPixelValue( breakpoints.tablet );

	if ( selectedViewport === 'tablet' && mobileWidth && tabletWidth ) {
		if (
			breakpoints.mobile === '480px' &&
			breakpoints.tablet === '782px'
		) {
			return DEFAULT_PREVIEW_WIDTH_BY_VIEWPORT.tablet;
		}
		return Math.round( ( mobileWidth + tabletWidth ) / 2 );
	}

	if ( selectedViewport === 'default' && tabletWidth ) {
		return tabletWidth + 1;
	}

	return DEFAULT_PREVIEW_WIDTH_BY_VIEWPORT[ selectedViewport ];
}

const BlockPreviewPanel = ( {
	name,
	variation = '',
	selectedViewport = 'default',
	selectedState = 'default',
	stateStyles,
	viewportSettings,
}: BlockPreviewPanelProps ) => {
	const blockExample = getBlockType( name )?.example;
	const blocks = useMemo( () => {
		if ( ! blockExample ) {
			return null;
		}

		const example = {
			...blockExample,
			attributes: {
				...blockExample.attributes,
				style: undefined,
				className: variation
					? getVariationClassName( variation )
					: blockExample.attributes?.className,
			},
		};

		return getBlockFromExample( name, example );
	}, [ name, blockExample, variation ] );

	// Generate CSS for the selected state.
	const stateCSS = useMemo( () => {
		if ( selectedState === 'default' || ! stateStyles ) {
			return '';
		}

		return generatePreviewStateStyles( stateStyles, name );
	}, [ selectedState, stateStyles, name ] );

	if ( ! blockExample ) {
		return null;
	}

	const viewportWidth =
		getPreviewWidthByViewport( selectedViewport, viewportSettings ) ??
		blockExample.viewportWidth ??
		500;
	const normalizedViewportWidth = blockExample.viewportWidth ?? 500;
	const previewScale = Math.max( viewportWidth / normalizedViewportWidth, 1 );
	const previewPadding = 24 * previewScale;
	// Same as height of InserterPreviewPanel.
	const previewHeight = 144;
	const sidebarWidth = 235;
	const scale = sidebarWidth / viewportWidth;
	const minHeight =
		scale !== 0 && scale < 1 && previewHeight
			? previewHeight / scale
			: previewHeight;

	return (
		<Spacer marginX={ 4 } marginBottom={ 4 }>
			<div
				className="global-styles-ui__block-preview-panel"
				style={ { maxHeight: previewHeight, boxSizing: 'initial' } }
			>
				<BlockPreview
					blocks={ blocks }
					viewportWidth={ viewportWidth }
					minHeight={ previewHeight }
					additionalStyles={
						//We want this CSS to be in sync with the one in InserterPreviewPanel.
						[
							{
								css: `
								body{
									padding: ${ previewPadding }px;
									min-height:${ Math.round( minHeight ) }px;
									display:flex;
								}
								.is-root-container {
									width: ${ 100 / previewScale }%;
									transform: scale(${ previewScale });
									transform-origin: top left;
								}
								${ stateCSS }
							`,
							},
						]
					}
				/>
			</div>
		</Spacer>
	);
};

export default BlockPreviewPanel;
