/**
 * WordPress dependencies
 */
import { BlockEditorProvider, BlockList } from '@wordpress/block-editor';
import { BottomSheet } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { forwardRef, useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Dimensions, View, StyleSheet } from 'react-native';

const useScreenDimensions = ( dimension = 'window' ) => {
	const [ dimensions, setDimensions ] = useState( Dimensions.get( dimension ) );

	useEffect( () => {
		const onChange = ( result ) => {
			setDimensions( result[ dimension ] );
		};

		Dimensions.addEventListener( 'change', onChange );

		return () => Dimensions.removeEventListener( 'change', onChange );
	} );

	return dimensions;
};

// We are replicating this here because the one in @wordpress/block-editor always
// tries to scale the preview and we would need a lot of cross platform code to handle
// sizes, when we actually want to show the preview at full width.
//
// We can make it work here first, then figure out the right way to consolidate
// both implementations
const BlockPreview = forwardRef( ( { blocks, onScroll }, ref ) => {
	const currentSettings = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSettings();
	} );
	const settings = {
		...currentSettings,
		readOnly: true,
	};
	const { height: windowHeight } = useScreenDimensions();
	const style = StyleSheet.create( {
		container: {
			height: windowHeight - 150,
		},
	} );

	return (
		<BlockEditorProvider
			value={ blocks }
			settings={ settings }
		>
			<View style={ style.container }>
				<BlockList scrollViewRef={ ref } onScroll={ onScroll } />
			</View>
		</BlockEditorProvider>
	);
} );
BlockPreview.displayName = 'BlockPreview';

const Preview = ( props ) => {
	const { template, onDismiss } = props;
	const blockPreviewRef = useRef( null );
	const [ scrollOffset, setScrollOffset ] = useState( null );
	const handleScrollTo = useCallback(	( point ) => {
		if ( ! blockPreviewRef.current ) {
			return;
		}
		const scrollRef = blockPreviewRef.current._listRef ? blockPreviewRef.current._listRef.getScrollRef() : blockPreviewRef.current;
		scrollRef.scrollTo( point );
	}, [ blockPreviewRef ] );

	if ( template === undefined ) {
		return null;
	}

	return (
		<BottomSheet
			title={ template.name }
			isVisible={ !! template }
			onClose={ onDismiss }
			scrollTo={ handleScrollTo }
			scrollOffset={ scrollOffset }
			scrollOffsetMax={ 1000 } // Not sure what this does yet, but it seems required
		>
			<BlockPreview
				blocks={ template.blocks }
				ref={ blockPreviewRef }
				onScroll={ event => setScrollOffset( event.nativeEvent.contentOffset.y ) }
			/>
		</BottomSheet>
	);
};
Preview.displayName = 'TemplatePreview';

export default Preview;
