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

export default TEMPLATE;
