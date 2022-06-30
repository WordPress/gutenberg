/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { filterURLForDisplay } from '@wordpress/url';
import { useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostURLLabel() {
	const postLink = useSelect(
		( select ) => select( editorStore ).getCurrentPost().link,
		[]
	);
	return (
		<LeftTruncatedText>
			{ filterURLForDisplay( postLink ) }
		</LeftTruncatedText>
	);
}

function LeftTruncatedText( { children: text } ) {
	const ref = useRef();

	useEffect( () => {
		const container = ref.current;

		container.innerText = text;

		container.style.display = 'block';
		container.style.width = '100%';
		const maxWidth = container.clientWidth;

		container.style.display = null;
		container.style.width = null;

		const canvas = container.ownerDocument.createElement( 'canvas' );
		const context = canvas.getContext( '2d' );
		context.font = window
			.getComputedStyle( container )
			.getPropertyValue( 'font' );

		let truncatedText = text;
		let truncateAmount = 1;
		while ( context.measureText( truncatedText ).width > maxWidth ) {
			truncatedText = '…' + text.substring( truncateAmount );
			truncateAmount++;
		}

		container.innerText = truncatedText;
	}, [ text ] );

	return <span ref={ ref }></span>;
}
