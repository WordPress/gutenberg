/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { DropZoneProvider, SlotFillProvider } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

class BlockEditorProvider extends Component {
	componentDidMount() {
		this.props.updateEditorSettings( this.props.settings );
		this.props.resetBlocks( this.props.value );
	}

	componentWillUnmount() {
		if ( this.unsubscribe ) {
			this.unsubscribe();
		}
	}

	componentDidUpdate( prevProps ) {
		const {
			settings,
			updateEditorSettings,
			value,
			resetBlocks,
			blocks,
			isLastBlockChangePersistent,
			onChange,
			onInput,
		} = this.props;

		if ( settings !== prevProps.settings ) {
			updateEditorSettings( settings );
		}

		if ( ! this.syncedValue ) {
			this.syncedValue = blocks;
		} else if (
			blocks !== prevProps.blocks ||
			isLastBlockChangePersistent !== prevProps.isLastBlockChangePersistent
		) {
			const hasSyncedValue = this.syncedValue === blocks;
			if ( ! hasSyncedValue ) {
				this.syncedValue = blocks;
				console.log( 'input' );
				onInput( blocks );
			}

			if ( isLastBlockChangePersistent ) {
				console.log( 'change' );
				onChange( blocks );
			}
		} else if ( value !== prevProps.value && this.syncedValue !== value ) {
			delete this.syncedValue;

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
