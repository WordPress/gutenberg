/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { gallery as icon } from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import save from './save';

import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	edit,
	save,
	icon,
	example: {
		innerBlocks: [
			{
				name: 'core/slide',
				innerBlocks: [
					{
						name: 'core/cover',
						attributes: {
							dimRatio: 100,
							overlayColor: 'black',
							minHeight: 300,
							minHeightUnit: 'px',
						},
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: {
									content: __( 'Slide 1' ),
									style: {
										typography: {
											textAlign: 'center',
										},
									},
								},
							},
						],
					},
				],
			},
			{
				name: 'core/slide',
				innerBlocks: [
					{
						name: 'core/cover',
						attributes: {
							dimRatio: 100,
							overlayColor: 'black',
							minHeight: 300,
							minHeightUnit: 'px',
						},
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: {
									content: __( 'Slide 2' ),
									style: {
										typography: {
											textAlign: 'center',
										},
									},
								},
							},
						],
					},
				],
			},
		],
	},
};

export const init = () => {
	// Prevent nesting a slider inside another slider.
	const DISALLOWED_PARENTS = [ 'core/slider' ];
	addFilter(
		'blockEditor.__unstableCanInsertBlockType',
		'core/block-library/preventInsertingSliderIntoAnotherSlider',
		(
			canInsert,
			blockType,
			rootClientId,
			{ getBlock, getBlockParentsByBlockName }
		) => {
			if ( blockType.name !== 'core/slider' ) {
				return canInsert;
			}

			for ( const disallowedParentType of DISALLOWED_PARENTS ) {
				const hasDisallowedParent =
					getBlock( rootClientId )?.name === disallowedParentType ||
					getBlockParentsByBlockName(
						rootClientId,
						disallowedParentType
					).length;
				if ( hasDisallowedParent ) {
					return false;
				}
			}
			return true;
		}
	);

	return initBlock( { name, metadata, settings } );
};
