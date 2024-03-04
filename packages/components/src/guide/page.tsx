/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';

export default function GuidePage(
	props: WordPressComponentProps< {}, 'div', false >
) {
	useEffect( () => {
		deprecated( '<GuidePage>', {
			since: '5.5',
			alternative: 'the `pages` prop in <Guide>',
		} );
	}, [] );

	return <div { ...props } />;
}
