/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	headingLevel1,
	headingLevel2,
	headingLevel3,
	headingLevel4,
	headingLevel5,
	headingLevel6,
} from '@wordpress/icons';

const variations = [
	{
		name: 'heading-1',
		title: __( 'Heading 1' ),
		icon: headingLevel1,
		attributes: { level: 1 },
		scope: [ 'transform', 'hidden' ],
		isActive: ( blockAttributes ) => blockAttributes.level === 1,
	},
	{
		name: 'heading-2',
		title: __( 'Heading 2' ),
		icon: headingLevel2,
		attributes: { level: 2 },
		scope: [ 'transform', 'hidden' ],
		isActive: ( blockAttributes ) => blockAttributes.level === 2,
	},
	{
		name: 'heading-3',
		title: __( 'Heading 3' ),
		icon: headingLevel3,
		attributes: { level: 3 },
		scope: [ 'transform', 'hidden' ],
		isActive: ( blockAttributes ) => blockAttributes.level === 3,
	},
	{
		name: 'heading-4',
		title: __( 'Heading 4' ),
		icon: headingLevel4,
		attributes: { level: 4 },
		scope: [ 'transform', 'hidden' ],
		isActive: ( blockAttributes ) => blockAttributes.level === 4,
	},
	{
		name: 'heading-5',
		title: __( 'Heading 5' ),
		icon: headingLevel5,
		attributes: { level: 5 },
		scope: [ 'transform', 'hidden' ],
		isActive: ( blockAttributes ) => blockAttributes.level === 5,
	},
	{
		name: 'heading-6',
		title: __( 'Heading 6' ),
		icon: headingLevel6,
		attributes: { level: 6 },
		scope: [ 'transform', 'hidden' ],
		isActive: ( blockAttributes ) => blockAttributes.level === 6,
	},
];

export default variations;
