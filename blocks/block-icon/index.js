/**
 * WordPress dependencies
 */
import { Dashicon } from '@wordpress/components';
import { createElement, Component } from '@wordpress/element';

export default function BlockIcon( { icon } ) {
	if ( ! icon ) {
		return <Dashicon icon={ 'wordpress' } />;
	}

	if ( 'string' === typeof icon ) {
		return <Dashicon icon={ icon } />;
	}

	if ( 'function' === typeof icon ) {
		if ( icon.prototype instanceof Component ) {
			return createElement( icon );
		}
		return icon();
	}

	return icon;
}
