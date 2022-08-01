/**
 * External dependencies
 */
import classnames from 'classnames';
import { extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

/**
 * WordPress dependencies
 */
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { useMemo, useContext, createPortal } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import {
	BlockControls,
	__experimentalDuotoneControl as DuotoneControl,
	useSetting,
} from '../components';
import BlockList from '../components/block-list';
import {
	__unstableDuotoneFilter as DuotoneFilter,
	__unstableDuotoneStylesheet as DuotoneStylesheet,
	__unstableDuotoneUnsetStylesheet as DuotoneUnsetStylesheet,
} from '../components/duotone';
import { store as blockEditorStore } from '../store';

const EMPTY_ARRAY = [];

extend( [ namesPlugin ] );

/**
 * SVG and stylesheet needed for rendering the duotone filter.
 *
 * @param {Object}           props          Duotone props.
 * @param {string}           props.selector Selector to apply the filter to.
 * @param {string}           props.id       Unique id for this duotone filter.
 * @param {string[]|"unset"} props.colors   Array of RGB color strings ordered from dark to light.
 *
 * @return {WPElement} Duotone element.
 */
function InlineDuotone( { selector, id, colors } ) {
	if ( colors === 'unset' ) {
		return <DuotoneUnsetStylesheet selector={ selector } />;
	}

	return (
		<>
			<DuotoneFilter id={ id } colors={ colors } />
			<DuotoneStylesheet id={ id } selector={ selector } />
		</>
	);
}

function useMultiOriginPresets( { presetSetting, defaultSetting } ) {
	const disableDefault = ! useSetting( defaultSetting );
	const userPresets =
		useSetting( `${ presetSetting }.custom` ) || EMPTY_ARRAY;
	const themePresets =
		useSetting( `${ presetSetting }.theme` ) || EMPTY_ARRAY;
	const defaultPresets =
		useSetting( `${ presetSetting }.default` ) || EMPTY_ARRAY;
	return useMemo(
		() => [
			...userPresets,
			...themePresets,
			...( disableDefault ? EMPTY_ARRAY : defaultPresets ),
		],
		[ disableDefault, userPresets, themePresets, defaultPresets ]
	);
}

function DuotonePanel( { attributes, setAttributes } ) {
	const style = attributes?.style;
	const duotone = style?.color?.duotone;

	const duotonePalette = useMultiOriginPresets( {
		presetSetting: 'color.duotone',
		defaultSetting: 'color.defaultDuotone',
	} );
	const colorPalette = useMultiOriginPresets( {
		presetSetting: 'color.palette',
		defaultSetting: 'color.defaultPalette',
	} );
	const disableCustomColors = ! useSetting( 'color.custom' );
	const disableCustomDuotone =
		! useSetting( 'color.customDuotone' ) ||
		( colorPalette?.length === 0 && disableCustomColors );

	if ( duotonePalette?.length === 0 && disableCustomDuotone ) {
		return null;
	}

	return (
		<BlockControls group="block" __experimentalShareWithChildBlocks>
			<DuotoneControl
				duotonePalette={ duotonePalette }
				colorPalette={ colorPalette }
				disableCustomDuotone={ disableCustomDuotone }
				disableCustomColors={ disableCustomColors }
				value={ duotone }
				onChange={ ( newDuotone ) => {
					const newStyle = {
						...style,
						color: {
							...style?.color,
							duotone: newDuotone,
						},
					};
					setAttributes( { style: newStyle } );
				} }
			/>
		</BlockControls>
	);
}

/**
 * Filters registered block settings, extending attributes to include
 * the `duotone` attribute.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addDuotoneAttributes( settings ) {
	const hasDuotoneSupport = hasBlockSupport( settings, 'filter.duotone' );

	const hasDeprecatedExperimentalDuotoneSupport = hasBlockSupport(
		settings,
		'color.__experimentalDuotone'
	);

	const shouldAddAttributes =
		hasDuotoneSupport || hasDeprecatedExperimentalDuotoneSupport;

	// Allow blocks to specify their own attribute definition with default
	// values if needed.
	if ( ! settings.attributes.style && shouldAddAttributes ) {
		Object.assign( settings.attributes, {
			style: {
				type: 'object',
			},
		} );
	}

	return settings;
}

/**
 * Override the default edit UI to include toolbar controls for duotone if the
 * block supports duotone.
 *
 * @param {Function} BlockEdit Original component.
 *
 * @return {Function} Wrapped component.
 */
const withDuotoneControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const hasDuotoneSupport = hasBlockSupport(
			props.name,
			'filter.duotone'
		);

		const hasDeprecatedExperimentalDuotoneSupport = hasBlockSupport(
			props.name,
			'color.__experimentalDuotone'
		);
		const isContentLocked = useSelect(
			( select ) => {
				return select(
					blockEditorStore
				).__unstableGetContentLockingParent( props.clientId );
			},
			[ props.clientId ]
		);

		const shouldShowPanel =
			( hasDuotoneSupport || hasDeprecatedExperimentalDuotoneSupport ) &&
			! isContentLocked;

		return (
			<>
				<BlockEdit { ...props } />
				{ shouldShowPanel && <DuotonePanel { ...props } /> }
			</>
		);
	},
	'withDuotoneControls'
);

