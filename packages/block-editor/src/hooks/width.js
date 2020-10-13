/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { Button, ButtonGroup, PanelBody } from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import TokenList from '@wordpress/token-list';

/**
 * Internal dependencies
 */
import { cleanEmptyObject } from './utils';
import InspectorControls from '../components/inspector-controls';

export const WIDTH_SUPPORT_KEY = '__experimentalWidth';

/**
 * Override props assigned to save component to inject width CSS class
 * if applicable.
 *
 * @param  {Object} props      Additional props applied to save element.
 * @param  {Object} blockType  Block type.
 * @param  {Object} attributes Block attributes.
 * @return {Object}            Filtered props applied to save element.
 */
function addSaveProps( props, blockType, attributes ) {
	if ( ! hasWidthSupport( blockType ) ) {
		return props;
	}

	// Add CSS class indicating that a custom width was applied
	// Use TokenList to de-dupe classes.
	if ( attributes.style?.width ) {
		const classes = new TokenList( props.className );
		classes.add( `custom-width` );
		const newClassName = classes.value;
		props.className = newClassName ? newClassName : undefined;
	}

	return props;
}

/**
 * Filters registered block settings to expand the block edit wrapper by
 * applying the desired class name.
 *
 * @param  {Object} settings Original block settings.
 * @return {Object}          Filtered block settings.
 */
function addEditProps( settings ) {
	if ( ! hasWidthSupport( settings ) ) {
		return settings;
	}

	const existingGetEditWrapperProps = settings.getEditWrapperProps;
	settings.getEditWrapperProps = ( attributes ) => {
		let props = {};
		if ( existingGetEditWrapperProps ) {
			props = existingGetEditWrapperProps( attributes );
		}
		return addSaveProps( props, settings, attributes );
	};

	return settings;
}

/**
 * Inspector control panel containing the width related configuration.
 *
 * @param  {Object} props Block properties.
 * @return {WPElement}    Width edit element.
 */
export function WidthEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	if ( isWidthDisabled( props ) ) {
		return null;
	}

	const onChange = ( newWidthValue ) => {
		const newStyle = {
			...style,
			width: newWidthValue,
		};
		setAttributes( { style: cleanEmptyObject( newStyle ) } );
	};

	return (
		<ButtonGroup aria-label={ __( 'Width' ) }>
			{ [ '25%', '50%', '75%', '100%' ].map( ( widthValue ) => {
				return (
					<Button
						key={ widthValue }
						isSmall
						isPrimary={ widthValue === style?.width }
						onClick={ () => onChange( widthValue ) }
					>
						{ widthValue }
					</Button>
				);
			} ) }
		</ButtonGroup>
	);
}

export function WidthPanel( props ) {
	if ( isWidthDisabled( props ) ) {
		return null;
	}

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Width Settings' ) }>
				<WidthEdit { ...props } />
			</PanelBody>
		</InspectorControls>
	);
}

/**
 * Determines if there is width support.
 *
 * @param  {string|Object} blockType Block name or Block Type object.
 * @return {boolean}                 Whether there is support.
 */
export function hasWidthSupport( blockType ) {
	return getBlockSupport( blockType, WIDTH_SUPPORT_KEY );
}

export function isWidthDisabled( { name: blockName } = {} ) {
	return ! hasWidthSupport( blockName );
}

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/width/addSaveProps',
	addSaveProps
);

addFilter(
	'blocks.registerBlockType',
	'core/width/addEditProps',
	addEditProps
);
