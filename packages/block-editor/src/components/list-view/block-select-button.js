/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
	Tooltip,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import {
	Icon,
	lockSmall as lock,
	pinSmall,
	unseen,
	symbol,
	desktop,
	tablet,
	mobile,
} from '@wordpress/icons';
import { SPACE, ENTER } from '@wordpress/keycodes';
import { useSelect } from '@wordpress/data';
import { hasBlockSupport } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import ListViewExpander from './expander';
import { useBlockLock } from '../block-lock';
import useListViewImages from './use-list-view-images';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { hasAnyVisibilitySettings } from '../block-visibility/utils';

const { Badge } = unlock( componentsPrivateApis );

function ListViewBlockSelectButton(
	{
		className,
		block: { clientId },
		onClick,
		onContextMenu,
		onMouseDown,
		onToggleExpanded,
		tabIndex,
		onFocus,
		onDragStart,
		onDragEnd,
		draggable,
		isExpanded,
		ariaDescribedBy,
	},
	ref
) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const { isLocked } = useBlockLock( clientId );
	const { canToggleBlockVisibility, hasPatternName, blockVisibility } =
		useSelect(
			( select ) => {
				const { getBlockName, getBlockAttributes } =
					select( blockEditorStore );
				const blockAttributes = getBlockAttributes( clientId );
				return {
					canToggleBlockVisibility: hasBlockSupport(
						getBlockName( clientId ),
						'visibility',
						true
					),
					hasPatternName: !! blockAttributes?.metadata?.patternName,
					blockVisibility: blockAttributes?.metadata?.blockVisibility,
				};
			},
			[ clientId ]
		);
	const shouldShowLockIcon = isLocked;
	// Show visibility icon when block has any visibility settings (regardless of current viewport)
	const shouldShowBlockVisibilityIcon =
		canToggleBlockVisibility && hasAnyVisibilitySettings( blockVisibility );

	// Compute visibility tooltip text
	const getVisibilityTooltip = () => {
		if ( blockVisibility === false ) {
			return __( 'Hidden' );
		}
		if ( typeof blockVisibility === 'object' ) {
			const hiddenDevices = [
				blockVisibility.desktop === false && __( 'Desktop' ),
				blockVisibility.tablet === false && __( 'Tablet' ),
				blockVisibility.mobile === false && __( 'Mobile' ),
			].filter( Boolean );
			if ( hiddenDevices.length ) {
				return sprintf(
					/* translators: %s: comma-separated list of device types */
					__( 'Hidden on %s' ),
					hiddenDevices.join( ', ' )
				);
			}
		}
		return __( 'Hidden' );
	};

	const isSticky = blockInformation?.positionType === 'sticky';
	const images = useListViewImages( { clientId, isExpanded } );

	// The `href` attribute triggers the browser's native HTML drag operations.
	// When the link is dragged, the element's outerHTML is set in DataTransfer object as text/html.
	// We need to clear any HTML drag data to prevent `pasteHandler` from firing
	// inside the `useOnBlockDrop` hook.
	const onDragStartHandler = ( event ) => {
		event.dataTransfer.clearData();
		onDragStart?.( event );
	};

	/**
	 * @param {KeyboardEvent} event
	 */
	function onKeyDown( event ) {
		if ( event.keyCode === ENTER || event.keyCode === SPACE ) {
			onClick( event );
		}
	}

	return (
		<a
			className={ clsx(
				'block-editor-list-view-block-select-button',
				className
			) }
			onClick={ onClick }
			onContextMenu={ onContextMenu }
			onKeyDown={ onKeyDown }
			onMouseDown={ onMouseDown }
			ref={ ref }
			tabIndex={ tabIndex }
			onFocus={ onFocus }
			onDragStart={ onDragStartHandler }
			onDragEnd={ onDragEnd }
			draggable={ draggable }
			href={ `#block-${ clientId }` }
			aria-describedby={ ariaDescribedBy }
			aria-expanded={ isExpanded }
		>
			<ListViewExpander onClick={ onToggleExpanded } />
			<BlockIcon
				icon={ hasPatternName ? symbol : blockInformation?.icon }
				showColors
				context="list-view"
			/>
			<HStack
				alignment="center"
				className="block-editor-list-view-block-select-button__label-wrapper"
				justify="flex-start"
				spacing={ 1 }
			>
				<span className="block-editor-list-view-block-select-button__title">
					<Truncate ellipsizeMode="auto">{ blockTitle }</Truncate>
				</span>
				{ blockInformation?.anchor && (
					<span className="block-editor-list-view-block-select-button__anchor-wrapper">
						<Badge className="block-editor-list-view-block-select-button__anchor">
							{ blockInformation.anchor }
						</Badge>
					</span>
				) }
				{ isSticky && (
					<span className="block-editor-list-view-block-select-button__sticky">
						<Icon icon={ pinSmall } />
					</span>
				) }
				{ images.length ? (
					<span
						className="block-editor-list-view-block-select-button__images"
						aria-hidden
					>
						{ images.map( ( image, index ) => (
							<span
								className="block-editor-list-view-block-select-button__image"
								key={ image.clientId }
								style={ {
									backgroundImage: `url(${ image.url })`,
									zIndex: images.length - index, // Ensure the first image is on top, and subsequent images are behind.
								} }
							/>
						) ) }
					</span>
				) : null }
				{ shouldShowBlockVisibilityIcon && (
					<Tooltip text={ getVisibilityTooltip() }>
						<span className="block-editor-list-view-block-select-button__block-visibility">
							<Icon icon={ unseen } />
							{ typeof blockVisibility === 'object' && (
								<span className="block-editor-list-view-block-select-button__block-visibility-devices">
									{ blockVisibility.desktop === false && (
										<Icon icon={ desktop } />
									) }
									{ blockVisibility.tablet === false && (
										<Icon icon={ tablet } />
									) }
									{ blockVisibility.mobile === false && (
										<Icon icon={ mobile } />
									) }
								</span>
							) }
						</span>
					</Tooltip>
				) }
				{ shouldShowLockIcon && (
					<span className="block-editor-list-view-block-select-button__lock">
						<Icon icon={ lock } />
					</span>
				) }
			</HStack>
		</a>
	);
}

export default forwardRef( ListViewBlockSelectButton );
