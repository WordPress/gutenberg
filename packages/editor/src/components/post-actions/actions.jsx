import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { useEntityActions } from '../../dataviews/entity-actions-loader';
import { useSetAsHomepageAction } from './set-as-homepage';
import { useSetAsPostsPageAction } from './set-as-posts-page';

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

	const shouldShowHomepageActions = useSelect(
		( select ) => {
			if ( postType !== 'page' ) {
				return false;
			}

			const { getDefaultTemplateId, getEntityRecord, canUser } =
				select( coreStore );
			const canUpdateSettings = canUser( 'update', {
				kind: 'root',
				name: 'site',
			} );

			if ( ! canUpdateSettings ) {
				return false;
			}

			// Note that resolved template for `front-page` is not necessarily a
			// `front-page` template.
			const frontPageTemplateId = getDefaultTemplateId( {
				slug: 'front-page',
			} );

			if ( ! frontPageTemplateId ) {
				return true;
			}

			// This won't trigger a second network request, getDefaultTemplateId
			// will have received the whole template from the REST API.
			const frontPageTemplate = getEntityRecord(
				'postType',
				'wp_template',
				frontPageTemplateId
			);

			if ( ! frontPageTemplate ) {
				return true;
			}

			// When there is a front page template, the front page cannot be
			// changed. See
			// https://developer.wordpress.org/themes/basics/template-hierarchy/
			return frontPageTemplate.slug !== 'front-page';
		},
		[ postType ]
	);

	const setAsHomepageAction = useSetAsHomepageAction();
	const setAsPostsPageAction = useSetAsPostsPageAction();

	return useMemo( () => {
		let actions = [ ...defaultActions ];
		if ( shouldShowHomepageActions ) {
			actions.push( setAsHomepageAction, setAsPostsPageAction );
		}

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
	}, [
		context,
		defaultActions,
		onActionPerformed,
		setAsHomepageAction,
		setAsPostsPageAction,
		shouldShowHomepageActions,
	] );
}
