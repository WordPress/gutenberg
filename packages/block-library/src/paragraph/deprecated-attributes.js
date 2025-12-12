/**
 * WordPress dependencies
 */
import { useEvent } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * If a plugin is still using the old align attribute, we need to migrate its value
 * to the new style.typography.textAlign attribute.
 *
 * @param {string?}          align         Align attribute value.
 * @param {Object?}          style         Style attribute value.
 * @param {(Object) => void} setAttributes Updater function for block attributes.
 */
export default function useDeprecatedAlign( align, style, setAttributes ) {
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const updateStyleWithAlign = useEvent( () => {
		deprecated( 'align attribute in paragraph block', {
			alternative: 'style.typography.textAlign',
			since: '7.0',
		} );
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( {
			style: {
				...style,
				typography: {
					...style?.typography,
					textAlign: align,
				},
			},
		} );
	} );
	const lastUpdatedAlignRef = useRef();
	useEffect( () => {
		if ( align === lastUpdatedAlignRef.current ) {
			return;
		}
		lastUpdatedAlignRef.current = align;
		updateStyleWithAlign();
	}, [ align, updateStyleWithAlign ] );
}
