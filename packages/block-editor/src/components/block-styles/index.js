/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { debounce, useViewportMatch } from '@wordpress/compose';
import { Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockStylesControl from './block-styles-control';
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
	} = useStylesForBlocks( { clientId, onSwitch } );
	const [ hoveredStyle, setHoveredStyle ] = useState( null );
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	if ( ! stylesToRender || stylesToRender.length === 0 ) {
		return null;
	}

	const debouncedSetHoveredStyle = debounce( setHoveredStyle, 250 );

	const handleOnChange = ( style ) => {
		onSelect( { name: style } );
		onHoverClassName( null );
		setHoveredStyle( null );
		debouncedSetHoveredStyle.cancel();
	};

	const hoverStyleHandler = ( style ) => {
		if ( hoveredStyle === style ) {
			debouncedSetHoveredStyle.cancel();
			return;
		}

		debouncedSetHoveredStyle( style );
		onHoverClassName( style?.name ?? null );
	};

	return (
		<div className="block-editor-block-styles">
			<BlockStylesControl
				blockStyles={ stylesToRender }
				value={ activeStyle }
				onChange={ handleOnChange }
				onHover={ hoverStyleHandler }
			/>
			{ hoveredStyle && ! isMobileViewport && (
				<Popover
					placement="left-start"
					offset={ 34 }
					focusOnMount={ false }
				>
					<div
						className="block-editor-block-styles__preview-panel"
						onMouseLeave={ () => hoverStyleHandler( null ) }
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
