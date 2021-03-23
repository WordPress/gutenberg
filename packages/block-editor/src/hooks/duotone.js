/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	getBlockDefaultClassName,
	getBlockSupport,
	hasBlockSupport,
} from '@wordpress/blocks';
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import {
	BlockControls,
	__experimentalDuotoneToolbar as DuotoneToolbar,
	__experimentalDuotoneFilter as DuotoneFilter,
	__experimentalUseEditorFeature as useEditorFeature,
} from '../components';

function DuotonePanel( { attributes, setAttributes } ) {
	const style = attributes?.style;
	const duotone = style?.color?.duotone;

	const duotonePalette = useEditorFeature( 'color.duotone' );
	const colorPalette = useEditorFeature( 'color.palette' );

	return (
		<BlockControls group="block">
			<DuotoneToolbar
				duotonePalette={ duotonePalette }
				colorPalette={ colorPalette }
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
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
function addDuotoneAttributes( settings ) {
	if ( ! hasBlockSupport( settings, 'color.duotone' ) ) {
		return settings;
	}

	// Allow blocks to specify their own attribute definition with default
	// values if needed.
	if ( ! settings.attributes.style ) {
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
 * @param  {Function} BlockEdit Original component
 * @return {Function}           Wrapped component
 */
const withDuotoneToolbarControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const hasDuotoneSupport = hasBlockSupport(
			props.name,
			'color.duotone'
		);

		return (
			<>
				<BlockEdit { ...props } />
				{ hasDuotoneSupport && <DuotonePanel { ...props } /> }
			</>
		);
	},
	'withDuotoneToolbarControls'
);

/**
 * Override the default block element to include duotone styles.
 *
 * @param  {Function} BlockListBlock Original component
 * @return {Function}                Wrapped component
 */
const withDuotoneStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const duotoneSupport = getBlockSupport( props.name, 'color.duotone' );
		const duotoneAttribute = props?.attributes?.style?.color?.duotone;

		if ( ! duotoneSupport || ! duotoneAttribute ) {
			return <BlockListBlock { ...props } />;
		}

		const { slug, values } = duotoneAttribute;
		const id = `wp-duotone-filter-${
			slug ?? useInstanceId( BlockListBlock )
		}`;

		const selectors = duotoneSupport.split( ',' );
		const selectorsScoped = selectors.map(
			( selector ) => `.${ id } ${ selector.trim() }`
		);
		const selectorsGroup = selectorsScoped.join( ', ' );

		const className = classnames( props?.classname, id );

		return (
			<>
				<DuotoneFilter
					selector={ selectorsGroup }
					id={ id }
					values={ values }
				/>
				<BlockListBlock { ...props } className={ className } />
			</>
		);
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
	withDuotoneToolbarControls
);
addFilter(
	'editor.BlockListBlock',
	'core/editor/duotone/with-styles',
	withDuotoneStyles
);
