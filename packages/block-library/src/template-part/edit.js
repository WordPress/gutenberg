/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { InnerBlocks, InspectorControls } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';
import { parse, serialize } from '@wordpress/blocks';
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function TemplatePartEdit( { attributes, clientId, setAttributes } ) {
	const { id } = attributes;

	const {
		rawTemplatePartContent,
		newBlocks,
		templatePartTitle,
		hasInnerBlocks,
	} = useSelect( ( select ) => {
		const template = id && select( 'core' ).getEntityRecord( 'postType', 'wp_template', id );
		const blocks = select( 'core/block-editor' ).getBlocks( clientId );
		return {
			rawTemplatePartContent: get( template, [ 'content', 'raw' ] ),
			newBlocks: blocks,
			templatePartTitle: get( template, [ 'title', 'raw' ] ),
			hasInnerBlocks: blocks && blocks.length > 0,
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
	useEffect(
		() => {
			setAttributes( { name: templatePartTitle } );
		},
		[ templatePartTitle ]
	);
	const newRawTemplatePartContent = useMemo( () => ( serialize( newBlocks ) ), [ newBlocks ] );
	const DEBUG = false;
	const innerBlocks = (
		<InnerBlocks
			templateLock={ false }
			renderAppender={ ! hasInnerBlocks && InnerBlocks.ButtonBlockAppender }
		/>
	);
	return (
		<div>
			<InspectorControls>
				<TextControl
					label={ __( 'Template part name' ) }
					value={ attributes.name }
					onChange={ ( value ) => ( setAttributes( { name: value } ) ) }
				/>
			</InspectorControls>
			{ DEBUG && ( <div>{ newRawTemplatePartContent === rawTemplatePartContent ? 'IS NOT DIRTY' : 'IS DIRTY' }</div> ) }
			{ innerBlocks }
		</div>
	);
}
