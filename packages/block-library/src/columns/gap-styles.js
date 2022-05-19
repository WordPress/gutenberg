/**
 * WordPress dependencies
 */
import { BlockList } from '@wordpress/block-editor';
import { useContext, createPortal } from '@wordpress/element';

export default function GapStyles( { blockGap, clientId } ) {
	const styleElement = useContext( BlockList.__unstableElementContext );

	if ( ! blockGap ) {
		return null;
	}

	// Check for the possibility of split block gap values. See: https://github.com/WordPress/gutenberg/pull/37736.
	const gapValue = typeof blockGap === 'string' ? blockGap : blockGap?.left;

	if ( ! gapValue ) {
		return null;
	}

	const gap = `#block-${ clientId } { 
		--wp--style--unstable-columns-gap: ${ gapValue };
	}`;

	const GapStyle = () => {
		return <style>{ gap }</style>;
	};

	return gap && styleElement
		? createPortal( <GapStyle />, styleElement )
		: null;
}
