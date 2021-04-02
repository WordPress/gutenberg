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
		const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );
		// We need to override the attributes that can be set in the Placeholder.
		Object.assign( clonedBlocks[ 0 ].attributes.query, {
			inherit: query.inherit,
			postType: query.postType,
			perPage: null,
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
