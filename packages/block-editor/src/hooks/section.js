/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';

export const SECTION_SUPPORT_KEY = 'section';

const SECTION_SUPPORTED_BLOCKS = [ 'core/group' ];

function hasSectionSupport( blockType ) {
	return !! getBlockSupport( blockType, SECTION_SUPPORT_KEY );
}

/**
 * Filters the registered block settings, extending attributes to include section.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addAttribute( settings ) {
	if ( ! hasSectionSupport( settings ) ) {
		return settings;
	}

	if ( ! settings.attributes.section ) {
		Object.assign( settings.attributes, { section: { type: 'number' } } );
	}

	return settings;
}

/**
 * Filters registered block settings to extend the block edit wrapper to apply
 * the section class name.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addEditProps( settings ) {
	if (
		! hasSectionSupport( settings ) ||
		! SECTION_SUPPORTED_BLOCKS.includes( settings.name )
	) {
		return settings;
	}

	const existingGetEditWrapperProps = settings.getEditWrapperProps;
	settings.getEditWrapperProps = ( attributes ) => {
		let props = {};

		if ( existingGetEditWrapperProps ) {
			props = existingGetEditWrapperProps( attributes );
		}

		// A render hook will handle class application on the PHP side
		if ( attributes.section === undefined ) {
			return props;
		}

		const newClassName = classnames(
			props.className,
			`wp-section-${ attributes.section }`
		);
		props.className = newClassName ? newClassName : undefined;

		return props;
	};

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/section/addAttribute',
	addAttribute
);
addFilter(
	'blocks.registerBlockType',
	'core/section/addEditProps',
	addEditProps
);
