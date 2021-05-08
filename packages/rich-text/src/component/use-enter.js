/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { ENTER } from '@wordpress/keycodes';

export function useEnter( props ) {
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			if ( event.defaultPrevented ) {
				return;
			}

			if ( event.keyCode !== ENTER ) {
				return;
			}

			event.preventDefault();

			const {
				onEnter,
				removeEditorOnlyFormats,
				createRecord,
				handleChange,
			} = propsRef.current;

			if ( ! onEnter ) {
				return;
			}

			onEnter( {
				value: removeEditorOnlyFormats( createRecord() ),
				onChange: handleChange,
				shiftKey: event.shiftKey,
			} );
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
