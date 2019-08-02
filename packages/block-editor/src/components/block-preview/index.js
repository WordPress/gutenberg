/**
 * External dependencies
 */

import { castArray } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { useLayoutEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockEditorProvider from '../provider';
import BlockList from '../block-list';
import { getBlockPreviewContainerDOMNode } from '../../utils/dom';

export function BlockPreview( { blocks, settings } ) {
	const previewRef = useRef( null );

	const [ previewScale, setPreviewScale ] = useState( 1 );
	const [ visibility, setVisibility ] = useState( 'hidden' );

	// Dynamically calculate the scale factor
	useLayoutEffect( () => {
		const { clientId } = blocks;

		// this.props.setTimeout( () => {
		// Timer - required to account for async render of `BlockEditorProvider`
		const timerId = setTimeout( () => {
			window.clearTimeout( timerId );
			const refNode = previewRef.current;
			const blockHozPadding = ( 14 * 2 ); // Todo - use getComputedStyle to grab the real dimensions!
			const containerWidth = refNode.offsetWidth - blockHozPadding;

			const previewDomElements = getBlockPreviewContainerDOMNode( clientId );
			const previewBlocksWidth = previewDomElements ? previewDomElements.offsetWidth : containerWidth;
			const scale = Math.min( containerWidth / previewBlocksWidth ) || 1;

			setPreviewScale( scale );
			setVisibility( 'visible' );
		}, 10 );

		// Cleanup
		return () => {
			if ( timerId ) {
				window.clearTimeout( timerId );
			}
		};
	} );

	if ( ! blocks ) {
		return null;
	}

	const previewStyles = {
		transform: `scale(${ previewScale })`,
		visibility,
	};

	const contentClassNames = classnames( 'editor-block-preview__content block-editor-block-preview__content editor-styles-wrapper', {
		'is-scaled': previewScale !== 1,
	} );

	return (
		<div ref={ previewRef } className="editor-block-preview__container" aria-hidden>
			<Disabled style={ previewStyles } className={ contentClassNames }>
				<BlockEditorProvider
					value={ castArray( blocks ) }
					settings={ settings }
				>
					<BlockList />
				</BlockEditorProvider>
			</Disabled>
		</div>
	);
}

/**
 * BlockPreview renders a preview given an array of blocks.
 *
 * @param {Object} props Component props.
 *
 * @return {WPElement} Rendered element.
 */
export default withSelect( ( select ) => {
	return {
		settings: select( 'core/block-editor' ).getSettings(),
	};
} )( BlockPreview );
