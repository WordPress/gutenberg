import { Button, Dropdown, Path, SVG } from '@wordpress/components';
import { Stack, Text } from '@wordpress/ui';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import type { ReactNode } from 'react';
import { store as blockEditorStore } from '../../../store';
import { BlockEditContextProvider } from '../../block-edit/context';
import { useStyleChangeRows } from './style-changes';
import { getResetAttributes } from './style-change-rows';
import type { StyleChangeRow } from './style-change-rows';

const diamond = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			d="M12 7 17 12 12 17 7 12 12 7Z"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
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
		<Stack
			render={ <li /> }
			className="block-editor-style-changes__item"
			direction="row"
			gap="md"
			align="center"
			justify="space-between"
		>
			<Text className="block-editor-style-changes__label">
				{ row.label }
			</Text>
			{ onReset ? (
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
			) : (
				<Text className="block-editor-style-changes__source">
					{ row.sourceLabel }
				</Text>
			) }
		</Stack>
	);
}

function StyleChangesGroup( {
	title,
	rows,
	onReset,
	action,
}: {
	title: string;
	rows: StyleChangeRow[];
	onReset?: ( rows: StyleChangeRow[] ) => void;
	action?: ReactNode;
} ) {
	return (
		<section className="block-editor-style-changes__group">
			<Stack
				className="block-editor-style-changes__group-header"
				direction="row"
				gap="md"
				align="center"
				justify="space-between"
			>
				<Text
					variant="heading-sm"
					render={ <h3 /> }
					className="block-editor-style-changes__heading"
				>
					{ title }
				</Text>
				{ action }
			</Stack>
			<ul className="block-editor-style-changes__items">
				{ rows.map( ( row ) => (
					<StyleChangeItem
						key={ row.key }
						row={ row }
						onReset={ onReset }
					/>
				) ) }
			</ul>
		</section>
	);
}

function StyleChangesList( {
	clientId,
	rows,
}: {
	clientId: string;
	rows: StyleChangeRow[];
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
			<Text
				variant="heading-md"
				render={ <h2 /> }
				className="block-editor-style-changes__title"
			>
				{ __( 'Style origins' ) }
			</Text>
			{ localRows.length > 0 && (
				<StyleChangesGroup
					title={ __( 'On this block' ) }
					rows={ localRows }
					onReset={ onReset }
					action={
						<Button
							__next40pxDefaultSize={ false }
							size="small"
							variant="tertiary"
							className="block-editor-style-changes__action"
							onClick={ () => onReset( localRows ) }
						>
							{ __( 'Reset all' ) }
						</Button>
					}
				/>
			) }
			{ inheritedRows.length > 0 && (
				<StyleChangesGroup
					title={ __( 'Inherited' ) }
					rows={ inheritedRows }
				/>
			) }
			{ ! rows.length && (
				<Text
					render={ <p /> }
					className="block-editor-style-changes__empty"
				>
					{ __( 'No styles are set on or inherited by this block.' ) }
				</Text>
			) }
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
	// Mirrors the inspector's other popovers: beside the sidebar, not over it.
	const popoverProps = useMemo(
		() => ( {
			anchor: popoverAnchor ?? undefined,
			placement: 'left-start' as const,
			offset: 36,
			shift: true,
			// An inherited-only list has nothing focusable, so focus the
			// popover itself or Escape and outside clicks can't close it.
			focusOnMount: true,
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
					className="block-editor-style-changes-indicator__toggle"
					label={ __( 'Style origins' ) }
					description={ __(
						'Show where each style on this block comes from.'
					) }
					onClick={ onToggle }
					aria-expanded={ isOpen }
				/>
			) }
			renderContent={ () => (
				<StyleChangesList clientId={ clientId } rows={ rows } />
			) }
		/>
	);
}

/**
 * The block card's indicator of where a block's styles come from. It opens a
 * popover listing the styles set on the block, each with a reset, and the ones
 * it inherits with where each comes from.
 *
 * Shown only for a block theme, since the sources it names live in the Styles
 * screen.
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
	if ( ! isBlockBasedTheme || ! blockName ) {
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
