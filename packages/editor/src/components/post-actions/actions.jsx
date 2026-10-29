import { useDispatch } from '@wordpress/data';
import { useMemo, useEffect } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { useEntityActions } from '../../dataviews/entity-actions-loader';

export function usePostActions( { postType, onActionPerformed, context } ) {
	const { actions: defaultActions, error } = useEntityActions( {
		kind: 'postType',
		name: postType,
	} );

	// Without its actions, a screen has no way to act on its items, so the
	// notice stays until it is dismissed. Its id keeps a single notice per
	// post type, however many components show the actions.
	const { createErrorNotice } = useDispatch( noticesStore );
	useEffect( () => {
		if ( error ) {
			createErrorNotice( error.message, {
				type: 'snackbar',
				id: `editor-actions-${ postType }`,
				explicitDismiss: true,
			} );
		}
	}, [ createErrorNotice, error, postType ] );

	return useMemo( () => {
		let actions = [ ...defaultActions ];

		// Ensure "Move to trash" is always the last action.
		actions = actions.sort( ( a, b ) =>
			b.id === 'move-to-trash' ? -1 : 0
		);

		// Filter actions based on provided context. If not provided
		// all actions are returned. We'll have a single entry for getting the actions
		// and the consumer should provide the context to filter the actions, if needed.
		// Actions should also provide the `context` they support, if it's specific, to
		// compare with the provided context to get all the actions.
		// Right now the only supported context is `list`.
		actions = actions.filter( ( action ) => {
			if ( ! action.context ) {
				return true;
			}
			return action.context === context;
		} );

		if ( onActionPerformed ) {
			for ( let i = 0; i < actions.length; ++i ) {
				if ( actions[ i ].callback ) {
					const existingCallback = actions[ i ].callback;
					actions[ i ] = {
						...actions[ i ],
						callback: ( items, argsObject ) => {
							existingCallback( items, {
								...argsObject,
								onActionPerformed: ( _items ) => {
									if ( argsObject?.onActionPerformed ) {
										argsObject.onActionPerformed( _items );
									}
									onActionPerformed(
										actions[ i ].id,
										_items
									);
								},
							} );
						},
					};
				}
				if ( actions[ i ].RenderModal ) {
					const ExistingRenderModal = actions[ i ].RenderModal;
					actions[ i ] = {
						...actions[ i ],
						RenderModal: ( props ) => {
							return (
								<ExistingRenderModal
									{ ...props }
									onActionPerformed={ ( _items ) => {
										if ( props.onActionPerformed ) {
											props.onActionPerformed( _items );
										}
										onActionPerformed(
											actions[ i ].id,
											_items
										);
									} }
								/>
							);
						},
					};
				}
			}
		}

		return actions;
	}, [ context, defaultActions, onActionPerformed ] );
}
