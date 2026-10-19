/**
 * External dependencies
 */
import { extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { BaseControl, ColorPalette, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../components';
import { cleanEmptyObject, usePrivateStyleOverride } from './utils';
import { useBlockEditingMode } from '../components/block-editing-mode';

extend( [ namesPlugin ] );

const DEFAULT_COLORS = [ '#000000', '#808080', '#ffffff' ];
const STOP_LABELS = [ __( 'Shadow' ), __( 'Midtone' ), __( 'Highlight' ) ];

// ----------------------------------------------------------------------------
// SVG filter — three-stop colour mapping. Mirrors the duotone primitive with
// one extra entry in `tableValues` per channel. Identical math otherwise.
// ----------------------------------------------------------------------------

function hexToRgb( hex ) {
	const h = hex.replace( '#', '' );
	return [
		parseInt( h.slice( 0, 2 ), 16 ) / 255,
		parseInt( h.slice( 2, 4 ), 16 ) / 255,
		parseInt( h.slice( 4, 6 ), 16 ) / 255,
	];
}

function getTritoneFilter( id, colors ) {
	const [ shadow, midtone, highlight ] = colors;
	const [ sr, sg, sb ] = hexToRgb( shadow );
	const [ mr, mg, mb ] = hexToRgb( midtone );
	const [ hr, hg, hb ] = hexToRgb( highlight );
	const f = ( v ) => v.toFixed( 5 );

	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 0 0" width="0" height="0" focusable="false" role="none" style="visibility: hidden; position: absolute; left: -9999px; overflow: hidden;" aria-hidden="true">` +
		`<defs>` +
		`<filter id="${ id }">` +
		`<feColorMatrix type="saturate" values="0" result="gray" />` +
		`<feComponentTransfer in="gray" color-interpolation-filters="sRGB">` +
		`<feFuncR type="table" tableValues="${ f( sr ) } ${ f( mr ) } ${ f(
			hr
		) }" />` +
		`<feFuncG type="table" tableValues="${ f( sg ) } ${ f( mg ) } ${ f(
			hg
		) }" />` +
		`<feFuncB type="table" tableValues="${ f( sb ) } ${ f( mb ) } ${ f(
			hb
		) }" />` +
		`</feComponentTransfer>` +
		`</filter>` +
		`</defs>` +
		`</svg>`
	);
}

function getTritoneStylesheet( selector, filterId ) {
	return `${ selector }{filter:url(#${ filterId })}`;
}

// ----------------------------------------------------------------------------
// Editor UI — minimal sidebar panel for the draft. Toolbar control + preset
// integration are intentionally deferred (see PR description) so reviewers
// can shape that surface together.
// ----------------------------------------------------------------------------

function TritonePanelPure( { style, setAttributes } ) {
	const tritone = style?.color?.tritone;
	const blockEditingMode = useBlockEditingMode();

	if ( blockEditingMode !== 'default' ) {
		return null;
	}

	const colors = Array.isArray( tritone ) ? tritone : DEFAULT_COLORS;

	const setStop = ( index, color ) => {
		const next = [ ...colors ];
		next[ index ] = color || DEFAULT_COLORS[ index ];
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				color: {
					...style?.color,
					tritone: next,
					// Mutual exclusion — duotone and tritone are two mappings
					// of the same image channel and must not stack.
					duotone: undefined,
				},
			} ),
		} );
	};

	const clear = () => {
		setAttributes( {
			style: cleanEmptyObject( {
				...style,
				color: {
					...style?.color,
					tritone: undefined,
				},
			} ),
		} );
	};

	return (
		<InspectorControls group="filter">
			<PanelBody title={ __( 'Tritone' ) } initialOpen={ false }>
				{ STOP_LABELS.map( ( label, i ) => (
					<BaseControl key={ label } __nextHasNoMarginBottom>
						<BaseControl.VisualLabel>
							{ label }
						</BaseControl.VisualLabel>
						<ColorPalette
							value={ colors[ i ] }
							clearable={ false }
							onChange={ ( c ) => setStop( i, c ) }
						/>
					</BaseControl>
				) ) }
				{ Array.isArray( tritone ) && (
					<button
						type="button"
						className="components-button is-tertiary"
						onClick={ clear }
					>
						{ __( 'Clear tritone' ) }
					</button>
				) }
			</PanelBody>
		</InspectorControls>
	);
}

// ----------------------------------------------------------------------------
// Block-edit extension contract — mirrors duotone's default export.
// ----------------------------------------------------------------------------

// Re-use the duotone instance-id reference space; tritone applies to the same
// block surface and a shared key keeps the class-name prefix stable.
const TRITONE_BLOCK_PROPS_REFERENCE = {};

function useBlockProps( { style } ) {
	const id = useInstanceId( TRITONE_BLOCK_PROPS_REFERENCE );
	const filterClass = `wp-tritone-${ id }`;

	const colors = style?.color?.tritone;
	const isValid = Array.isArray( colors ) && colors.length === 3;
	const selector = isValid ? `.${ filterClass }` : null;

	usePrivateStyleOverride(
		isValid
			? {
					css: getTritoneStylesheet( selector, filterClass ),
					__unstableType: 'presets',
			  }
			: undefined
	);

	usePrivateStyleOverride(
		isValid
			? {
					assets: getTritoneFilter( filterClass, colors ),
					__unstableType: 'svgs',
			  }
			: undefined
	);

	return {
		className: isValid ? filterClass : '',
	};
}

export default {
	shareWithChildBlocks: true,
	edit: TritonePanelPure,
	useBlockProps,
	attributeKeys: [ 'style' ],
	hasSupport( name ) {
		// Re-use the existing duotone block-support flag. Tritone applies to
		// the same set of blocks (Image, Cover, Site Logo, Featured Image,
		// Avatar). A dedicated `filter.tritone` flag can land in a follow-up
		// if maintainers prefer finer-grained opt-in.
		return hasBlockSupport( name, 'filter.duotone' );
	},
};

// ----------------------------------------------------------------------------
// Attribute extension — ensures blocks that opt into duotone also receive the
// `style` attribute that tritone reads/writes against.
// ----------------------------------------------------------------------------

function addTritoneAttributes( settings ) {
	if ( ! hasBlockSupport( settings, 'filter.duotone' ) ) {
		return settings;
	}
	if ( ! settings.attributes.style ) {
		Object.assign( settings.attributes, {
			style: { type: 'object' },
		} );
	}
	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/editor/tritone/add-attributes',
	addTritoneAttributes
);
