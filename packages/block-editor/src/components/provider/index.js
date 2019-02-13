/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { DropZoneProvider, SlotFillProvider } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

class BlockEditorProvider extends Component {
	componentDidMount() {
		this.props.updateEditorSettings( this.props.settings );
		this.props.resetBlocks( this.props.value );

		this.isSyncingBlockValue = true;
	}

	componentDidUpdate( prevProps ) {
		const {
			settings,
			updateEditorSettings,
			value,
			resetBlocks,
			blocks,
			onChange,
		} = this.props;

		if ( settings !== prevProps.settings ) {
			updateEditorSettings( settings );
		}

		if ( this.isSyncingBlockValue ) {
			this.isSyncingBlockValue = false;
		} else if ( blocks !== prevProps.blocks ) {
			onChange( blocks );
			this.isSyncingBlockValue = true;
		} else if ( value !== prevProps.value ) {
			resetBlocks( value );
			this.isSyncingBlockValue = true;
		}
	}

	render() {
		const { children } = this.props;

		return (
			<SlotFillProvider>
				<DropZoneProvider>
					{ children }
				</DropZoneProvider>
			</SlotFillProvider>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getBlocks } = select( 'core/block-editor' );

		return {
			blocks: getBlocks(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			updateEditorSettings,
			resetBlocks,
		} = dispatch( 'core/block-editor' );

		return {
			updateEditorSettings,
			resetBlocks,
		};
	} ),
] )( BlockEditorProvider );
