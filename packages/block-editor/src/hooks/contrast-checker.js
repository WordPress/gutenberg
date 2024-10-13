/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ContrastChecker from '../components/contrast-checker';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

export default function BlockColorContrastChecker( { clientId } ) {
	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();
	const [ detectedLinkColor, setDetectedLinkColor ] = useState();
	const blockEl = useBlockElement( clientId );

	// There are so many things that can change the color of a block
	// So we perform this check on every render.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect( () => {
		if ( ! blockEl ) {
			return;
		}
		setDetectedColor( getComputedStyle( blockEl ).color );

		const firstLinkElement = blockEl.querySelector( 'a' );
		if ( firstLinkElement && !! firstLinkElement.innerText ) {
			setDetectedLinkColor( getComputedStyle( firstLinkElement ).color );
		}

		let backgroundColorNode = blockEl;
		let backgroundColor =
			getComputedStyle( backgroundColorNode ).backgroundColor;
		while (
			backgroundColor === 'rgba(0, 0, 0, 0)' &&
			backgroundColorNode.parentNode &&
			backgroundColorNode.parentNode.nodeType ===
				backgroundColorNode.parentNode.ELEMENT_NODE
		) {
			backgroundColorNode = backgroundColorNode.parentNode;
			backgroundColor =
				getComputedStyle( backgroundColorNode ).backgroundColor;
		}

		setDetectedBackgroundColor( backgroundColor );
	}, [ blockEl ] );

	return (
		<ContrastChecker
			backgroundColor={ detectedBackgroundColor }
			textColor={ detectedColor }
			enableAlphaChecker
			linkColor={ detectedLinkColor }
		/>
	);
}
