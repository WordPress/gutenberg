import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { debounce } from '@wordpress/compose';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	Button,
	Collapsible,
	Field,
	Fieldset,
	Icon,
	Radio,
	RadioGroup,
	Stack,
	Text,
} from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import type { BlockStyle } from '@wordpress/blocks';
import PreviewBlockPopover from '../block-switcher/preview-block-popover';
import useStylesForBlocks from './use-styles-for-block';
import { useToolsPanelDropdownMenuProps } from '../global-styles/utils';
import { getDefaultStyle, replaceActiveStyle } from './utils';
import { store as blockEditorStore } from '../../store';
import type { BlockStylesProps } from './types';

const noop = () => {};

// Block Styles component for the Settings Sidebar.
function BlockStyles( {
	clientId,
	onSwitch = noop,
	onHoverClassName = noop,
}: BlockStylesProps ) {
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
	const [ hoveredStyle, setHoveredStyle ] = useState< BlockStyle | null >(
		null
	);
	const [ blockStylesAnchor, setBlockStylesAnchor ] =
		useState< HTMLDivElement | null >( null );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const [ isOpen, setIsOpen ] = useState( false );

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

	const debouncedSetHoveredStyle = debounce(
		// `debounce` takes callbacks with unknown arguments.
		setHoveredStyle as ( ...args: unknown[] ) => void,
		250
	);

	const onSelectStylePreview = ( style: BlockStyle ) => {
		onSelect( style );
		onHoverClassName( null );
		setHoveredStyle( null );
		debouncedSetHoveredStyle.cancel();
	};

	const styleItemHandler = ( item: BlockStyle | null ) => {
		if ( hoveredStyle === item ) {
			debouncedSetHoveredStyle.cancel();
			return;
		}
		debouncedSetHoveredStyle( item );
		onHoverClassName( item?.name ?? null );
	};

	const onValueChange = ( value: unknown ) => {
		const nextStyle = stylesToRender.find(
			( style ) => style.name === value
		);
		if ( nextStyle && nextStyle.name !== activeStyle.name ) {
			onSelectStylePreview( nextStyle );
		}
	};

	const trigger = (
		<Collapsible.Trigger
			render={
				<Button
					variant="minimal"
					tone="brand"
					size="compact"
					className="block-editor-block-styles__toggle"
				/>
			}
		>
			{ isOpen
				? __( 'Hide styles' )
				: sprintf(
						/* translators: %d: Number of available block styles. */
						__( 'Show all (%d)' ),
						stylesToRender.length
					) }
			<Icon icon={ isOpen ? chevronUp : chevronDown } size={ 16 } />
		</Collapsible.Trigger>
	);

	const defaultStyle = getDefaultStyle( stylesToRender );

	const hasValue = () => {
		return activeStyle?.name !== defaultStyle?.name;
	};

	const onDeselect = () => {
		// The rendered styles include a default.
		onSelectStylePreview( defaultStyle! );
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
					<Collapsible.Root
						open={ isOpen }
						onOpenChange={ setIsOpen }
					>
						{ ! isOpen && (
							<Stack
								direction="row"
								align="center"
								justify="space-between"
								gap="sm"
								className="block-editor-block-styles__current"
							>
								<Text>
									{ activeStyle.label || activeStyle.name }
								</Text>
								{ trigger }
							</Stack>
						) }
						<Collapsible.Panel>
							<Field.Root>
								<Fieldset.Root
									render={
										<RadioGroup
											value={ activeStyle.name }
											onValueChange={ onValueChange }
										/>
									}
								>
									<Fieldset.Legend hideFromVision>
										{ __( 'Styles' ) }
									</Fieldset.Legend>
									<Stack direction="column" gap="md">
										{ stylesToRender.map( ( style ) => (
											<Field.Item
												key={ style.name }
												render={
													<Stack
														gap="sm"
														align="start"
													/>
												}
												onMouseEnter={ () =>
													styleItemHandler( style )
												}
												onMouseLeave={ () =>
													styleItemHandler( null )
												}
												onFocus={ () =>
													styleItemHandler( style )
												}
												onBlur={ () =>
													styleItemHandler( null )
												}
											>
												<Radio value={ style.name } />
												<Field.Label variant="plain">
													{ style.label ||
														style.name }
												</Field.Label>
											</Field.Item>
										) ) }
									</Stack>
								</Fieldset.Root>
							</Field.Root>
						</Collapsible.Panel>
						{ isOpen && trigger }
					</Collapsible.Root>
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
