/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Autocomplete } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { createBlock, getBlockTypes } from '../api';
import BlockIcon from '../block-icon';

class BlockAutocomplete extends Component {
	constructor() {
		super( ...arguments );

		this.onSelect = this.onSelect.bind( this );
	}

	onSelect( option ) {
		const { onReplace } = this.props;
		const { value: blockName } = option;

		onReplace( createBlock( blockName ) );
	}

	render() {
		const { children } = this.props;

		const options = getBlockTypes().map( ( blockType ) => {
			const { name, title, icon, keywords = [] } = blockType;
			return {
				value: name,
				label: [
					<BlockIcon key="icon" icon={ icon } />,
					title,
				],
				keywords: [ ...keywords, title ],
			};
		} );

		return (
			<Autocomplete
				triggerPrefix="/"
				options={ options }
				onSelect={ this.onSelect }
				className="blocks-block-autocomplete"
			>
				{ children }
			</Autocomplete>
		);
	}
}

export default BlockAutocomplete;
