import { select, dispatch } from '@wordpress/data';
import { store as richTextStore } from './store';
import type { FormatType } from './types';

/**
 * Registers a new format provided a unique name and an object defining its
 * behavior.
 *
 * @param name     Format name.
 * @param settings Format settings. `name` is injected from the first argument.
 *
 * @return The format, if it has been successfully registered; otherwise
 *         `undefined`.
 */
export function registerFormatType(
	name: string,
	settings: Omit< FormatType, 'name' > & { name?: string }
) {
	settings = {
		name,
		...settings,
	};

	if ( typeof settings.name !== 'string' ) {
		window.console.error( 'Format names must be strings.' );
		return;
	}

	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( settings.name ) ) {
		window.console.error(
			'Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format'
		);
		return;
	}

	if ( select( richTextStore ).getFormatType( settings.name ) ) {
		window.console.error(
			'Format "' + settings.name + '" is already registered.'
		);
		return;
	}

	if ( typeof settings.tagName !== 'string' || settings.tagName === '' ) {
		window.console.error( 'Format tag names must be a string.' );
		return;
	}

	if (
		( typeof settings.className !== 'string' ||
			settings.className === '' ) &&
		settings.className !== null
	) {
		window.console.error(
			'Format class names must be a string, or null to handle bare elements.'
		);
		return;
	}

	if (
		settings.className !== null &&
		! /^[_a-zA-Z]+[a-zA-Z0-9_-]*$/.test( settings.className )
	) {
		window.console.error(
			'A class name must begin with a letter, followed by any number of hyphens, underscores, letters, or numbers.'
		);
		return;
	}

	if ( settings.className === null ) {
		const formatTypeForBareElement = select(
			richTextStore
		).getFormatTypeForBareElement( settings.tagName );

		if (
			formatTypeForBareElement &&
			formatTypeForBareElement.name !== 'core/unknown'
		) {
			window.console.error(
				`Format "${ formatTypeForBareElement.name }" is already registered to handle bare tag name "${ settings.tagName }".`
			);
			return;
		}
	} else {
		const formatTypeForClassName = select(
			richTextStore
		).getFormatTypeForClassName( settings.className );

		if ( formatTypeForClassName ) {
			window.console.error(
				`Format "${ formatTypeForClassName.name }" is already registered to handle class name "${ settings.className }".`
			);
			return;
		}
	}

	if ( ! ( 'title' in settings ) || settings.title === '' ) {
		window.console.error(
			'The format "' + settings.name + '" must have a title.'
		);
		return;
	}

	if ( 'keywords' in settings && settings.keywords!.length > 3 ) {
		window.console.error(
			'The format "' +
				settings.name +
				'" can have a maximum of 3 keywords.'
		);
		return;
	}

	if ( typeof settings.title !== 'string' ) {
		window.console.error( 'Format titles must be strings.' );
		return;
	}

	dispatch( richTextStore ).addFormatTypes( settings as FormatType );

	return settings as FormatType;
}
