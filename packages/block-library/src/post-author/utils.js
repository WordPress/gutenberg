/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Generate Author-related blocks based on block attributes.
 *
 * @param {Object} attributes Block's attributes.
 *
 * @return {Object} Generated block.
 */
export function migrateToRecommendedBlocks( attributes ) {
	const {
		avatarSize,
		byline,
		showBio,
		isLink,
		linkTarget,
		textAlign,
		style,
		...restAttributes
	} = attributes;

	return createBlock(
		'core/group',
		{
			...restAttributes,
			style: {
				...style,
				color: {
					...style?.color,
					// Duotone must be applied to the avatar block.
					duotone: undefined,
				},
			},
			layout: {
				type: 'flex',
				flexWrap: 'nowrap',
				verticalAlignment: 'top',
			},
		},
		[
			showBio &&
				createBlock( 'core/avatar', {
					size: avatarSize,
					style: {
						border: {
							radius: '0px',
						},
						color: {
							duotone: style?.color?.duotone,
						},
					},
				} ),
			createBlock(
				'core/group',
				{
					style: {
						layout: {
							selfStretch: 'fill',
							flexSize: null,
						},
					},
					layout: {
						type: 'flex',
						orientation: 'vertical',
						justifyContent: textAlign,
					},
				},
				[
					createBlock( 'core/paragraph', {
						content: byline,
						placeholder: __( 'Write byline…' ),
						style: {
							typography: {
								fontSize: '0.5em',
							},
						},
					} ),
					createBlock( 'core/post-author-name', {
						isLink,
						linkTarget,
						style: {
							typography: {
								fontSize: '1em',
							},
						},
					} ),
					createBlock( 'core/post-author-biography', {
						style: {
							typography: {
								fontSize: '0.7em',
							},
						},
					} ),
				]
			),
		].filter( Boolean )
	);
}
