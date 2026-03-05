/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';
import {
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import CONFIG from '../package-styles/config';

export const WithRTL = ( Story, context ) => {
	const [ rerenderKey, setRerenderKey ] = useState( 0 );
	const ref = useRef();

	const direction = [ 'ltr', 'rtl' ].includes( context.globals.direction )
		? context.globals.direction
		: 'ltr';

	useEffect( () => {
		// Override the return value of i18n.isRTL()
		addFilter(
			'i18n.gettext_with_context',
			'storybook',
			( translation, text, _context ) => {
				if ( text === 'ltr' && _context === 'text direction' ) {
					return direction;
				}
				return translation;
			}
		);

		ref.current.ownerDocument.documentElement.setAttribute(
			'dir',
			direction
		);

		setRerenderKey( ( prevValue ) => prevValue + 1 );

		return () => removeFilter( 'i18n.gettext_with_context', 'storybook' );
	}, [ direction ] );

	useLayoutEffect( () => {
		const stylesToUse = [];

		CONFIG.forEach( ( item ) => {
			if ( item.componentIdMatcher.test( context.componentId ) ) {
				stylesToUse.push( ...item[ direction ] );
			}
		} );

		const style = document.createElement( 'style' );
		style.textContent = stylesToUse.join( '\n' );
		document.head.appendChild( style );

		return () => {
			document.head.removeChild( style );
		};
	}, [ context.componentId, direction ] );

	return (
		<div ref={ ref } key={ rerenderKey }>
			<Story { ...context } />
		</div>
	);
};
