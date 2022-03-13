/**
 * WordPress dependencies
 */
import { BlockList } from '@wordpress/block-editor';
import { useContext, createPortal } from '@wordpress/element';

export default function GapStyles( { blockGap, clientId } ) {
	const styleElement = useContext( BlockList.__unstableElementContext );

	const gap = blockGap
		? `#block-${ clientId } { --wp--style--unstable-gallery-gap: ${ blockGap } }`
		: `#block-${ clientId } { --wp--style--unstable-gallery-gap: var( --wp--style--block-gap, 16px ) }`;

	const GapStyle = () => {
		return <style>{ gap }</style>;
	};

	return gap && styleElement
		? createPortal( <GapStyle />, styleElement )
		: null;
}
