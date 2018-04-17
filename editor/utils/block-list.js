/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockList from '../components/block-list';

/**
 * An object of cached BlockList components
 *
 * @type {Object}
 */
const INNER_BLOCK_LIST_CACHE = {};

/**
 * Returns a BlockList component which is already pre-bound to render with a
 * given UID as its rootUID prop. It is necessary to cache these components
 * because otherwise the rendering of a nested BlockList will cause ancestor
 * blocks to re-mount, leading to an endless cycle of remounting inner blocks.
 *
 * @param {string}   uid                   	          Block UID to use as root UID of
 *                                         	          BlockList component.
 * @param {Function} renderBlockMenu       	          Render function for block menu of
 *                                         	          nested BlockList.
 * @param {boolean}  showContextualToolbar 	          Whether contextual toolbar is to be
 *                                         	          used.
 * @param {Function} updateNestedSettingsIfNeeded     Function that updates nesting settings
 *                                                    if an update is necessary
 * @param {Function} insertTemplateBlockIfNeeded      Function that inserts blocks in accordance
 *                                                    with the template if innerBlocks are empty
 *
 * @return {Component} Pre-bound BlockList component
 */
export function createInnerBlockList( uid, renderBlockMenu, showContextualToolbar, updateNestedSettingsIfNeeded, insertTemplateBlockIfNeeded ) {
	if ( ! INNER_BLOCK_LIST_CACHE[ uid ] ) {
		INNER_BLOCK_LIST_CACHE[ uid ] = [
			// The component class:
			class extends Component {
				componentWillMount() {
					INNER_BLOCK_LIST_CACHE[ uid ][ 1 ]++;
					updateNestedSettingsIfNeeded( {
						supportedBlocks: this.props.allowedBlockNames,
					} );
					insertTemplateBlockIfNeeded( this.props.template );
				}

				componentWillReceiveProps( nextProps ) {
					updateNestedSettingsIfNeeded( {
						supportedBlocks: nextProps.allowedBlockNames,
					} );
				}

				componentWillUnmount() {
					// If, after decrementing the tracking count, there are no
					// remaining instances of the component, remove from cache.
					if ( ! INNER_BLOCK_LIST_CACHE[ uid ][ 1 ]-- ) {
						delete INNER_BLOCK_LIST_CACHE[ uid ];
					}
				}

				render() {
					return (
						<BlockList
							rootUID={ uid }
							renderBlockMenu={ renderBlockMenu }
							{ ...this.props } />
					);
				}
			},

			// A counter tracking active mounted instances:
			0,
		];
	}

	return INNER_BLOCK_LIST_CACHE[ uid ][ 0 ];
}
