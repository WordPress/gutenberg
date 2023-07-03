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

	useEffect( () => {
		// Override the return value of i18n.isRTL()
		addFilter(
			'i18n.gettext_with_context',
			'storybook',
			( translation, text, _context ) => {
				if ( text === 'ltr' && _context === 'text direction' ) {
					return context.globals.direction;
				}
				return translation;
			}
		);

		ref.current.ownerDocument.documentElement.setAttribute(
			'dir',
			context.globals.direction
		);

		setRerenderKey( ( prevValue ) => prevValue + 1 );

		return () => removeFilter( 'i18n.gettext_with_context', 'storybook' );
	}, [ context.globals.direction ] );

	useLayoutEffect( () => {
		const stylesToUse = [];

		CONFIG.forEach( ( item ) => {
			if ( item.componentIdMatcher.test( context.componentId ) ) {
				stylesToUse.push( ...item[ context.globals.direction ] );
			}
		} );

		stylesToUse.forEach( ( style ) => style.use() );

		return () => {
			stylesToUse.forEach( ( style ) => style.unuse() );
		};
	}, [ context.componentId, context.globals.direction ] );

	return (
		<div ref={ ref } key={ rerenderKey }>
			<Story { ...context } />
		</div>
	);
};
