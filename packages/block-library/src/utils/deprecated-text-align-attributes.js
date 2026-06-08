/**
 * WordPress dependencies
 */
import { useEvent } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * If a plugin is still using the old textAlign attribute, we need to migrate its value
 * to the new style.typography.textAlign attribute.
 *
 * @param {Object} props Block props.
 */
export default function useDeprecatedTextAlign( props ) {
	const { name, attributes, setAttributes } = props;
	const { textAlign } = attributes;
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const updateStyleWithAlign = useEvent( () => {
		deprecated( `textAlign attribute in ${ name }`, {
			alternative: 'style.typography.textAlign',
			since: '7.0',
		} );
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( ( currentAttr ) => ( {
			style: {
				...currentAttr.style,
				typography: {
					...currentAttr.style?.typography,
					textAlign,
				},
			},
		} ) );
	} );
	const lastUpdatedAlignRef = useRef();
	useEffect( () => {
		if ( textAlign === lastUpdatedAlignRef.current ) {
			return;
		}
		lastUpdatedAlignRef.current = textAlign;
		updateStyleWithAlign();
	}, [ textAlign, updateStyleWithAlign ] );
}
