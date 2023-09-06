/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { insert } from '@wordpress/rich-text';
import { useRefEffect } from '@wordpress/compose';
import { TAB } from '@wordpress/keycodes';

export function useTab( props ) {
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			const { keyCode } = event;

			if ( event.defaultPrevented ) {
				return;
			}

			const { value, onChange } = propsRef.current;
            const _value = { ...value };

			if ( keyCode === TAB  ) {
                event.preventDefault();

				const { start, end } = value;

				onChange( insert( _value, '\t', start, end ) );
			}
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );

}