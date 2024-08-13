/**
 * WordPress dependencies
 */
import { external } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const viewPostAction = {
	id: 'view-post',
	label: __( 'View' ),
	isPrimary: true,
	icon: external,
	isEligible( post ) {
		return post.status !== 'trash';
	},
	callback( posts, { onActionPerformed } ) {
		const post = posts[ 0 ];
		window.open( post.link, '_blank' );
		if ( onActionPerformed ) {
			onActionPerformed( posts );
		}
	},
};

const postRevisionsAction = {
	id: 'view-post-revisions',
	context: 'list',
	label( items ) {
		const revisionsCount =
			items[ 0 ]._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0;
		return sprintf(
			/* translators: %s: number of revisions */
			__( 'View revisions (%s)' ),
			revisionsCount
		);
	},
	isEligible: ( post ) => {
		if ( post.status === 'trash' ) {
			return false;
		}
		const lastRevisionId =
			post?._links?.[ 'predecessor-version' ]?.[ 0 ]?.id ?? null;
		const revisionsCount =
			post?._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0;
		return lastRevisionId && revisionsCount > 1;
	},
	callback( posts, { onActionPerformed } ) {
		const post = posts[ 0 ];
		const href = addQueryArgs( 'revision.php', {
			revision: post?._links?.[ 'predecessor-version' ]?.[ 0 ]?.id,
		} );
		document.location.href = href;
		if ( onActionPerformed ) {
			onActionPerformed( posts );
		}
	},
};

export function usePostActions( { postType, onActionPerformed, context } ) {
	const { defaultActions, postTypeObject } = useSelect(
		( select ) => {
			const { getPostType } = select( coreStore );
			const { getEntityActions } = unlock( select( editorStore ) );
			return {
				postTypeObject: getPostType( postType ),
				defaultActions: getEntityActions( 'postType', postType ),
			};
		},
		[ postType ]
	);

	const { registerPostTypeActions } = unlock( useDispatch( editorStore ) );
	useEffect( () => {
		registerPostTypeActions( postType );
	}, [ registerPostTypeActions, postType ] );

	const isLoaded = !! postTypeObject;
	const supportsRevisions = !! postTypeObject?.supports?.revisions;
	return useMemo( () => {
		if ( ! isLoaded ) {
			return [];
		}

		let actions = [
			postTypeObject?.viewable && viewPostAction,
			supportsRevisions && postRevisionsAction,
			...defaultActions,
		].filter( Boolean );
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
		defaultActions,
		postTypeObject?.viewable,
		onActionPerformed,
		isLoaded,
		supportsRevisions,
		context,
	] );
}
