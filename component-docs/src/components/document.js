/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/block-serialization-default-parser';
import { getBlockAttributes, getBlockType, getSaveElement } from '@wordpress/blocks';
import { Notice } from '@wordpress/components';

/**
 * External dependencies
 */
import React from 'react';

import marked from 'marked';

/**
 * Internal dependencies
 */
import '../blocks';

export default function Document( props ) {
	const { markdown } = props;
	if ( ! markdown ) {
		return null;
	}

	const blocks = parse( marked( markdown ) );

	return (
		<>
			{ blocks.map( ( blockObject, index ) => {
				if ( ! blockObject.blockName ) {
					return <div key={ index } dangerouslySetInnerHTML={ { __html: blockObject.innerHTML } } />;
				}
				const blockType = getBlockType( blockObject.blockName );

				if ( ! blockType ) {
					return (
						<div key={ index }>
							<Notice status="warning" isDismissible={ false }>
								No block found matching name { blockObject.blockName }.
							</Notice>
							<div dangerouslySetInnerHTML={ { __html: blockObject.innerHTML } } />
						</div>
					);
				}
				return (
					<div key={ index }>
						{ getSaveElement(
							blockObject.blockName,
							getBlockAttributes( blockType, blockObject.innerHTML, blockObject.attrs ),
							blockObject.innerBlocks
						) }
					</div>
				);
			} ) }
		</>
	);
}
