/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { grid as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			products: [
				{
					id: 'example-product-a',
					title: __( 'Basic' ),
					imageUrl: '',
					imageId: 0,
					imageAlt: '',
					url: '',
					description: '',
				},
				{
					id: 'example-product-b',
					title: __( 'Pro' ),
					imageUrl: '',
					imageId: 0,
					imageAlt: '',
					url: '',
					description: '',
				},
			],
			features: [
				{
					id: 'example-feature-1',
					label: __( 'Cloud storage' ),
					url: '',
					defaultValue: 'tick',
					backgroundColor: '',
					textColor: '',
					iconColor: '',
				},
				{
					id: 'example-feature-2',
					label: __( 'Priority support' ),
					url: '',
					defaultValue: 'cross',
					backgroundColor: '',
					textColor: '',
					iconColor: '',
				},
				{
					id: 'example-feature-3',
					label: __( 'Custom domain' ),
					url: '',
					defaultValue: '',
					backgroundColor: '',
					textColor: '',
					iconColor: '',
				},
			],
			cells: {
				'example-feature-2_example-product-b': {
					type: 'icon',
					value: 'tick',
					text: '',
					footnoteIds: [],
				},
				'example-feature-3_example-product-a': {
					type: 'icon',
					value: 'cross',
					text: '',
					footnoteIds: [],
				},
				'example-feature-3_example-product-b': {
					type: 'icon',
					value: 'tick',
					text: '',
					footnoteIds: [],
				},
			},
			footnotes: [],
			headerDisplay: 'title',
			featurePosition: 'left',
			stickyFirstColumn: false,
			alternateRowColors: false,
			hoverHighlight: 'none',
			rotateHeaders: false,
			headerRotationAngle: -45,
			footnoteStyle: 'numeric',
			footnoteDisplay: 'superscript',
		},
		viewportWidth: 600,
	},
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
