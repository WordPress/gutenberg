import { useEvent } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import type { DeprecatedTextAlignProps } from './types';

/**
 * If a plugin is still using the old textAlign attribute, we need to migrate its value
 * to the new style.typography.textAlign attribute.
 *
 * @param props Block props.
 */
export default function useDeprecatedTextAlign(
	props: DeprecatedTextAlignProps
): void {
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
	const lastUpdatedAlignRef = useRef< string | undefined >( undefined );
	useEffect( () => {
		if ( textAlign === lastUpdatedAlignRef.current ) {
			return;
		}
		lastUpdatedAlignRef.current = textAlign;
		updateStyleWithAlign();
	}, [ textAlign, updateStyleWithAlign ] );
}
