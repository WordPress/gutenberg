/**
 * WordPress dependencies
 */
import { useEffect, useContext } from '@wordpress/element';
import { RegistryContext } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	blockSelectionListener,
	adjustSidebarListener,
	viewPostLinkUpdateListener,
} from './listeners';

/**
 * Data component used for initializing the editor and re-initializes
 * when postId changes or unmount.
 *
 * @param {number} postId
 * @return {null} This is a data component so does not render any ui.
 */
export default function( { postId } ) {
	const registry = useContext( RegistryContext );
	useEffect( () => {
		const blockSelectionUnsubscribe = registry.subscribe(
			blockSelectionListener( registry )
		);
		const adjustSidebarUnsubscribe = registry.subscribe(
			adjustSidebarListener( registry )
		);
		const viewPostLinkUpdateUnsubscribe = registry.subscribe(
			viewPostLinkUpdateListener( registry )
		);
		registry.dispatch( 'core/nux' ).triggerGuide( [
			'core/editor.inserter',
			'core/editor.settings',
			'core/editor.preview',
			'core/editor.publish',
		] );
		return () => {
			blockSelectionUnsubscribe();
			adjustSidebarUnsubscribe();
			viewPostLinkUpdateUnsubscribe();
		};
	}, [ registry, postId ] );
	return null;
}
