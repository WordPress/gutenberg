/**
 * WordPress dependencies
 */
import { BlockList } from '@wordpress/block-editor';
import { useContext, createPortal } from '@wordpress/element';

export default function GapStyles( { blockGap, clientId } ) {
	const styleElement = useContext( BlockList.__unstableElementContext );
	const gapValue = blockGap
		? blockGap
		: `var( --wp--style--gallery-gap-default, var( --wp--style--block-gap, 0.5em ))`;
	const gap = `#block-${ clientId } { 
		--wp--style--unstable-gallery-gap: ${ gapValue };
		gap: ${ gapValue } 
	}`;

	const GapStyle = () => {
		return <style>{ gap }</style>;
	};

	return gap && styleElement
		? createPortal( <GapStyle />, styleElement )
		: null;
}