function setInlineFilter( wrapperProps, value ) {
	return {
		...wrapperProps,
		style: {
			'--wp--style--filter': value,
			...wrapperProps?.style,
		},
	};
}

function DuotoneStyles( { BlockListBlock, ...props } ) {
	const colors = props?.attributes?.style?.color?.duotone;
	const id = `wp-duotone-${ useInstanceId( BlockListBlock ) }`;
	const element = useContext( BlockList.__unstableElementContext );

	if ( ! colors ) {
		return <BlockListBlock { ...props } />;
	}

	if ( 'unset' === colors ) {
		const wrapperProps = setInlineFilter( props.wrapperProps, 'unset' );
		return <BlockListBlock { ...props } wrapperProps={ wrapperProps } />;
	}

	const wrapperProps = setInlineFilter(
		props.wrapperProps,
		`url( #${ id } )`
	);

	return (
		<>
			{ element &&
				createPortal(
					<DuotoneFilter id={ id } colors={ colors } />,
					element
				) }
			<BlockListBlock { ...props } wrapperProps={ wrapperProps } />
		</>
	);
}

/**
 * Function that scopes a selector with another one. This works a bit like
 * SCSS nesting except the `&` operator isn't supported.
 *
 * @example
 * ```js
 * const scope = '.a, .b .c';
 * const selector = '> .x, .y';
 * const merged = scopeSelector( scope, selector );
 * // merged is '.a > .x, .a .y, .b .c > .x, .b .c .y'
 * ```
 *
 * @param {string} scope    Selector to scope to.
 * @param {string} selector Original selector.
 *
 * @return {string} Scoped selector.
 */
function scopeSelector( scope, selector ) {
	const scopes = scope.split( ',' );
	const selectors = selector.split( ',' );

	const selectorsScoped = [];
	scopes.forEach( ( outer ) => {
		selectors.forEach( ( inner ) => {
			selectorsScoped.push( `${ outer.trim() } ${ inner.trim() }` );
		} );
	} );

	return selectorsScoped.join( ', ' );
}

function DeprecatedExperimentalDuotoneStyles( {
	BlockListBlock,
	deprecatedExperimentalDuotoneSupport,
	...props
} ) {
	deprecated( 'color.__experimentalDuotone selector block supports', {
		since: '6.1',
		alternative: 'filter.duotone block supports',
		link: 'TODO',
	} );

	const colors = props?.attributes?.style?.color?.duotone;

	const id = `wp-duotone-${ useInstanceId( BlockListBlock ) }`;

	// Extra .editor-styles-wrapper specificity is needed in the editor
	// since we're not using inline styles to apply the filter. We need to
	// override duotone applied by global styles and theme.json.
	const selectorsGroup = scopeSelector(
		`.editor-styles-wrapper .${ id }`,
		deprecatedExperimentalDuotoneSupport
	);

	const className = classnames( props?.className, id );

	const element = useContext( BlockList.__unstableElementContext );

	return (
		<>
			{ element &&
				createPortal(
					<InlineDuotone
						selector={ selectorsGroup }
						id={ id }
						colors={ colors }
					/>,
					element
				) }
			<BlockListBlock { ...props } className={ className } />
		</>
	);
}

/**
 * Override the default block element to include duotone styles.
 *
 * @param {Function} BlockListBlock Original component.
 *
 * @return {Function} Wrapped component.
 */
const withDuotoneStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const duotoneSupport = getBlockSupport( props.name, 'filter.duotone' );
		if ( duotoneSupport ) {
			return (
				<DuotoneStyles BlockListBlock={ BlockListBlock } { ...props } />
			);
		}

		const deprecatedExperimentalDuotoneSupport = getBlockSupport(
			props.name,
			'color.__experimentalDuotone'
		);
		if ( deprecatedExperimentalDuotoneSupport ) {
			return (
				<DeprecatedExperimentalDuotoneStyles
					BlockListBlock={ BlockListBlock }
					deprecatedExperimentalDuotoneSupport={
						deprecatedExperimentalDuotoneSupport
					}
					{ ...props }
				/>
			);
		}

		return <BlockListBlock { ...props } />;
	},
	'withDuotoneStyles'
);

addFilter(
	'blocks.registerBlockType',
	'core/editor/duotone/add-attributes',
	addDuotoneAttributes
);
addFilter(
	'editor.BlockEdit',
	'core/editor/duotone/with-editor-controls',
	withDuotoneControls
);
addFilter(
	'editor.BlockListBlock',
	'core/editor/duotone/with-styles',
	withDuotoneStyles
);
