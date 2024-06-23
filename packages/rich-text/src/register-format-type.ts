/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import type { RichTextFormatFull } from './types';
import { store as richTextStore } from './store';

/**
 * Registers a new format provided a unique name and an object defining its
 * behavior.
 *
 * @param name     Format name.
 * @param settings Format settings.
 *
 * @return The format, if it has been successfully registered; otherwise `undefined`.
 */
export function registerFormatType<
	Name extends RichTextFormatFull[ 'name' ],
	Settings extends Omit< RichTextFormatFull, 'name' >,
>( name: Name, settings: Settings ): ( { name: Name } & Settings ) | undefined {
	const format = {
		name,
		...settings,
	};

	if ( typeof format.name !== 'string' ) {
		window.console.error( 'Format names must be strings.' );
		return;
	}

	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( format.name ) ) {
		window.console.error(
			'Format names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-format'
		);
		return;
	}

	if ( select( richTextStore ).getFormatType( format.name ) ) {
		window.console.error(
			'Format "' + format.name + '" is already registered.'
		);
		return;
	}

	if ( typeof format.tagName !== 'string' || format.tagName === '' ) {
		window.console.error( 'Format tag names must be a string.' );
		return;
	}

	if (
		( typeof format.className !== 'string' || format.className === '' ) &&
		format.className !== null
	) {
		window.console.error(
			'Format class names must be a string, or null to handle bare elements.'
		);
		return;
	}

	if (
		format.className !== null &&
		! /^[_a-zA-Z]+[a-zA-Z0-9_-]*$/.test( format.className )
	) {
		window.console.error(
			'A class name must begin with a letter, followed by any number of hyphens, underscores, letters, or numbers.'
		);
		return;
	}

	if ( format.className === null ) {
		const formatTypeForBareElement = select(
			richTextStore
		).getFormatTypeForBareElement( format.tagName );

		if (
			formatTypeForBareElement &&
			formatTypeForBareElement.name !== 'core/unknown'
		) {
			window.console.error(
				`Format "${ formatTypeForBareElement.name }" is already registered to handle bare tag name "${ format.tagName }".`
			);
			return;
		}
	} else {
		const formatTypeForClassName = select(
			richTextStore
		).getFormatTypeForClassName( format.className );

		if ( formatTypeForClassName ) {
			window.console.error(
				`Format "${ formatTypeForClassName.name }" is already registered to handle class name "${ format.className }".`
			);
			return;
		}
	}

	if ( ! ( 'title' in format ) || format.title === '' ) {
		window.console.error(
			'The format "' + format.name + '" must have a title.'
		);
		return;
	}

	if (
		'keywords' in format &&
		format.keywords &&
		format.keywords.length > 3
	) {
		window.console.error(
			'The format "' + format.name + '" can have a maximum of 3 keywords.'
		);
		return;
	}

	if ( typeof format.title !== 'string' ) {
		window.console.error( 'Format titles must be strings.' );
		return;
	}

	dispatch( richTextStore ).addFormatTypes( format );

	return format;
}
