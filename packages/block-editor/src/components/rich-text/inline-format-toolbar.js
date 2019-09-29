/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FormatToolbar from './format-toolbar';

const stopPropagation = ( event ) => event.stopPropagation();

export default function InlineFormatToolbar() {
	const ref = useRef();

	useEffect( () => {
		const { current } = ref;
		let editableNode = current;

		while ( editableNode && ! editableNode.isContentEditable ) {
			editableNode = editableNode.nextSibling;
		}

		const { position } = window.getComputedStyle( editableNode );

		if ( position !== 'absolute' ) {
			current.firstChild.style.position = 'absolute';
			return;
		}

		// See also ./format-toolbar/style.css
		const offset = 4;

		current.style.position = 'absolute';
		current.style.left = editableNode.offsetLeft + 'px';
		current.style.top = editableNode.offsetTop - offset + 'px';
	} );

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			ref={ ref }
			className="block-editor-rich-text__inline-toolbar"
			onMouseDown={ stopPropagation }
		>
			<FormatToolbar />
		</div>
	);
}
