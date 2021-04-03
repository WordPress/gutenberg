/**
 * External dependencies
 */
import { cloneDeep } from 'lodash';
/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { SelectControl, ToggleControl } from '@wordpress/components';
import {
	cloneBlock,
	createBlocksFromInnerBlocksTemplate,
} from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import BlockSetup from './block-setup';
import { usePostTypes } from '../utils';

const QueryBlockSetup = ( {
	clientId,
	attributes: { query },
	setAttributes,
	name: blockName,
} ) => {
	const { postType, inherit } = query;
	const { replaceBlocks, replaceInnerBlocks } = useDispatch(
		blockEditorStore
	);
	const { postTypesSelectOptions } = usePostTypes();
	const updateQuery = ( newQuery ) =>
		setAttributes( { query: { ...query, ...newQuery } } );
	const onVariationSelect = ( nextVariation ) => {
		if ( nextVariation.attributes ) {
			setAttributes( nextVariation.attributes );
		}
		if ( nextVariation.innerBlocks ) {
			replaceInnerBlocks(
				clientId,
				createBlocksFromInnerBlocksTemplate(
					nextVariation.innerBlocks
				),
				false
			);
		}
	};
	const onBlockPatternSelect = ( blocks ) => {
		const clonedBlocks = blocks.map( ( block ) => {
			const clone = cloneBlock( block );
			/**
			 * TODO: this check will be revised with the ongoing work on block patterns.
			 * For now we keep the value of posts per page (`query.perPage`) from Query patterns
			 * so as to preview the pattern as intended, without possible big previews.
			 * During insertion, we need to override the Query's attributes that can be set in
			 * the Placeholder and we unset the `perPage` value to be set appropriately by Query block.
			 */
			if ( block.name === 'core/query' ) {
				/**
				 * We need to `cloneDeep` the Query's attributes, as `cloneBlock` does a swallow
				 * copy of the block.
				 */
				const queryAttributes = cloneDeep( clone.attributes );
				Object.assign( queryAttributes.query, {
					inherit: query.inherit,
					postType: query.postType,
					perPage: null,
				} );
				return {
					...clone,
					attributes: queryAttributes,
				};
			}
			return clone;
		} );
		replaceBlocks( clientId, clonedBlocks );
	};
	const inheritToggleHelp = !! inherit
		? _x(
				'Inherit the global query depending on the URL.',
				'Query block `inherit` option helping text'
		  )
		: _x(
				'Customize the query arguments.',
				'Query block `inherit` option helping text'
		  );
	return (
		<BlockSetup
			blockName={ blockName }
			useLayoutSetup={ true }
			onVariationSelect={ onVariationSelect }
			onBlockPatternSelect={ onBlockPatternSelect }
		>
			<div className="block-attributes-setup-container">
				<ToggleControl
					label={ __( 'Inherit query from URL' ) }
					checked={ !! inherit }
					onChange={ ( value ) =>
						updateQuery( { inherit: !! value } )
					}
					help={ inheritToggleHelp }
				/>
				{ ! inherit && (
					<SelectControl
						options={ postTypesSelectOptions }
						value={ postType }
						label={ __( 'Post Type' ) }
						onChange={ ( newValue ) =>
							updateQuery( { postType: newValue } )
						}
					/>
				) }
			</div>
		</BlockSetup>
	);
};

export default QueryBlockSetup;
