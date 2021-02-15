/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { SelectControl, ToggleControl } from '@wordpress/components';
import {
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import BlockSetup from './block-setup';
import LayoutSetupStep from './block-setup/layout-step';
import { usePostTypes } from '../utils';

const QueryBlockSetup = ( {
	clientId,
	attributes: { query },
	setAttributes,
	name: blockName,
} ) => {
	const { postType, inherit } = query;
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const { blockType } = useSelect(
		( select ) => {
			const { getBlockType } = select( blocksStore );
			return { blockType: getBlockType( blockName ) };
		},
		[ blockName ]
	);
	const { postTypesSelectOptions } = usePostTypes();
	const updateQuery = ( newQuery ) =>
		setAttributes( { query: { ...query, ...newQuery } } );

	const onFinish = ( innerBlocks ) => {
		if ( innerBlocks ) {
			replaceInnerBlocks(
				clientId,
				createBlocksFromInnerBlocksTemplate( innerBlocks ),
				false
			);
		}
	};
	const onVariationSelect = ( nextVariation ) => {
		if ( nextVariation.attributes ) {
			setAttributes( nextVariation.attributes );
		}
		if ( nextVariation.innerBlocks ) {
			onFinish( nextVariation.innerBlocks );
		}
	};
	const onBlockPatternSelect = ( blocks ) => {
		onFinish( [ [ 'core/query-loop', {}, blocks ] ] );
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
		<BlockSetup icon={ blockType?.icon?.src } label={ blockType?.title }>
			<>
				<LayoutSetupStep
					blockType={ blockType }
					onVariationSelect={ onVariationSelect }
					onBlockPatternSelect={ onBlockPatternSelect }
				/>
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
			</>
		</BlockSetup>
	);
};

export default QueryBlockSetup;
