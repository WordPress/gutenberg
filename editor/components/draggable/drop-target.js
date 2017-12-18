/**
 * External dependencies
 */
import { findDOMNode } from 'react-dom';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withDropTarget } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';


/**
 * @todo :clk:doc
 * [targetCollect description]
 * @param  {[type]} connect [description]
 * @param  {[type]} monitor [description]
 * @return {[type]}         [description]
 */
function targetCollect( connect, monitor ) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver()
    };
}

/**
 * @todo :clk:doc
 * [targetSpec description]
 * @type {Object}
 */
const targetSpec = {
    drop( props, monitor, component ) {
        const dragIndex = monitor.getItem().index; // index of dragged item
        const hoverIndex = props.index; // index of hovered over item

        console.log(`Drag index: ${dragIndex}`);
        console.log(`Drop index: ${hoverIndex}`);

        if ( dragIndex === hoverIndex ) {
            return;
        }

        props.reIndexCallback( monitor.getItem().dragSourceUid, hoverIndex );
        return;

        // monitor.getItem().index = hoverIndex;

        // Determine rectangle on screen
        const hoverBoundingRect = findDOMNode( component ).getBoundingClientRect();

        // Get vertical middle
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top ) / 2;

        // Determine mouse position
        const clientOffset = monitor.getClientOffset();

        // Get pixels to the top
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;


        // Dragging downwards
        if ( dragIndex < hoverIndex ) {
            let dropIndex;

            if ( hoverClientY < hoverMiddleY ) {
                dropIndex = hoverIndex - 1;
            } else {
                dropIndex = hoverIndex;
            }

            if ( dragIndex !== dropIndex ) {
                // props.moveBlock( dragIndex, dropIndex );
                props.reIndexCallback( monitor.getItem().dragSourceUid, dropIndex );
            }
            // monitor.getItem().index = dropIndex;
        }

        // Dragging upwards
        if ( dragIndex > hoverIndex ) {
            let dropIndex;

            if ( hoverClientY > hoverMiddleY ) {
                dropIndex = hoverIndex + 1;
            } else {
                dropIndex = hoverIndex;
            }

            if ( dragIndex !== dropIndex ) {
                // props.moveBlock( dragIndex, dropIndex );
                props.reIndexCallback( monitor.getItem().dragSourceUid, dropIndex );
            }
            // monitor.getItem().index = dropIndex;
        }

    },
    hover( props, monitor, component ) {

    }
}

class DropTarget extends Component {
    constructor( props ) {
        super( props );
    }

    render() {
        return this.props.connectDropTarget(
            <div className='draggable-drop-target'>
                { this.props.children }
            </div>
        );
    }
}

export default withDropTarget( props => props.draggableType, targetSpec, targetCollect )( DropTarget );
