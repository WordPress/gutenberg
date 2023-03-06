/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ContrastChecker from '../components/contrast-checker';
import { __unstableUseBlockRef as useBlockRef } from '../components/block-list/use-block-props/use-block-refs';

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

export default function BlockColorContrastChecker( { clientId } ) {
	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();
	const [ detectedLinkColor, setDetectedLinkColor ] = useState();
	const ref = useBlockRef( clientId );

	useEffect( () => {
		if ( ! ref.current ) {
			return;
		}
		setDetectedColor( getComputedStyle( ref.current ).color );

		const firstLinkElement = ref.current?.querySelector( 'a' );
		if ( firstLinkElement && !! firstLinkElement.innerText ) {
			setDetectedLinkColor( getComputedStyle( firstLinkElement ).color );
		}

		let backgroundColorNode = ref.current;
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
	}, [ ref ] );

	return (
		<ContrastChecker
			backgroundColor={ detectedBackgroundColor }
			textColor={ detectedColor }
			enableAlphaChecker
			linkColor={ detectedLinkColor }
		/>
	);
}
