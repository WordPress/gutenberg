/**
 * WordPress dependencies
 */
import { BlockList } from '@wordpress/block-editor';
import { useContext, createPortal } from '@wordpress/element';

export default function GapStyles( { blockGap, clientId } ) {
	const styleElement = useContext( BlockList.__unstableElementContext );
	// --gallery-block--gutter-size is deprecated. --wp--style--gallery-gap-default should be used by themes that want to set a default
	// gap on the gallery.
	let gapValue = `var( --wp--style--gallery-gap-default, var( --gallery-block--gutter-size, var( --wp--style--block-gap, 0.5em ) ) )`;
	// Check for the possibility of split block gap values. See: https://github.com/WordPress/gutenberg/pull/37736
	if ( !! blockGap ) {
		gapValue = typeof blockGap === 'string' ? blockGap : blockGap?.left;
	}
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
