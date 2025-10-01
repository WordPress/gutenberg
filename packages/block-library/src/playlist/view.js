/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

const { state } = store( 'core/playlist', {
	state: {
		get currentItemData() {
			const context = getContext();
			const { itemsData, currentItem } = context;

			if ( ! itemsData || ! itemsData[ currentItem ] ) {
				return null;
			}

			return itemsData[ currentItem ];
		},
		get currentItemSrc() {
			const itemData = state.currentItemData;
			return itemData?.url || '';
		},
		get currentItemTitle() {
			const itemData = state.currentItemData;
			return itemData?.title || '';
		},
		get currentItemArtist() {
			const itemData = state.currentItemData;
			if ( ! itemData?.artist ) {
				return '';
			}
			// translators: %s is the artist name.
			return `by ${ itemData.artist }`;
		},
		get currentItemImage() {
			const itemData = state.currentItemData;
			return itemData?.image || '';
		},
		get isItemActive() {
			const context = getContext();
			const parentContext = getContext( 'core/playlist' );
			const { itemIndex } = context;
			return itemIndex === parentContext.currentItem;
		},
	},
	actions: {
		selectItem: () => {
			const context = getContext();
			const { itemIndex } = context;

			// Get the parent context and update current item
			const parentContext = getContext( 'core/playlist' );
			const wasPlaying = parentContext.isPlaying;
			parentContext.currentItem = itemIndex;

			// Get the audio element and play the new item if needed
			const { ref } = getElement();
			const container = ref.closest(
				'[data-wp-interactive="core/playlist"]'
			);
			if ( container ) {
				const audio = container.querySelector(
					'.wp-block-playlist__audio'
				);
				if ( audio ) {
					audio.load();
					if ( wasPlaying ) {
						audio.play();
					}
				}
			}
		},
		onItemEnded: () => {
			const context = getContext();
			const { itemsData, currentItem, loop } = context;

			// If not the last item, move to next.
			if ( currentItem < itemsData.length - 1 ) {
				context.currentItem = currentItem + 1;
				const { ref } = getElement();
				if ( ref ) {
					ref.load();
					ref.play();
				}
			} else if ( loop ) {
				// Last item and loop enabled - go back to first item.
				context.currentItem = 0;
				const { ref } = getElement();
				if ( ref ) {
					ref.load();
					ref.play();
				}
			}
			// If last item and no loop - do nothing (stop playing).
		},
		onPlay: () => {
			const context = getContext();
			context.isPlaying = true;
		},
		onPause: () => {
			const context = getContext();
			context.isPlaying = false;
		},
	},
	callbacks: {
		updateAudio: () => {
			const context = getContext();
			const { autoplay, currentItem } = context;

			const { ref } = getElement();
			if ( ! ref ) {
				return;
			}

			const audio = ref.querySelector( '.wp-block-playlist__audio' );
			if ( audio && autoplay && currentItem === 0 ) {
				audio.play();
			}
		},
	},
} );
