/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import IgnoreNestedEvents from '../block-list/ignore-nested-events';

export class BlockPlaceholder extends Component {
	static getDerivedStateFromProps( { index, rootClientId, layout } ) {
		return {
			insertionPoint: {
				index,
				rootClientId,
				layout,
			},
		};
	}

	render() {
		const {
			className,
		} = this.props;
		return (
			<IgnoreNestedEvents
				childHandledEvents={ [
					'onDragStart',
					'onMouseDown',
				] }
			>
				<Placeholder
					instructions={ __( 'Click the “+” (“Add block”) button to add a media block.' ) }
					className={ classnames( 'editor-block-placeholder', className ) }
				>
					<Inserter
						insertionPoint={ this.state.insertionPoint }
						position="bottom right"
					/>
				</Placeholder>
			</IgnoreNestedEvents>
		);
	}
}

export default BlockPlaceholder;
