/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { instances } from '../use-block-collab';

/**
 * Enables the rendering of peer block selections.
 */
export default function addBlockSelections() {
	addFilter(
		'editor.BlockListBlock',
		'core/block-collab/add-block-selections',
		( OriginalComponent ) => ( { className, ...props } ) => {
			const [ peers, _setPeers ] = useState( [] );

			useEffect( () => {
				const setPeers = () => {
					const instancesList = Object.values( instances );
					_setPeers(
						instancesList
							.map( ( instance ) =>
								Object.values( instance.peers.toJSON() ).filter(
									( peer ) =>
										! instancesList.some(
											( _instance ) =>
												_instance.provider.room
													.peerId === peer.peerId
										)
								)
							)
							.flat()
					);
				};

				const instancesList = Object.values( instances );
				instancesList.forEach( ( instance ) =>
					instance.peers.observeDeep( setPeers )
				);
				return () =>
					instancesList.forEach( ( instance ) =>
						instance.peers.unobserveDeep( setPeers )
					);
			}, [ Object.keys( instances ).join( '-' ) ] );

			return (
				<OriginalComponent
					{ ...props }
					className={ classnames(
						className,
						'block-collab-add-block-selections__block',
						{
							'is-peer-selected': peers.some(
								( peer ) =>
									peer.selectionStart?.clientId ===
										props.clientId &&
									peer.selectionEnd?.clientId ===
										props.clientId
							),
						}
					) }
				/>
			);
		}
	);
}
