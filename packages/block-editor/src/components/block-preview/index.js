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
import { useLayoutEffect, useState, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockEditorProvider from '../provider';
import BlockList from '../block-list';
import { getClockPreviewContainerDOMNode } from '../../utils/dom';

export function BlockPreview( { blocks, settings } ) {
	const previewRef = useRef( null );

	const [ previewScale, setPreviewScale ] = useState( 1 );
	const [ visibility, setVisibility ] = useState( 'hidden' );

	let timerId;

	// Dynamically calculate the scale factor
	useLayoutEffect( () => {
		const { clientId } = blocks;
		timerId = setTimeout( () => {
			const refNode = previewRef.current;
			const containerWidth = refNode.offsetWidth - ( 14 * 2 );

			const previewDomElements = getClockPreviewContainerDOMNode( clientId );
			const previewBlocksWidth = previewDomElements ? previewDomElements.offsetWidth : containerWidth;
			const scale = Math.min( containerWidth / previewBlocksWidth ) || 1;

			setPreviewScale( scale );
			setVisibility( 'visible' );
		}, 10 );
	} );

	useEffect( () => {
		return () => window.clearTimeout( timerId );
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
