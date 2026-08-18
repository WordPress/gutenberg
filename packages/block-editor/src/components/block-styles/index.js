import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { debounce } from '@wordpress/compose';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
// eslint-disable-next-line @wordpress/use-recommended-components -- Use the portal-based popup to avoid inspector clipping.
import { SelectControl } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import PreviewBlockPopover from '../block-switcher/preview-block-popover';
import useStylesForBlocks from './use-styles-for-block';
import { useToolsPanelDropdownMenuProps } from '../global-styles/utils';
import { getDefaultStyle, replaceActiveStyle } from './utils';
import { store as blockEditorStore } from '../../store';

const noop = () => {};

// Block Styles component for the Settings Sidebar.
function BlockStyles( { clientId, onSwitch = noop, onHoverClassName = noop } ) {
	const canEdit = useSelect(
		( select ) => select( blockEditorStore ).canEditBlock( clientId ),
		[ clientId ]
	);
	const {
		onSelect,
		stylesToRender,
		activeStyle,
		genericPreviewBlock,
		className,
	} = useStylesForBlocks( {
		clientId,
		onSwitch,
	} );
	const [ hoveredStyle, setHoveredStyle ] = useState( null );
	const [ blockStylesAnchor, setBlockStylesAnchor ] = useState( null );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	// The select items double as the select values, so both the current value
	// and the rendered items must come from this same list of objects.
	const items = useMemo(
		() =>
			stylesToRender.map( ( style ) => ( {
				value: style.name,
				label: style.label || style.name,
				style,
			} ) ),
		[ stylesToRender ]
	);

	const previewBlocks = useMemo( () => {
		if ( ! hoveredStyle || ! genericPreviewBlock ) {
			return null;
		}
		const previewClassName = replaceActiveStyle(
			className,
			activeStyle,
			hoveredStyle
		);
		return [
			{
				...genericPreviewBlock,
				attributes: {
					...( genericPreviewBlock.attributes || {} ),
					className: previewClassName,
				},
			},
		];
	}, [ hoveredStyle, genericPreviewBlock, className, activeStyle ] );

	if ( ! canEdit || ! stylesToRender || stylesToRender.length === 0 ) {
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

	const defaultStyle = getDefaultStyle( stylesToRender );

	const hasValue = () => {
		return activeStyle?.name !== defaultStyle?.name;
	};

	const onDeselect = () => {
		onSelectStylePreview( defaultStyle );
	};

	return (
		<ToolsPanel
			label={ __( 'Styles' ) }
			resetAll={ onDeselect }
			panelId={ clientId }
			hasInnerWrapper
			dropdownMenuProps={ dropdownMenuProps }
		>
			<ToolsPanelItem
				hasValue={ hasValue }
				label={ __( 'Variation' ) }
				onDeselect={ onDeselect }
				isShownByDefault
				panelId={ clientId }
			>
				<div
					ref={ setBlockStylesAnchor }
					className="block-editor-block-styles"
				>
					<SelectControl
						label={ __( 'Variation' ) }
						hideLabelFromVision
						items={ items }
						value={ items.find(
							( item ) => item.value === activeStyle?.name
						) }
						onValueChange={ ( item ) =>
							onSelectStylePreview( item.style )
						}
						onOpenChange={ ( isOpen ) => {
							if ( ! isOpen ) {
								styleItemHandler( null );
							}
						} }
					>
						{ items.map( ( item ) => (
							<SelectControl.Item
								key={ item.value }
								value={ item }
								label={ item.label }
								onMouseEnter={ () =>
									styleItemHandler( item.style )
								}
								onMouseLeave={ () => styleItemHandler( null ) }
								onFocus={ () => styleItemHandler( item.style ) }
								onBlur={ () => styleItemHandler( null ) }
							>
								{ item.label }
							</SelectControl.Item>
						) ) }
					</SelectControl>
					{ previewBlocks && (
						<PreviewBlockPopover
							blocks={ previewBlocks }
							placement="left-start"
							offset={ 34 }
							anchor={ blockStylesAnchor }
						/>
					) }
				</div>
			</ToolsPanelItem>
		</ToolsPanel>
	);
}

export default BlockStyles;
