/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const Team = {
	// translators: title for "Team" page template
	name: __( 'Team' ),
	key: 'team',
	icon: '👥',
	content: [
		{
			name: 'core/paragraph',
			attributes: {
				align: 'left',
				// translators: sample content for "Team" page template
				content: __(
					'We are a small team of talented professionals with a wide range of skills and experience. We love what we do, and we do it with passion. We look forward to working with you.'
				),
			},
		},
		{
			name: 'core/spacer',
			attributes: {
				height: 24,
			},
		},
		{
			name: 'core/media-text',
			attributes: {
				align: 'wide',
				mediaAlt: '',
				mediaPosition: 'left',
				mediaUrl:
					'https://a8ctm1.files.wordpress.com/2019/08/adult.jpg?w=640',
				mediaType: 'image',
				mediaWidth: 50,
				isStackedOnMobile: true,
			},
			innerBlocks: [
				{
					name: 'core/heading',
					attributes: {
						align: 'left',
						// translators: sample content for "Team" page template
						content: __( 'Sally Smith' ),
						level: 2,
					},
				},
				{
					name: 'core/paragraph',
					attributes: {
						align: 'left',
						// translators: sample content for "Team" page template
						content: `<em>${ __( 'Position or Job Title' ) }</em>`,
						dropCap: false,
						customFontSize: 16,
					},
				},
				{
					name: 'core/paragraph',
					attributes: {
						align: 'left',
						// translators: sample content for "Team" page template
						content: __(
							'A short bio with personal history, key achievements, or an interesting fact.'
						),
						dropCap: false,
						customFontSize: 16,
					},
				},
				{
					name: 'core/paragraph',
					attributes: {
						align: 'left',
						// translators: sample content for "Team" page template
						content: __(
							'Email me: <a href="mailto:mail@example.com">mail@example.com</a>'
						),
						dropCap: false,
						customFontSize: 16,
					},
				},
			],
		},
		{
			name: 'core/media-text',
			attributes: {
				align: 'wide',
				mediaAlt: '',
				mediaPosition: 'right',
				mediaUrl:
					'https://a8ctm1.files.wordpress.com/2019/08/activity.jpg?w=640',
				mediaType: 'image',
				mediaWidth: 50,
				isStackedOnMobile: true,
			},
			innerBlocks: [
				{
					name: 'core/heading',
					attributes: {
						align: 'left',
						// translators: sample content for "Team" page template
						content: __( 'Juan Pérez' ),
						level: 2,
					},
				},
				{
					name: 'core/paragraph',
					attributes: {
						align: 'left',
						// translators: sample content for "Team" page template
						content: `<em>${ __( 'Position or Job Title' ) }</em>`,
						dropCap: false,
						customFontSize: 16,
					},
				},
				{
					name: 'core/paragraph',
					attributes: {
						align: 'left',
						// translators: sample content for "Team" page template
						content: __(
							'A short bio with personal history, key achievements, or an interesting fact.'
						),
						dropCap: false,
						customFontSize: 16,
					},
				},
				{
					name: 'core/paragraph',
					attributes: {
						align: 'left',
						// translators: sample content for "Team" page template
						content: __(
							'Email me: <a href="mailto:mail@example.com">mail@example.com</a>'
						),
						dropCap: false,
						customFontSize: 16,
					},
				},
			],
		},
		{
			name: 'core/media-text',
			attributes: {
				align: 'wide',
				mediaAlt: '',
				mediaPosition: 'left',
				mediaUrl:
					'https://a8ctm1.files.wordpress.com/2019/08/corgi-1.jpg?w=640',
				mediaType: 'image',
				mediaWidth: 50,
				isStackedOnMobile: true,
			},
			innerBlocks: [
				{
					name: 'core/heading',
					attributes: {
						align: 'left',
						// translators: sample content for "Team" page template
						content: __( 'Samuel the Dog' ),
						level: 2,
					},
				},
				{
					name: 'core/paragraph',
					attributes: {
						align: 'left',
						// translators: sample content for "Team" page template
						content: `<em>${ __( 'Position or Job Title' ) }</em>`,
						dropCap: false,
						customFontSize: 16,
					},
				},
				{
					name: 'core/paragraph',
					attributes: {
						align: 'left',
						// translators: sample content for "Team" page template
						content: __(
							'A short bio with personal history, key achievements, or an interesting fact.'
						),
						dropCap: false,
						customFontSize: 16,
					},
				},
				{
					name: 'core/paragraph',
					attributes: {
						align: 'left',
						// translators: sample content for "Team" page template
						content: __(
							'Email me: <a href="mailto:mail@example.com">mail@example.com</a>'
						),
						dropCap: false,
						customFontSize: 16,
					},
				},
			],
		},
		{
			name: 'core/spacer',
			attributes: {
				height: 24,
			},
		},
		{
			name: 'core/separator',
			attributes: {},
		},
		{
			name: 'core/spacer',
			attributes: {
				height: 24,
			},
		},
		{
			name: 'core/heading',
			attributes: {
				align: 'center',
				// translators: sample content for "Team" page template
				content: __( 'Want to work with us?' ),
				level: 2,
			},
		},
		{
			name: 'core/buttons',
			"attributes": {
				"align": "center"
			},
			innerBlocks: [
				{
					name: 'core/button',
					attributes: {
						url: '',
						// translators: sample content for "Team" page template
						text: __( 'Get in Touch' ),
						borderRadius: 4,
						className: 'aligncenter',
					},
				},
			],
		},
		{
			name: 'core/spacer',
			attributes: {
				height: 24,
			},
		},
		{
			name: 'core/separator',
			attributes: {},
		},
	],
};

export default Team;
