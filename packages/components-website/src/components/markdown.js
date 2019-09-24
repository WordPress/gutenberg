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
import Typography from './typography';
import { toHash } from '../utils/strings';

function mapBlocksWithKeys( blocks ) {
	return blocks.map( ( block, index ) => {
		const { innerHTML } = block;
		const id = `${ toHash( innerHTML ) }-${ index }`;

		return { ...block, id };
	} );
}

function markdownToBlocks( markdown ) {
	const blocks = parse( marked( markdown ) );
	return mapBlocksWithKeys( blocks );
}

export default function Markdown( props ) {
	const { markdown } = props;
	if ( ! markdown ) {
		return null;
	}

	const blocks = markdownToBlocks( markdown );

	return (
		<>
			{ blocks.map( ( block ) => {
				const { attrs, blockName, id, innerBlocks, innerHTML } = block;

				if ( ! blockName ) {
					return <Typography key={ id } dangerouslySetInnerHTML={ { __html: innerHTML } } />;
				}
				const blockType = getBlockType( blockName );

				if ( ! blockType ) {
					return (
						<Typography key={ id }>
							<Notice status="warning" isDismissible={ false }>
								No block found matching name { blockName }.
							</Notice>
							<Typography dangerouslySetInnerHTML={ { __html: innerHTML } } />
						</Typography>
					);
				}

				return (
					<Typography key={ id }>
						{ getSaveElement(
							blockName,
							getBlockAttributes( blockType, innerHTML, attrs ),
							innerBlocks
						) }
					</Typography>
				);
			} ) }
		</>
	);
}
