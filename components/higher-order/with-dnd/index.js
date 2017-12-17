/**
 * External dependencies
 */
import { DragDropContext, DragSource, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/* Testing... */
const ModifiedBackend = ( ...args ) => {
    const instance = new HTML5Backend( ...args );

    const listeners = [
        'handleTopDragStart',
        'handleTopDragStartCapture',
        'handleTopDragEndCapture',
        'handleTopDragEnter',
        'handleTopDragEnterCapture',
        'handleTopDragLeaveCapture',
        'handleTopDragOver',
        'handleTopDragOverCapture',
        'handleTopDrop',
        'handleTopDropCapture',
        'handleSelectStart',
    ];

    const shouldIgnoreTarget = ( target ) => {
        return target.className.split(' ').indexOf( 'is-reordering-in-progress' );
    }

    listeners.forEach( name => {
        const original = instance[ name ];

        instance[ name ] = ( e, ...extraArgs ) => {

            if ( name === 'handleTopDrop' ) {
                console.log( e.target );
                console.log( e.target.className );
            }

            if ( ! shouldIgnoreTarget( e.target ) ) {
                original( e, ...extraArgs );
            }
        };
    });

    return instance;
};



/**
 * A wrapper around react-dnd DragDropContext higher order component.
 * @param  { Function } WrappedComponent Component to be wrapped with drag & drop context.
 * @return { Function }                  A component wrapped with the react-dnd HOC.
 */
export default function withDragAndDropContext( WrappedComponent ) {
	return DragDropContext( ModifiedBackend )( WrappedComponent );
}

/**
 * @todo :clk:doc
 * A wrapper around react-dnd DragSource higher order component.
 * @param  {[type]} itemType      [description]
 * @param  {[type]} sourceSpec    [description]
 * @param  {[type]} sourceCollect [description]
 * @return {[type]}               [description]
 */
export function withDragSource( itemType, sourceSpec, sourceCollect ) {
    return ( WrappedComponent ) => {
        return DragSource( itemType, sourceSpec, sourceCollect )( WrappedComponent );
    };
}

/**
 * @todo :clk:doc
 * A wrapper around react-dnd DropTarget higher order component.
 * @param  {[type]} itemType      [description]
 * @param  {[type]} targetSpec    [description]
 * @param  {[type]} targetCollect [description]
 * @return {[type]}               [description]
 */
export function withDropTarget( itemType, targetSpec, targetCollect ) {
    return ( WrappedComponent ) => {
        return DropTarget( itemType, targetSpec, targetCollect )( WrappedComponent );
    };
}
