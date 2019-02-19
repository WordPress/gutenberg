/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { DropZoneProvider, SlotFillProvider } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

class BlockEditorProvider extends Component {
	componentDidMount() {
		this.isSyncingBlockValue = true;
		this.props.updateEditorSettings( this.props.settings );
		this.props.resetBlocks( this.props.value );
	}

	componentDidUpdate( prevProps ) {
		const {
			settings,
			updateEditorSettings,
			value,
			resetBlocks,
			blocks,
			onInput,
			onChange,
			isLastBlockChangePersistent,
		} = this.props;

		if ( settings !== prevProps.settings ) {
			updateEditorSettings( settings );
		}

		if ( this.isSyncingBlockValue ) {
			this.isSyncingBlockValue = false;
		} else if ( blocks !== prevProps.blocks ) {
			this.isSyncingBlockValue = true;
			onInput( blocks );

			if ( isLastBlockChangePersistent ) {
				onChange( blocks );
			}
		} else if ( value !== prevProps.value ) {
			this.isSyncingBlockValue = true;
			resetBlocks( value );
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
		const {
			getBlocks,
			isLastBlockChangePersistent,
		} = select( 'core/block-editor' );

		return {
			blocks: getBlocks(),
			isLastBlockChangePersistent: isLastBlockChangePersistent(),
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
