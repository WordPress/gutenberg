/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { registerStore, useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { registerFormatType, applyFormat } from '@wordpress/rich-text';

/**
 * Enables the rendering of peer block selections.
 */
export default function addBlockSelections() {
	// Ideally, we should create a way of using hooks for
	// `__experimentalGetPropsForEditableTreePreparation`
	// so that we don't need a store to provide it with
	// peers. It could instead subscribe directly to all
	// `useBlockCollab` instances.
	registerStore( 'core/block-collab/add-block-selections', {
		reducer( state = {}, action ) {
			return action.type === 'SET_ADD_BLOCK_SELECTIONS_STATE'
				? action.state
				: state;
		},
		selectors: {
			getState( state ) {
				return state;
			},
		},
		actions: {
			setState( state ) {
				return {
					type: 'SET_ADD_BLOCK_SELECTIONS_STATE',
					state,
				};
			},
		},
	} );

	// Block outlines.
	addFilter(
		'editor.BlockListBlock',
		'core/block-collab/add-block-selections',
		( OriginalComponent ) => ( { className, ...props } ) => {
			const isPeerSelected = useSelect(
				( select ) =>
					Object.values(
						select(
							'core/block-collab/add-block-selections'
						).getState()
					).some(
						( peer ) =>
							peer.selectionStart?.clientId === props.clientId &&
							peer.selectionEnd?.clientId === props.clientId
					),
				[ props.clientId ]
			);
			return (
				<OriginalComponent
					{ ...props }
					className={ classnames(
						className,
						'block-collab-add-block-selections__block',
						{
							'is-peer-selected': isPeerSelected,
						}
					) }
				/>
			);
		}
	);

	// Text carets.
	registerFormatType( 'core/block-collab-add-block-selections', {
		title: 'Peer Caret',
		tagName: 'mark',
		className: 'block-collab-add-block-selections--caret',
		attributes: {
			id: 'id',
			className: 'class',
		},
		edit() {
			return null;
		},
		__experimentalGetPropsForEditableTreePreparation(
			select,
			{ richTextIdentifier, blockClientId }
		) {
			return {
				peers: Object.values(
					select(
						'core/block-collab/add-block-selections'
					).getState()
				)
					.filter(
						( peer ) =>
							peer.selectionStart?.attributeKey ===
								richTextIdentifier &&
							peer.selectionStart.clientId === blockClientId &&
							peer.selectionEnd?.clientId === blockClientId
					)
					.map( ( peer ) => ( {
						peerId: peer.peerId,
						selectionStartOffset: peer.selectionStart.offset,
						selectionEndOffset: peer.selectionEnd.offset,
					} ) ),
			};
		},
		__experimentalCreatePrepareEditableTree( { peers } ) {
			return ( formats, text ) =>
				peers.reduce(
					(
						record,
						{ peerId, selectionStartOffset, selectionEndOffset }
					) => {
						const isCollapsed =
							selectionStartOffset === selectionEndOffset;
						const isAtEnd =
							isCollapsed &&
							selectionEndOffset >= record.text.length;

						if ( isAtEnd )
							selectionStartOffset = record.text.length - 1;
						if ( isCollapsed )
							selectionEndOffset = selectionStartOffset + 1;

						return applyFormat(
							record,
							{
								type: 'core/block-collab-add-block-selections',
								attributes: {
									id: `block-collab-add-block-selections--caret_${ peerId }`,
									class: classnames( {
										'is-collapsed': isCollapsed,
										'is-at-end': isAtEnd,
									} ),
								},
							},
							selectionStartOffset,
							selectionEndOffset
						);
					},
					{ formats, text }
				).formats;
		},
	} );
}
