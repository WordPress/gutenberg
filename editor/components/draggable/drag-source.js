/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import { withDragSource } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { startReordering, stopReordering } from '../../actions';


/**
 * @todo :clk:doc
 * Collector - properties to inject in the wrapped component
 * @param  {[type]} connect [description]
 * @param  {[type]} monitor [description]
 * @return {[type]}         [description]
 */
function sourceCollect( connect, monitor ) {
    return {
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging()
    };
}

/**
 * @todo :clk:doc
 * [sourceSpec description]
 * @type {Object}
 */
const sourceSpec = {
    beginDrag( props ) {
        props.startReordering();

        return {
            dragSourceUid: props.dragSourceUid,
            index: props.index,
        };
    },

    // every drag is [guaranteed] to fire this endDrag callback
    endDrag( props ) {
        setTimeout( props.stopReordering, 500 );
        // props.hideDropIndicator();
    },

};

class DragSource extends Component {
    constructor( props ) {
        super( props );
    }

    render() {
        const classes = classnames( 'draggable-drag-source');

        return this.props.connectDragSource(
            <div className={ classes }>
                { this.props.children }
            </div>
        );
    }
}

const mapDispatchToProps = ( dispatch ) => ( {
    startReordering() {
        dispatch( startReordering() );
    },

    stopReordering() {
        dispatch( stopReordering() );
    },

} );

export default compose(
    connect( undefined, mapDispatchToProps ),
    withDragSource( props => props.draggableType, sourceSpec, sourceCollect ),
)( DragSource );
