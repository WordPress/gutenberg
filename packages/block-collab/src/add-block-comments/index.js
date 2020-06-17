/**
 * External dependencies
 */
import classnames from 'classnames';
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { useState } from '@wordpress/element';
import {
	BlockControls,
	useBlockEditContext,
	RichTextToolbarButton,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton, Popover } from '@wordpress/components';
import { comment } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { registerFormatType, applyFormat } from '@wordpress/rich-text';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Comments from './comments';

/**
 * Enables block and inline editor comments.
 */
export default function addBlockComments() {
	// Block comments.
	addFilter(
		'blocks.registerBlockType',
		'core/block-collab/add-block-comments',
		( settings ) => ( {
			...settings,
			attributes: {
				...settings.attributes,
				_comments: { type: 'array' },
				_inlineComments: { type: 'object' },
			},
		} )
	);
	addFilter(
		'editor.BlockEdit',
		'core/block-collab/add-block-comments',
		( OriginalComponent ) => ( props ) => {
			const [ isDrafting, setIsDrafting ] = useState();
			return (
				<>
					<BlockControls>
						<ToolbarGroup>
							<ToolbarButton
								icon={ comment }
								label={ __( 'New Comment' ) }
								onClick={ () => setIsDrafting( true ) }
							/>
						</ToolbarGroup>
					</BlockControls>
					{ props.isSelected &&
						( props.attributes._comments?.length ||
							isDrafting ) && (
							<Popover
								position="bottom left right"
								focusOnMount={ false }
								getAnchorRect={ () =>
									document
										.getElementById(
											`block-${ props.clientId }`
										)
										.getBoundingClientRect()
								}
							>
								<Comments
									comments={ props.attributes._comments }
									setComments={ ( _comments ) =>
										props.setAttributes( { _comments } )
									}
									cancelDraft={
										isDrafting &&
										( () => setIsDrafting( false ) )
									}
								/>
							</Popover>
						) }
					<OriginalComponent { ...props } />
				</>
			);
		}
	);
	addFilter(
		'editor.BlockListBlock',
		'core/block-collab/add-block-comments',
		( OriginalComponent ) => ( { className, ...props } ) => (
			<OriginalComponent
				{ ...props }
				className={ classnames(
					className,
					'block-collab-add-block-comments__block',
					{
						'is-commented': props.attributes._comments?.length,
					}
				) }
			/>
		)
	);

	// Inline comments.
	registerFormatType( 'core/block-collab-add-block-comments', {
		title: 'Comment',
		tagName: 'span',
		className: 'block-collab-add-block-comments--inline-comment',
		attributes: {
			id: 'id',
		},
		edit: function Edit( {
			richTextIdentifier,
			activeAttributes,
			isActive,
			value,
		} ) {
			const { clientId } = useBlockEditContext();
			const { _inlineComments } = useSelect(
				( select ) =>
					select( 'core/block-editor' ).getBlockAttributes(
						clientId
					),
				[ clientId ]
			);
			const { updateBlockAttributes } = useDispatch(
				'core/block-editor'
			);

			const [ isDrafting, setIsDrafting ] = useState();
			const comments =
				_inlineComments?.[ richTextIdentifier ]?.[ activeAttributes.id ]
					?.comments;
			return (
				<>
					<RichTextToolbarButton
						icon={ comment }
						title={ __( 'New Inline Comment' ) }
						isActive={ isActive }
						onClick={ () => {
							if ( ! isActive ) {
								const id = uuid();
								updateBlockAttributes( clientId, {
									_inlineComments: {
										..._inlineComments,
										[ richTextIdentifier ]: {
											..._inlineComments?.[
												richTextIdentifier
											],
											[ id ]: {
												id,
												start: value.start,
												end: value.end,
												comments: [],
											},
										},
									},
								} );
							}
							setIsDrafting( true );
						} }
					/>
					{ ( comments?.length || isDrafting ) && (
						<Popover
							position="bottom left right"
							focusOnMount={ false }
							getAnchorRect={ () =>
								document
									.getElementById( activeAttributes.id )
									.getBoundingClientRect()
							}
						>
							<Comments
								comments={ comments }
								setComments={ ( newComments ) =>
									updateBlockAttributes( clientId, {
										_inlineComments: {
											..._inlineComments,
											[ richTextIdentifier ]: {
												..._inlineComments[
													richTextIdentifier
												],
												[ activeAttributes.id ]: {
													..._inlineComments[
														richTextIdentifier
													][ activeAttributes.id ],
													comments: newComments,
												},
											},
										},
									} )
								}
								cancelDraft={
									isDrafting &&
									( () => setIsDrafting( false ) )
								}
							/>
						</Popover>
					) }
				</>
			);
		},
		__experimentalGetPropsForEditableTreePreparation(
			select,
			{ blockClientId }
		) {
			return {
				blockAttributes: select(
					'core/block-editor'
				).getBlockAttributes( blockClientId ),
			};
		},
		__experimentalCreatePrepareEditableTree(
			{ blockAttributes },
			{ richTextIdentifier }
		) {
			return ( formats, text ) =>
				Object.values(
					blockAttributes._inlineComments?.[ richTextIdentifier ] ||
						{}
				).reduce(
					( record, { id, start, end } ) =>
						applyFormat(
							record,
							{
								type: 'core/block-collab-add-block-comments',
								attributes: {
									id,
								},
							},
							start,
							end
						),
					{ formats, text }
				).formats;
		},
		__experimentalGetPropsForEditableTreeChangeHandler( dispatch ) {
			return {
				updateBlockAttributes: dispatch( 'core/block-editor' )
					.updateBlockAttributes,
			};
		},
		__experimentalCreateOnChangeEditableValue(
			{ blockAttributes, updateBlockAttributes },
			{ richTextIdentifier, blockClientId }
		) {
			return ( formats ) => {
				const positions = formats.reduce(
					( acc, characterFormats, index ) =>
						characterFormats
							.filter(
								( { type } ) =>
									type ===
									'core/block-collab-add-block-comments'
							)
							.reduce( ( _acc, { attributes: { id } } ) => {
								if ( ! _acc[ id ] )
									_acc[ id ] = {
										start: index,
									};
								_acc[ id ].end = index + 1;
								return _acc;
							}, acc ),
					{}
				);

				const inlineComments =
					blockAttributes._inlineComments?.[ richTextIdentifier ] ||
					{};
				const newInlineComments = Object.values(
					inlineComments
				).reduce( ( acc, { id, start, end } ) => {
					if ( ! positions[ id ] ) {
						acc = { ...acc };
						delete acc[ id ];
						return acc;
					}

					if (
						start !== positions[ id ].start ||
						end !== positions[ id ].end
					)
						return {
							...acc,
							[ id ]: {
								...acc[ id ],
								start: positions[ id ].start,
								end: positions[ id ].end,
							},
						};

					return acc;
				}, inlineComments );

				if ( inlineComments !== newInlineComments )
					updateBlockAttributes( blockClientId, {
						_inlineComments: {
							...blockAttributes._inlineComments,
							[ richTextIdentifier ]: newInlineComments,
						},
					} );
			};
		},
	} );
}
