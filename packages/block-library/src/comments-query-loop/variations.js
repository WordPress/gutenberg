/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/** @typedef {import('@wordpress/blocks').WPBlockVariation} WPBlockVariation */

/**
 * Template option choices for predefined columns layouts.
 *
 * @type {WPBlockVariation[]}
 */
const variations = [
	{
		name: 'one-column-full',
		title: __( 'One column' ),
		description: __( 'Everything in one column' ),
		icon: (
			<SVG
				width="48"
				height="48"
				viewBox="0 0 48 48"
				xmlns="http://www.w3.org/2000/svg"
			>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="m39.0625 14h-30.0625v20.0938h30.0625zm-30.0625-2c-1.10457 0-2 .8954-2 2v20.0938c0 1.1045.89543 2 2 2h30.0625c1.1046 0 2-.8955 2-2v-20.0938c0-1.1046-.8954-2-2-2z"
				/>
			</SVG>
		),
		innerBlocks: [
			[
				'core/comment-template',
				{},
				[
					[
						'core/group',
						{
							style: {
								spacing: {
									margin: { top: '1.5em', bottom: '1.5em' },
									blockGap: '0px',
								},
							},
						},
						[
							[ 'core/avatar' ],
							[ 'core/comment-author-name' ],
							[ 'core/comment-date' ],
							[
								'core/comment-content',
								{
									style: {
										spacing: {
											padding: {
												top: '0.5em',
												bottom: '0.5em',
											},
										},
									},
								},
							],
							[ 'core/comment-reply-link' ],
							[ 'core/comment-edit-link' ],
						],
					],
				],
			],
			[ 'core/comments-pagination' ],
		],
		scope: [ 'block' ],
	},
	{
		name: 'two-columns-equal',
		title: __( 'Two columns' ),
		description: __( 'Two columns; left-side avatar' ),
		icon: (
			<SVG
				width="48"
				height="48"
				viewBox="0 0 48 48"
				xmlns="http://www.w3.org/2000/svg"
			>
				<Path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M39 12C40.1046 12 41 12.8954 41 14V34C41 35.1046 40.1046 36 39 36H9C7.89543 36 7 35.1046 7 34V14C7 12.8954 7.89543 12 9 12H39ZM39 34V14H25V34H39ZM23 34H9V14H23V34Z"
				/>
			</SVG>
		),
		isDefault: true,
		innerBlocks: [
			[
				'core/comment-template',
				{},
				[
					[
						'core/columns',
						{},
						[
							[
								'core/column',
								{ width: '40px' },
								[
									[
										'core/avatar',
										{
											size: 40,
											style: {
												border: { radius: '20px' },
											},
										},
									],
								],
							],
							[
								'core/column',
								{},
								[
									[ 'core/comment-author-name' ],
									[
										'core/group',
										{
											layout: { type: 'flex' },
											style: {
												spacing: {
													margin: {
														top: '0px',
														bottom: '0px',
													},
												},
											},
										},
										[
											[ 'core/comment-date' ],
											[ 'core/comment-edit-link' ],
										],
									],
									[ 'core/comment-content' ],
									[ 'core/comment-reply-link' ],
								],
							],
						],
					],
				],
			],
			[ 'core/comments-pagination' ],
		],
		scope: [ 'block' ],
	},
];

export default variations;
