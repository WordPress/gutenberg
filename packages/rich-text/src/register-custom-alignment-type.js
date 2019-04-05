/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';

/**
 * Registers a new custom alignment type provided a unique name and an object defining its
 * behavior.
 *
 * @param {string} name               Custom alignment name.
 * @param {Object} settings           Custom alignment settings.
 * @param {string} settings.blockName The block name this custom alignment will be added to the Rich Text alignment toolbar.
 * @param {string} settings.align     The alignment setting.
 * @param {string} settings.title     Name of the custom alignment.
 * @param {string} settings.icon      The icon to be displayed in the alignment toolbar.
 *
 * @return {Object|undefined} The Custom alignment, if it has been successfully registered;
 *                            otherwise `undefined`.
 */
export function registerCustomAlignmentType( name, settings ) {
	settings = {
		name,
		...settings,
	};

	if ( typeof settings.name !== 'string' ) {
		window.console.error(
			'Custom alignment names must be strings.'
		);
		return;
	}

	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( settings.name ) ) {
		window.console.error(
			'Custom alignment names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-alignment'
		);
		return;
	}

	if (
		typeof settings.blockName !== 'string' ||
		settings.blockName === ''
	) {
		window.console.error(
			`Custom alignment block name must be a string.`
		);
		return;
	}

	if ( ! select( 'core/blocks' ).getBlockType( settings.blockName ) ) {
		window.console.error(
			'Custom alignment block "' + settings.blockName + '" must be registered.'
		);
		return;
	}

	if ( select( 'core/rich-text' ).getCustomAlignmentType( settings.name, settings.blockName ) ) {
		window.console.error(
			'Custom alignment "' + settings.name + '" is already registered.'
		);
		return;
	}

	if ( ! ( 'title' in settings ) || settings.title === '' ) {
		window.console.error(
			'The custom alignment "' + settings.name + '" must have a title.'
		);
		return;
	}

	if ( ! ( 'icon' in settings ) || settings.icon === '' ) {
		window.console.error(
			'The custom alignment "' + settings.name + '" must have an icon.'
		);
		return;
	}

	if ( ! ( 'align' in settings ) || settings.align === '' ) {
		window.console.error(
			'The custom alignment "' + settings.name + '" must have an alignment setting.'
		);
		return;
	}

	dispatch( 'core/rich-text' ).addCustomAlignmentTypes( settings );

	return settings;
}
