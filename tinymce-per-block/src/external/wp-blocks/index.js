/**
 * External dependencies
 */
import { defaults } from 'lodash';

export { default as EditableComponent } from './editable';
export { default as EnhancedInputComponent } from './input';

const _registered = {};

export function registerBlock( name, options ) {
	options = defaults( options, {
		title: name
	} );

	_registered[ name ] = options;

	return options;
}

export function getBlock( name ) {
	return _registered[ name ];
}
