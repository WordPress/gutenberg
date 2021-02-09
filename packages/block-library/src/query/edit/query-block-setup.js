/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { SelectControl, ToggleControl } from '@wordpress/components';
import { createBlocksFromInnerBlocksTemplate } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockSetup from './block-setup';

const QueryBlockSetup = ( {
	clientId,
	attributes: { query },
	setAttributes,
	name,
} ) => {
	const { postType, inherit } = query;
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const { postTypes } = useSelect( ( select ) => {
		const { getPostTypes } = select( 'core' );
		const excludedPostTypes = [ 'attachment' ];
		const filteredPostTypes = getPostTypes( { per_page: -1 } )?.filter(
			( { viewable, slug } ) =>
				viewable && ! excludedPostTypes.includes( slug )
		);
		return {
			postTypes: filteredPostTypes,
		};
	}, [] );
	const updateQuery = ( newQuery ) =>
		setAttributes( { query: { ...query, ...newQuery } } );
	const postTypesSelectOptions = useMemo(
		() =>
			( postTypes || [] ).map( ( { labels, slug } ) => ( {
				label: labels.singular_name,
				value: slug,
			} ) ),
		[ postTypes ]
	);
	const onFinish = ( innerBlocks ) => {
		if ( innerBlocks ) {
			replaceInnerBlocks(
				clientId,
				createBlocksFromInnerBlocksTemplate( innerBlocks ),
				false
			);
		}
	};
	const blockSetupProps = {
		// label: __( 'Set me up :)' ),
		canSkip: true,
		onSkip: () => {},
		steps: [
			{
				instructions: __( 'Basic setup' ),
				content: (
					<div className="block-attributes-setup-container">
						<ToggleControl
							label={ __( 'Inherit query from URL' ) }
							checked={ !! inherit }
							onChange={ ( value ) =>
								updateQuery( { inherit: !! value } )
							}
							help={ __(
								'Disable the option to customize the query arguments. Leave enabled to inherit the global query depending on the URL.'
							) }
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
				),
			},
			{
				instructions: __(
					'Select a block variation or a block pattern to start with'
				),
				useLayoutSetupStep: true,
				onVariationSelect: ( nextVariation ) => {
					if ( nextVariation.attributes ) {
						setAttributes( nextVariation.attributes );
					}
					if ( nextVariation.innerBlocks ) {
						onFinish( nextVariation.innerBlocks );
					}
				},
				showBlockPatterns: true,
				onBlockPatternSelect: ( blocks ) => {
					onFinish( [ [ 'core/query-loop', {}, blocks ] ] );
				},
			},
		],
	};
	return <BlockSetup blockName={ name } { ...blockSetupProps } />;
};

export default QueryBlockSetup;
