/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

/**
 * Generate Author-related blocks based on block attributes.
 *
 * @param {Object} attributes Block's attributes.
 * @param {Object} blockTypes Block types.
 * @return {Object} Generated block.
 */
export function recreateWithRecommendedBlocks( attributes, blockTypes ) {
	const {
		avatarSize,
		byline,
		showAvatar,
		showBio,
		isLink,
		linkTarget,
		textAlign,
		style,
		...restAttributes
	} = attributes;

	const shouldInsertAvatarBlock =
		showAvatar &&
		blockTypes.some( ( blockType ) => blockType.name === 'core/avatar' );
	const shouldInsertParagraphBlock =
		byline &&
		blockTypes.some( ( blockType ) => blockType.name === 'core/paragraph' );
	const shouldInsertPostAuthorNameBlock = blockTypes.some(
		( blockType ) => blockType.name === 'core/post-author-name'
	);
	const shouldInsertPostAuthorBiographyBlock =
		showBio &&
		blockTypes.some(
			( blockType ) => blockType.name === 'core/post-author-biography'
		);

	return createBlock(
		'core/group',
		{
			...restAttributes,
			style: cleanEmptyObject( {
				...style,
				spacing: {
					...style?.spacing,
					blockGap: '1em',
				},
				color: {
					...style?.color,
					// Duotone must be applied to the avatar block.
					duotone: undefined,
				},
			} ),
			layout: {
				type: 'flex',
				flexWrap: 'nowrap',
				verticalAlignment: 'top',
			},
		},
		[
			shouldInsertAvatarBlock &&
				createBlock( 'core/avatar', {
					size: avatarSize,
					style: cleanEmptyObject( {
						border: {
							radius: '0px',
						},
						color: {
							duotone: style?.color?.duotone,
						},
					} ),
				} ),
			createBlock(
				'core/group',
				{
					style: {
						layout: {
							selfStretch: 'fill',
							flexSize: null,
						},
						spacing: {
							blockGap: '0',
						},
					},
					layout: {
						type: 'flex',
						orientation: 'vertical',
						justifyContent: 'stretch',
					},
				},
				[
					shouldInsertParagraphBlock &&
						createBlock( 'core/paragraph', {
							content: byline,
							placeholder: __( 'Write byline…' ),
							style: {
								typography: {
									fontSize: '0.5em',
									textAlign,
								},
							},
						} ),
					shouldInsertPostAuthorNameBlock &&
						createBlock( 'core/post-author-name', {
							isLink,
							linkTarget,
							style: {
								typography: {
									fontSize: '1em',
									textAlign,
								},
							},
						} ),
					shouldInsertPostAuthorBiographyBlock &&
						createBlock( 'core/post-author-biography', {
							style: {
								typography: {
									fontSize: '0.7em',
									textAlign,
								},
							},
						} ),
				].filter( Boolean )
			),
		].filter( Boolean )
	);
}
