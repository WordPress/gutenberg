/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

export default function GuidePage( props ) {
	useEffect( () => {
		deprecated( '<GuidePage>', {
			since: '8.2',
			alternative: 'the `pages` prop in <Guide>',
		} );
	}, [] );

	return <div { ...props } />;
}
