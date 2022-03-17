/**
 * WordPress dependencies
 */
import { BlockList, store as blockEditorStore } from '@wordpress/block-editor';
import { useContext, createPortal } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

export default function GapStyles( { blockGap, clientId } ) {
	const themeSupportsLayout = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings()?.supportsLayout;
	}, [] );
	const styleElement = useContext( BlockList.__unstableElementContext );

	const gapFallback = themeSupportsLayout ? '0.5em' : '16px';
	const backwardsCompatGap = ! themeSupportsLayout
		? `; gap: ${ gapFallback }`
		: '';
	const gap = blockGap
		? `#block-${ clientId } { --wp--style--unstable-gallery-gap: ${ blockGap } }`
		: `#block-${ clientId } { --wp--style--unstable-gallery-gap: var( --wp--style--block-gap, ${ gapFallback } ) ${ backwardsCompatGap }  }`;

	const GapStyle = () => {
		return <style>{ gap }</style>;
	};

	return gap && styleElement
		? createPortal( <GapStyle />, styleElement )
		: null;
}
