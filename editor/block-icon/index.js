/**
 * WordPress dependencies
 */
import Dashicon from 'components/dashicon';

export default function BlockIcon( { icon } ) {
	if ( 'string' === typeof icon ) {
		return <Dashicon icon={ icon } />;
	} else if ( 'function' === typeof icon ) {
		return icon();
	}

	return icon || null;
}
