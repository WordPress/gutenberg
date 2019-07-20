/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';
import { parse, serialize } from '@wordpress/blocks';

export default function TemplatePartEdit( { attributes, clientId } ) {
	const { id } = attributes;

	const {
		rawTemplatePartContent,
		newBlocks,
	} = useSelect( ( select ) => {
		return {
			rawTemplatePartContent: get(
				select( 'core' ).getEntityRecord( 'postType', 'wp_template', id ),
				[ 'content', 'raw' ]
			),
			newBlocks: select( 'core/block-editor' ).getBlocks( clientId ),
		};
	}, [ id, clientId ] );
	const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );
	useEffect(
		() => {
			if ( ! rawTemplatePartContent ) {
				return;
			}
			replaceInnerBlocks( clientId, parse( rawTemplatePartContent ) );
		},
		[ rawTemplatePartContent, replaceInnerBlocks ]
	);
	const newRawTemplatePartContent = useMemo( () => ( serialize( newBlocks ) ), [ newBlocks ] );
	const DEBUG = false;
	const innerBlocks = (
		<InnerBlocks
			templateLock={ false }
		/>
	);
	if ( DEBUG ) {
		return (
			<div>
				<div>{ newRawTemplatePartContent === rawTemplatePartContent ? 'IS NOT DIRTY' : 'IS DIRTY' }</div>
				{ innerBlocks }
			</div>
		);
	}
	return innerBlocks;
}
