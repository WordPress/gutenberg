/**
 * WordPress dependencies
 */
import { postComments as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';

const { name } = metadata;
export { metadata, name };

const TEMPLATE = [
	[ 'core/comments-title' ],
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
							[
								'core/comment-author-name',
								{
									fontSize: 'small',
								},
							],
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
									[
										'core/comment-date',
										{
											fontSize: 'small',
										},
									],
									[
										'core/comment-edit-link',
										{
											fontSize: 'small',
										},
									],
								],
							],
							[ 'core/comment-content' ],
							[
								'core/comment-reply-link',
								{
									fontSize: 'small',
								},
							],
						],
					],
				],
			],
		],
	],
	[ 'core/comments-pagination' ],
	[ 'core/post-comments-form' ],
];

export const settings = {
	icon,
	example: {},
	template: TEMPLATE,
	edit,
	save,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
