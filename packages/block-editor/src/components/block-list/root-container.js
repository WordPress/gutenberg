/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createContext, forwardRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useMultiSelection from './use-multi-selection';
import useInsertionPoint from './insertion-point';
import BlockPopover from './block-popover';

export const Context = createContext();
export const BlockNodes = createContext();
export const SetBlockNodes = createContext();

function RootContainer( { children, className }, ref ) {
	const onSelectionStart = useMultiSelection( ref );
	const [ blockNodes, setBlockNodes ] = useState( {} );
	const insertionPoint = useInsertionPoint( ref );

	return (
		<BlockNodes.Provider value={ blockNodes }>
			{ insertionPoint }
			<BlockPopover />
			<div
				ref={ ref }
				className={ classnames( className, 'is-root-container' ) }
			>
				<SetBlockNodes.Provider value={ setBlockNodes }>
					<Context.Provider value={ onSelectionStart }>
						{ children }
					</Context.Provider>
				</SetBlockNodes.Provider>
			</div>
		</BlockNodes.Provider>
	);
}

export default forwardRef( RootContainer );
