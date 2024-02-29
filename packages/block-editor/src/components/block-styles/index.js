/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { debounce, useViewportMatch } from '@wordpress/compose';
import { Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockStylesDropdown from './block-styles-dropdown';
import BlockStylesPreviewPanel from './preview-panel';
import useStylesForBlocks from './use-styles-for-block';

const noop = () => {};

// Block Styles component for the Settings Sidebar.
function BlockStyles( { clientId, onSwitch = noop, onHoverClassName = noop } ) {
	const {
		onSelect,
		stylesToRender,
		activeStyle,
		genericPreviewBlock,
		className: previewClassName,
	} = useStylesForBlocks( {
		clientId,
		onSwitch,
	} );
	const [ hoveredStyle, setHoveredStyle ] = useState( null );
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	if ( ! stylesToRender || stylesToRender.length === 0 ) {
		return null;
	}

	const debouncedSetHoveredStyle = debounce( setHoveredStyle, 250 );

	const onSelectStylePreview = ( style ) => {
		onSelect( style );
		onHoverClassName( null );
		setHoveredStyle( null );
		debouncedSetHoveredStyle.cancel();
	};

	const styleItemHandler = ( item ) => {
		if ( hoveredStyle === item ) {
			debouncedSetHoveredStyle.cancel();
			return;
		}
		debouncedSetHoveredStyle( item );
		onHoverClassName( item?.name ?? null );
	};

	return (
		<div className="block-editor-block-styles">
			<BlockStylesDropdown
				handlePreview={ styleItemHandler }
				onSelect={ onSelectStylePreview }
				styles={ stylesToRender }
				value={ activeStyle }
			/>
			{ hoveredStyle && ! isMobileViewport && (
				<Popover
					placement="left-start"
					offset={ 34 }
					focusOnMount={ false }
				>
					<div
						className="block-editor-block-styles__preview-panel"
						onMouseLeave={ () => styleItemHandler( null ) }
					>
						<BlockStylesPreviewPanel
							activeStyle={ activeStyle }
							className={ previewClassName }
							genericPreviewBlock={ genericPreviewBlock }
							style={ hoveredStyle }
						/>
					</div>
				</Popover>
			) }
		</div>
	);
}

export default BlockStyles;
