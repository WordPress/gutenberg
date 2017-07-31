/**
 * WordPress dependencies
 */
import Dashicon from 'components/dashicon';
import { createElement, Component } from 'element';

export default function BlockIcon( { icon } ) {
	if ( 'string' === typeof icon ) {
		return <Dashicon icon={ icon } />;
	} else if ( 'function' === typeof icon ) {
		if ( icon.prototype instanceof Component ) {
			return createElement( icon );
		}

		return icon();
	}

	return icon || null;
}
