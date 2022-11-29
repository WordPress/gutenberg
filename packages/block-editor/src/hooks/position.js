/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { useContext, createPortal, Platform } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import BlockList from '../components/block-list';
import useSetting from '../components/use-setting';
import InspectorControls from '../components/inspector-controls';
import { cleanEmptyObject } from './utils';

const POSITION_SUPPORT_KEY = 'position';

const POSITION_OPTIONS = [
	{
		key: 'default',
		label: __( 'Default' ),
		value: '',
		name: __( 'Default' ),
	},
	{
		key: 'sticky',
		label: __( 'Sticky' ),
		value: 'sticky',
		name: __( 'Sticky' ),
	},
];

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
		// TODO: Work out where to put the magic z-index value.
		output += `z-index: 10`;
	}
	output += `}`;

	return output;
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
 * @return {boolean}     Whether or not the block has a position value set.
 */
export function hasPositionValue( props ) {
	return props.attributes.style?.position?.type !== undefined;
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

/**
 * Inspector control panel containing the padding related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Padding edit element.
 */
export function PositionEdit( props ) {
	const {
		attributes: { style = {} },
		setAttributes,
	} = props;

	if ( useIsPositionDisabled( props ) ) {
		return null;
	}

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

	return Platform.select( {
		web: (
			<>
				<ToggleGroupControl
					label={ __( 'Position' ) }
					help={ __(
						'Stick this block to the top of its container. It will scroll with the page.'
					) }
					value={ style?.position?.type || '' }
					onChange={ ( newValue ) => {
						onChangeType( newValue );
					} }
					isBlock
				>
					{ POSITION_OPTIONS.map( ( option ) => (
						<ToggleGroupControlOption
							key={ option.key }
							value={ option.value }
							label={ option.label }
							aria-label={ option.name }
							showTooltip={ true }
						/>
					) ) }
				</ToggleGroupControl>
			</>
		),
		native: null,
	} );
}

/**
 * Override the default edit UI to include layout controls
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

		return [
			positionSupport && (
				<InspectorControls
					__experimentalGroup="advanced"
					key="position"
				>
					<PositionEdit { ...props } />
				</InspectorControls>
			),
			<BlockEdit key="edit" { ...props } />,
		];
	},
	'withInspectorControls'
);

/**
 * Override the default block element to add the layout styles.
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

		const id = useInstanceId( BlockListBlock );
		const element = useContext( BlockList.__unstableElementContext );

		// Higher specificity to override defaults in editor UI.
		const positionSelector = `.wp-container-position-${ id }.wp-container-position-${ id }`;

		// Get CSS string for the current position values.
		let css;
		if ( hasPositionBlockSupport ) {
			css =
				getPositionCSS( {
					selector: positionSelector,
					style: attributes?.style,
				} ) || '';
		}

		// Attach a `wp-container-` id-based class name.
		const className = classnames( props?.className, {
			[ `wp-container-position-${ id }` ]:
				hasPositionBlockSupport && !! css, // Only attach a container class if there is generated CSS to be attached.
		} );

		return (
			<>
				{ hasPositionBlockSupport &&
					element &&
					!! css &&
					createPortal( <style>{ css }</style>, element ) }
				<BlockListBlock { ...props } className={ className } />
			</>
		);
	}
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
