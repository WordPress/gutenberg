import {
	useContext,
	useEffect,
	useInsertionEffect,
	useRef,
} from '@wordpress/element';
import { getEventHandlers } from '../../writing-flow/use-editable-root-event-handlers';
import { BlockRefs } from '../../provider/block-refs-provider';
import type { BlockEventHandlers } from '../../writing-flow/types';

/**
 * Registers the block's `wrapperProps` event handlers so the writing flow host
 * can call them when a block that supports `editableRoot` is edited through the
 * host and the events no longer reach the block.
 *
 * Handlers are keyed by client ID in the `BlockRefs` context, so the host
 * resolves them from the block hierarchy. A ref is stored so the host always
 * calls the latest render's handlers, and only blocks that have a handler are
 * registered.
 *
 * @param clientId     Block client ID.
 * @param wrapperProps The block's merged wrapper props.
 */
export function useRegisterBlockEventHandlers(
	clientId: string,
	wrapperProps: Record< string, unknown >
) {
	const { eventHandlers } = useContext( BlockRefs );
	const handlers = getEventHandlers( wrapperProps );
	const handlersRef = useRef< BlockEventHandlers | undefined >( undefined );
	useInsertionEffect( () => {
		handlersRef.current = handlers;
	} );

	const hasHandlers = !! handlers;
	useEffect( () => {
		if ( hasHandlers ) {
			eventHandlers.set( clientId, handlersRef );
			return () => {
				eventHandlers.delete( clientId );
			};
		}
		return undefined;
	}, [ eventHandlers, clientId, hasHandlers ] );
}
