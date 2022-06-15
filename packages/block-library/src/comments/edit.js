/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import CommentsInspectorControls from './edit/comments-inspector-controls';

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
									style: {
										typography: { fontSize: '1rem' },
									},
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
											style: {
												typography: {
													fontSize: '1rem',
												},
											},
										},
									],
									[
										'core/comment-edit-link',
										{
											style: {
												typography: {
													fontSize: '1rem',
												},
											},
										},
									],
								],
							],
							[ 'core/comment-content' ],
							[
								'core/comment-reply-link',
								{
									style: {
										typography: { fontSize: '1rem' },
									},
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

export default function CommentsEdit( { attributes, setAttributes } ) {
	const { tagName: TagName } = attributes;

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );

	return (
		<>
			<CommentsInspectorControls
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
			<TagName { ...innerBlocksProps } />
		</>
	);
}
