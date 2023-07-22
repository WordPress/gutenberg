/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import {
	BaseControl,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import {
	useContext,
	useMemo,
	createPortal,
	Platform,
} from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import BlockList from '../components/block-list';
import useSetting from '../components/use-setting';
import InspectorControls from '../components/inspector-controls';
import useBlockDisplayInformation from '../components/use-block-display-information';
import { cleanEmptyObject } from './utils';
import { unlock } from '../lock-unlock';
import { store as blockEditorStore } from '../store';

const { CustomSelectControl } = unlock( componentsPrivateApis );

const POSITION_SUPPORT_KEY = 'position';

const OPTION_CLASSNAME =
	'block-editor-hooks__position-selection__select-control__option';

const DEFAULT_OPTION = {
	key: 'default',
	value: '',
	name: __( 'Default' ),
	className: OPTION_CLASSNAME,
};

const STICKY_OPTION = {
	key: 'sticky',
	value: 'sticky',
	name: _x( 'Sticky', 'Name for the value of the CSS position property' ),
	className: OPTION_CLASSNAME,
	__experimentalHint: __(
		'The block will stick to the top of the window instead of scrolling.'
	),
};

const FIXED_OPTION = {
	key: 'fixed',
	value: 'fixed',
	name: _x( 'Fixed', 'Name for the value of the CSS position property' ),
	className: OPTION_CLASSNAME,
	__experimentalHint: __(
		'The block will not move when the page is scrolled.'
	),
};

const POSITION_SIDES = [ 'top', 'right', 'bottom', 'left' ];
const VALID_POSITION_TYPES = [ 'sticky', 'fixed' ];

/**
 * Get calculated position CSS.
 *
 * @param {Object} props          Component props.
 * @param {string} props.selector Selector to use.
 * @param {Object} props.style    Style object.
 * @return {string} The generated CSS rules.
 */
export function getPositionCSS( { selector, style } ) {
	let output = '';

	const { type: positionType } = style?.position || {};

	if ( ! VALID_POSITION_TYPES.includes( positionType ) ) {
		return output;
	}

	output += `${ selector } {`;
	output += `position: ${ positionType };`;

	POSITION_SIDES.forEach( ( side ) => {
		if ( style?.position?.[ side ] !== undefined ) {
			output += `${ side }: ${ style.position[ side ] };`;
		}
	} );

	if ( positionType === 'sticky' || positionType === 'fixed' ) {
		// TODO: Replace hard-coded z-index value with a z-index preset approach in theme.json.
		output += `z-index: 10`;
	}
	output += `}`;

	return output;
}

/**
 * Determines if there is sticky position support.
 *
 * @param {string|Object} blockType Block name or Block Type object.
 *
 * @return {boolean} Whether there is support.
 */
export function hasStickyPositionSupport( blockType ) {
	const support = getBlockSupport( blockType, POSITION_SUPPORT_KEY );
	return !! ( true === support || support?.sticky );
}

/**
 * Determines if there is fixed position support.
 *
 * @param {string|Object} blockType Block name or Block Type object.
 *
 * @return {boolean} Whether there is support.
 */
export function hasFixedPositionSupport( blockType ) {
	const support = getBlockSupport( blockType, POSITION_SUPPORT_KEY );
	return !! ( true === support || support?.fixed );
}

/**
 * Determines if there is position support.
 *
 * @param {string|Object} blockType Block name or Block Type object.
 *
 * @return {boolean} Whether there is support.
 */
export function hasPositionSupport( blockType ) {
	const support = getBlockSupport( blockType, POSITION_SUPPORT_KEY );
	return !! support;
}

/**
 * Checks if there is a current value in the position block support attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean} Whether or not the block has a position value set.
 */
export function hasPositionValue( props ) {
	return props.attributes.style?.position?.type !== undefined;
}

/**
 * Checks if the block is currently set to a sticky or fixed position.
 * This check is helpful for determining how to position block toolbars or other elements.
 *
 * @param {Object} attributes Block attributes.
 * @return {boolean} Whether or not the block is set to a sticky or fixed position.
 */
export function hasStickyOrFixedPositionValue( attributes ) {
	const positionType = attributes.style?.position?.type;
	return positionType === 'sticky' || positionType === 'fixed';
}

/**
 * Resets the position block support attributes. This can be used when disabling
 * the position support controls for a block via a `ToolsPanel`.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetPosition( { attributes = {}, setAttributes } ) {
	const { style = {} } = attributes;

	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			position: {
				...style?.position,
				type: undefined,
				top: undefined,
				right: undefined,
				bottom: undefined,
				left: undefined,
			},
		} ),
	} );
}

/**
 * Custom hook that checks if position settings have been disabled.
 *
 * @param {string} name The name of the block.
 *
 * @return {boolean} Whether padding setting is disabled.
 */
export function useIsPositionDisabled( { name: blockName } = {} ) {
	const allowFixed = useSetting( 'position.fixed' );
	const allowSticky = useSetting( 'position.sticky' );
	const isDisabled = ! allowFixed && ! allowSticky;

	return ! hasPositionSupport( blockName ) || isDisabled;
}

/*
 * Position controls rendered in an inspector control panel.
 *
 * @param {Object} props
 *
 * @return {WPElement} Position panel.
 */
export function PositionPanel( props ) {
	const {
		attributes: { style = {} },
		clientId,
		name: blockName,
		setAttributes,
	} = props;

	const allowFixed = hasFixedPositionSupport( blockName );
	const allowSticky = hasStickyPositionSupport( blockName );
	const value = style?.position?.type;

	const { firstParentClientId } = useSelect(
		( select ) => {
			const { getBlockParents } = select( blockEditorStore );
			const parents = getBlockParents( clientId );
			return { firstParentClientId: parents[ parents.length - 1 ] };
		},
		[ clientId ]
	);

	const blockInformation = useBlockDisplayInformation( firstParentClientId );
	const stickyHelpText =
		allowSticky && value === STICKY_OPTION.value && blockInformation
			? sprintf(
					/* translators: %s: the name of the parent block. */
					__(
						'The block will stick to the scrollable area of the parent %s block.'
					),
					blockInformation.title
			  )
			: null;

	const options = useMemo( () => {
		const availableOptions = [ DEFAULT_OPTION ];
		// Display options if they are allowed, or if a block already has a valid value set.
		// This allows for a block to be switched off from a position type that is not allowed.
		if ( allowSticky || value === STICKY_OPTION.value ) {
			availableOptions.push( STICKY_OPTION );
		}
		if ( allowFixed || value === FIXED_OPTION.value ) {
			availableOptions.push( FIXED_OPTION );
		}
		return availableOptions;
	}, [ allowFixed, allowSticky, value ] );

	const onChangeType = ( next ) => {
		// For now, use a hard-coded `0px` value for the position.
		// `0px` is preferred over `0` as it can be used in `calc()` functions.
		// In the future, it could be useful to allow for an offset value.
		const placementValue = '0px';

		const newStyle = {
			...style,
			position: {
				...style?.position,
				type: next,
				top:
					next === 'sticky' || next === 'fixed'
						? placementValue
						: undefined,
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	const selectedOption = value
		? options.find( ( option ) => option.value === value ) || DEFAULT_OPTION
		: DEFAULT_OPTION;

	// Only display position controls if there is at least one option to choose from.
	return Platform.select( {
		web:
			options.length > 1 ? (
				<InspectorControls group="position">
					<BaseControl
						className="block-editor-hooks__position-selection"
						__nextHasNoMarginBottom
						help={ stickyHelpText }
					>
						<CustomSelectControl
							__nextUnconstrainedWidth
							__next36pxDefaultSize
							className="block-editor-hooks__position-selection__select-control"
							label={ __( 'Position' ) }
							hideLabelFromVision
							describedBy={ sprintf(
								// translators: %s: Currently selected position.
								__( 'Currently selected position: %s' ),
								selectedOption.name
							) }
							options={ options }
							value={ selectedOption }
							__experimentalShowSelectedHint
							onChange={ ( { selectedItem } ) => {
								onChangeType( selectedItem.value );
							} }
							size={ '__unstable-large' }
						/>
					</BaseControl>
				</InspectorControls>
			) : null,
		native: null,
	} );
}

/**
 * Override the default edit UI to include position controls.
 *
 * @param {Function} BlockEdit Original component.
 *
 * @return {Function} Wrapped component.
 */
export const withInspectorControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { name: blockName } = props;
		const positionSupport = hasBlockSupport(
			blockName,
			POSITION_SUPPORT_KEY
		);
		const showPositionControls =
			positionSupport && ! useIsPositionDisabled( props );

		return [
			showPositionControls && (
				<PositionPanel key="position" { ...props } />
			),
			<BlockEdit key="edit" { ...props } />,
		];
	},
	'withInspectorControls'
);

/**
 * Override the default block element to add the position styles.
 *
 * @param {Function} BlockListBlock Original component.
 *
 * @return {Function} Wrapped component.
 */
export const withPositionStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const { name, attributes } = props;
		const hasPositionBlockSupport = hasBlockSupport(
			name,
			POSITION_SUPPORT_KEY
		);
		const allowPositionStyles =
			hasPositionBlockSupport && ! useIsPositionDisabled( props );

		const id = useInstanceId( BlockListBlock );
		const element = useContext( BlockList.__unstableElementContext );

		// Higher specificity to override defaults in editor UI.
		const positionSelector = `.wp-container-${ id }.wp-container-${ id }`;

		// Get CSS string for the current position values.
		let css;
		if ( allowPositionStyles ) {
			css =
				getPositionCSS( {
					selector: positionSelector,
					style: attributes?.style,
				} ) || '';
		}

		// Attach a `wp-container-` id-based class name.
		const className = classnames( props?.className, {
			[ `wp-container-${ id }` ]: allowPositionStyles && !! css, // Only attach a container class if there is generated CSS to be attached.
			[ `is-position-${ attributes?.style?.position?.type }` ]:
				allowPositionStyles &&
				!! css &&
				!! attributes?.style?.position?.type,
		} );

		return (
			<>
				{ allowPositionStyles &&
					element &&
					!! css &&
					createPortal( <style>{ css }</style>, element ) }
				<BlockListBlock { ...props } className={ className } />
			</>
		);
	},
	'withPositionStyles'
);

addFilter(
	'editor.BlockListBlock',
	'core/editor/position/with-position-styles',
	withPositionStyles
);
addFilter(
	'editor.BlockEdit',
	'core/editor/position/with-inspector-controls',
	withInspectorControls
);
