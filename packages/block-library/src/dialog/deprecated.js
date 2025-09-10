/**
 * WordPress Dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

export default [
	{
		attributes: {
			dialogId: {
				type: 'string',
				default: '',
			},
			dialogType: {
				type: 'string',
				enum: ['dialog', 'modal'],
				default: 'modal',
			},
			autoActivateOnRender: {
				type: 'boolean',
				default: false,
			},
			animation: {
				type: 'string',
				enum: [
					'fade',
					'pop',
					'bounce',
					'slide',
					'slide-up',
					'slide-left',
					'slide-right',
					'zoom',
				],
				default: 'fade',
			},
			animationDuration: {
				type: 'number',
				default: 500,
			},
			autoActivationTimer: {
				type: 'number',
				default: -1,
			},
			enableDeepLink: {
				type: 'boolean',
				default: false,
			},
			dialogSize: {
				type: 'string',
				enum: ['small', 'medium', 'large'],
				default: 'small',
			},
		},
		migrate(attributes, innerBlocks) {
			const {
				dialogId,
				dialogType,
				autoActivateOnRender,
				animation,
				animationDuration,
				autoActivationTimer,
				enableDeepLink,
				dialogSize,
			} = attributes;

			// Move all attributes except dialogId to the dialog-element block
			const newInnerBlocks = innerBlocks.map((block) => {
				if (block.name === 'prc-block/dialog-element') {
					return createBlock(
						'prc-block/dialog-element',
						{
							...block.attributes,
							dialogType,
							autoActivateOnRender,
							animation,
							animationDuration,
							autoActivationTimer,
							enableDeepLink,
							dialogSize,
						},
						block.innerBlocks
					);
				}
				return block;
			});

			return [
				{
					dialogId,
				},
				newInnerBlocks,
			];
		},
		save() {
			return InnerBlocks.Content();
		},
		isEligible(attributes) {
			// Check if any of the moved attributes exist on the dialog block
			return !!(
				attributes.dialogType ||
				attributes.autoActivateOnRender ||
				attributes.animation ||
				attributes.animationDuration ||
				attributes.autoActivationTimer ||
				attributes.enableDeepLink ||
				attributes.dialogSize
			);
		},
	},
];
