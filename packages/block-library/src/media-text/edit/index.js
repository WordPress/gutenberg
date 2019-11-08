/**
 * External dependencies
 */
import { get, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { __experimentalBlockPatternPicker } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import MediaTextContainer from './media-text-container';

const createBlocksFromInnerBlocksTemplate = ( innerBlocksTemplate ) => {
	return map(
		innerBlocksTemplate,
		( [ name, attributes, innerBlocks = [] ] ) =>
			createBlock( name, attributes, createBlocksFromInnerBlocksTemplate( innerBlocks ) )
	);
};

const MediaTextEdit = ( props ) => {
	const { clientId, name } = props;
	const { blockType, defaultPattern, hasInnerBlocks, patterns } = useSelect( ( select ) => {
		const {
			__experimentalGetBlockPatterns,
			getBlockType,
			__experimentalGetDefaultBlockPattern,
		} = select( 'core/blocks' );

		return {
			blockType: getBlockType( name ),
			defaultPattern: __experimentalGetDefaultBlockPattern( name ),
			hasInnerBlocks: select( 'core/block-editor' ).getBlocks( clientId ).length > 0,
			patterns: __experimentalGetBlockPatterns( name ),
		};
	}, [ clientId, name ] );

	const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );

	if ( hasInnerBlocks ) {
		return (
			<MediaTextContainer { ...props } />
		);
	}

	return (
		<__experimentalBlockPatternPicker
			icon={ get( blockType, [ 'icon', 'src' ] ) }
			label={ get( blockType, [ 'title' ] ) }
			patterns={ patterns }
			onSelect={ ( nextPattern = defaultPattern ) => {
				if ( nextPattern.attributes ) {
					props.setAttributes( nextPattern.attributes );
				}
				if ( nextPattern.innerBlocks ) {
					replaceInnerBlocks(
						props.clientId,
						createBlocksFromInnerBlocksTemplate( nextPattern.innerBlocks )
					);
				}
			} }
			allowSkip
		/>
	);
};

export default MediaTextEdit;
