import { Button, Dropdown, Path, SVG } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { store as blockEditorStore } from '../../../store';
import { BlockEditContextProvider } from '../../block-edit/context';
import InspectorPopoverHeader from '../../inspector-popover-header';
import { isGlobalStylesInheritanceIndicatorUIEnabled } from '.';
import { useStyleChangeRows } from './style-changes';
import { getResetAttributes } from './style-change-rows';
import type { StyleChangeRow } from './style-change-rows';

// `pathLength` gives each side six units, so the dashed state's
// `stroke-dasharray` lands a dash on every corner and every side's middle.
const diamond = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			className="block-editor-style-changes-indicator__diamond"
			d="M12 7 17 12 12 17 7 12 12 7Z"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			pathLength="24"
		/>
	</SVG>
);

function StyleChangeItem( {
	row,
	onReset,
}: {
	row: StyleChangeRow;
	onReset?: ( rows: StyleChangeRow[] ) => void;
} ) {
	return (
		<li className="block-editor-style-changes__item">
			<Stack
				direction="row"
				gap="md"
				align="center"
				justify="space-between"
			>
				<span className="block-editor-style-changes__label">
					{ row.label }
				</span>
				{ onReset && (
					<Button
						__next40pxDefaultSize={ false }
						size="small"
						variant="tertiary"
						className="block-editor-style-changes__action"
						label={ sprintf(
							/* translators: %s: Style name, e.g. "Text color". */
							__( 'Reset %s' ),
							row.label
						) }
						showTooltip={ false }
						onClick={ () => onReset( [ row ] ) }
					>
						{ __( 'Reset' ) }
					</Button>
				) }
			</Stack>
			{ row.status === 'inherited' && (
				<span className="block-editor-style-changes__source">
					{ row.sourceLabel }
				</span>
			) }
		</li>
	);
}

function StyleChangesGroup( {
	title,
	rows,
	emptyText,
	onReset,
	children,
}: {
	title: string;
	rows: StyleChangeRow[];
	emptyText: string;
	onReset?: ( rows: StyleChangeRow[] ) => void;
	children?: ReactNode;
} ) {
	return (
		<section className="block-editor-style-changes__group">
			<h3 className="block-editor-style-changes__heading">{ title }</h3>
			{ rows.length ? (
				<ul className="block-editor-style-changes__items">
					{ rows.map( ( row ) => (
						<StyleChangeItem
							key={ row.key }
							row={ row }
							onReset={ onReset }
						/>
					) ) }
				</ul>
			) : (
				<p className="block-editor-style-changes__empty">
					{ emptyText }
				</p>
			) }
			{ children }
		</section>
	);
}

function StyleChangesList( {
	clientId,
	rows,
	onClose,
}: {
	clientId: string;
	rows: StyleChangeRow[];
	onClose: () => void;
} ) {
	const ref = useRef< HTMLDivElement >( null );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const attributes = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockAttributes( clientId ) as Record<
				string,
				unknown
			> | null,
		[ clientId ]
	);
	const localRows = rows.filter( ( row ) => row.status !== 'inherited' );
	const inheritedRows = rows.filter( ( row ) => row.status === 'inherited' );
	const onReset = ( resetRows: StyleChangeRow[] ) => {
		// The pressed button unmounts with its row, so keep focus inside the
		// popover or it reads as a focus outside and closes.
		ref.current?.focus();
		updateBlockAttributes(
			clientId,
			getResetAttributes( attributes, resetRows )
		);
	};
	return (
		<div className="block-editor-style-changes" ref={ ref } tabIndex={ -1 }>
			<InspectorPopoverHeader
				title={ __( 'Style origins' ) }
				help={ undefined }
				onClose={ onClose }
			/>
			<StyleChangesGroup
				title={ __( 'On this block' ) }
				rows={ localRows }
				emptyText={ __( 'No styles are set on this block.' ) }
				onReset={ onReset }
			>
				{ localRows.length > 0 && (
					<div className="block-editor-style-changes__reset-all">
						<Button
							__next40pxDefaultSize={ false }
							size="small"
							variant="tertiary"
							className="block-editor-style-changes__action"
							onClick={ () => onReset( localRows ) }
						>
							{ __( 'Reset all' ) }
						</Button>
					</div>
				) }
			</StyleChangesGroup>
			<StyleChangesGroup
				title={ __( 'Inherited' ) }
				rows={ inheritedRows }
				emptyText={ __( 'This block inherits no styles.' ) }
			/>
		</div>
	);
}

function StyleChangesDropdown( {
	clientId,
	popoverAnchor,
}: {
	clientId: string;
	popoverAnchor?: HTMLElement | null;
} ) {
	const rows = useStyleChangeRows( clientId );
	const hasLocalStyles = rows.some( ( row ) => row.status !== 'inherited' );
	// Mirrors the inspector's other popovers: beside the sidebar, not over it.
	const popoverProps = useMemo(
		() => ( {
			anchor: popoverAnchor ?? undefined,
			placement: 'left-start' as const,
			offset: 36,
			shift: true,
		} ),
		[ popoverAnchor ]
	);
	return (
		<Dropdown
			className="block-editor-style-changes-indicator"
			contentClassName="block-editor-style-changes-indicator__content"
			popoverProps={ popoverProps }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					size="small"
					icon={ diamond }
					className={ clsx(
						'block-editor-style-changes-indicator__toggle',
						{ 'is-inherited-only': ! hasLocalStyles }
					) }
					label={ __( 'Style origins' ) }
					description={
						hasLocalStyles
							? __(
									'This block has styles set on it. Show where each of its styles comes from.'
								)
							: __(
									'This block only inherits its styles. Show where each comes from.'
								)
					}
					onClick={ onToggle }
					aria-expanded={ isOpen }
				/>
			) }
			renderContent={ ( { onClose } ) => (
				<StyleChangesList
					clientId={ clientId }
					rows={ rows }
					onClose={ onClose }
				/>
			) }
		/>
	);
}

/**
 * The block card's indicator of where a block's styles come from. The diamond
 * is solid when the block sets some of its own styles and dashed when it only
 * inherits them. It opens a popover listing the styles set on the block, each
 * with a reset, and the ones it inherits with where each comes from.
 *
 * Shown only behind the `gutenberg-global-styles-inheritance-ui` experiment,
 * for a block theme, since the sources it names live in the Styles screen.
 *
 * @param props
 * @param props.clientId      Block client ID.
 * @param props.popoverAnchor Element the popover sits beside, the inspector.
 * @return The indicator, or `null`.
 */
export default function StyleChangesIndicator( {
	clientId,
	popoverAnchor,
}: {
	clientId: string;
	popoverAnchor?: HTMLElement | null;
} ) {
	const { blockName, isBlockBasedTheme } = useSelect(
		( select ) => {
			const { getBlockName, getSettings } = select( blockEditorStore );
			return {
				blockName: getBlockName( clientId ) as string | null,
				isBlockBasedTheme: !! getSettings().__unstableIsBlockBasedTheme,
			};
		},
		[ clientId ]
	);
	const blockEditContext = useMemo(
		() => ( { name: blockName ?? '', clientId, isSelected: true } ),
		[ blockName, clientId ]
	);
	if (
		! isGlobalStylesInheritanceIndicatorUIEnabled() ||
		! isBlockBasedTheme ||
		! blockName
	) {
		return null;
	}
	return (
		<BlockEditContextProvider value={ blockEditContext }>
			<StyleChangesDropdown
				clientId={ clientId }
				popoverAnchor={ popoverAnchor }
			/>
		</BlockEditContextProvider>
	);
}
