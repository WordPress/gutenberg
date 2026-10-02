import {
	Button,
	ColorIndicator,
	Dropdown,
	Path,
	SVG,
	__experimentalItem as Item,
	__experimentalItemGroup as ItemGroup,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { Stack, Tooltip } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { store as blockEditorStore } from '../../../store';
import { BlockEditContextProvider } from '../../block-edit/context';
import { isGlobalStylesInheritanceIndicatorUIEnabled } from '.';
import { useStyleChangeRows } from './style-changes';
import { getStyleValueDisplay } from './style-change-rows';

const diamond = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			d="M12 5.06 18.94 12 12 18.94 5.06 12 12 5.06Z"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
	</SVG>
);

interface StyleChangeRow {
	key: string;
	path: string[];
	label: string;
	status: 'override' | 'local' | 'inherited';
	sourceLabel: string | null;
	value: unknown;
}

/**
 * Returns the line under a row's label naming where its value comes from, or
 * what a local value replaces. A local value that replaces nothing has none:
 * its group already says it is set on the block.
 *
 * @param row Row from `useStyleChangeRows`.
 * @return Source text, or `null`.
 */
function getRowSource( row: StyleChangeRow ) {
	if ( row.status === 'override' ) {
		return sprintf(
			/* translators: %s: Where the replaced value comes from, e.g. "Paragraph block". */
			__( 'Overrides %s' ),
			row.sourceLabel
		);
	}
	return row.status === 'inherited' ? row.sourceLabel : null;
}

function StyleValue( { row }: { row: StyleChangeRow } ) {
	const { text, color } = getStyleValueDisplay( row.path, row.value );
	return (
		<Stack direction="row" gap="sm" align="center">
			{ color && <ColorIndicator colorValue={ color } /> }
			<Tooltip.Root>
				<Tooltip.Trigger
					render={
						<Truncate className="block-editor-style-changes__value" />
					}
				>
					{ text }
				</Tooltip.Trigger>
				<Tooltip.Popup>{ text }</Tooltip.Popup>
			</Tooltip.Root>
		</Stack>
	);
}

function StyleChangeItem( { row }: { row: StyleChangeRow } ) {
	const source = getRowSource( row );
	return (
		<Item size="small" className="block-editor-style-changes__item">
			<Stack direction="row" gap="md" align="flex-start">
				<Stack
					direction="column"
					className="block-editor-style-changes__text"
				>
					<span className="block-editor-style-changes__label">
						{ row.label }
					</span>
					{ source && (
						<span className="block-editor-style-changes__source">
							{ source }
						</span>
					) }
				</Stack>
				<StyleValue row={ row } />
			</Stack>
		</Item>
	);
}

function StyleChangesList( { rows }: { rows: StyleChangeRow[] } ) {
	const [ showInherited, setShowInherited ] = useState( false );
	const localRows = rows.filter( ( row ) => row.status !== 'inherited' );
	const inheritedRows = rows.filter( ( row ) => row.status === 'inherited' );
	return (
		<Stack
			direction="column"
			gap="lg"
			className="block-editor-style-changes"
		>
			<Stack direction="column" gap="xs">
				<h2 className="block-editor-style-changes__heading">
					{ __( 'Changed on this block' ) }
				</h2>
				<ItemGroup>
					{ localRows.map( ( row ) => (
						<StyleChangeItem key={ row.key } row={ row } />
					) ) }
				</ItemGroup>
			</Stack>
			{ inheritedRows.length > 0 && (
				<Stack direction="column" gap="xs">
					<Button
						__next40pxDefaultSize={ false }
						size="small"
						className="block-editor-style-changes__toggle"
						icon={ showInherited ? chevronUp : chevronDown }
						iconPosition="right"
						iconSize={ 16 }
						aria-expanded={ showInherited }
						onClick={ () => setShowInherited( ! showInherited ) }
					>
						{ sprintf(
							/* translators: %d: Number of styles that come from Global Styles. */
							__( 'From Global Styles (%d)' ),
							inheritedRows.length
						) }
					</Button>
					{ showInherited && (
						<ItemGroup>
							{ inheritedRows.map( ( row ) => (
								<StyleChangeItem key={ row.key } row={ row } />
							) ) }
						</ItemGroup>
					) }
				</Stack>
			) }
		</Stack>
	);
}

function StyleChangesDropdown( {
	clientId,
	popoverAnchor,
}: {
	clientId: string;
	popoverAnchor?: HTMLElement | null;
} ) {
	const rows: StyleChangeRow[] = useStyleChangeRows( clientId );
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
	// Keep the slot's size so the block card does not shift when a block
	// gains or loses its first local style.
	if ( ! rows.some( ( row ) => row.status !== 'inherited' ) ) {
		return (
			<span
				aria-hidden="true"
				className="block-editor-style-changes-indicator__placeholder"
			/>
		);
	}
	return (
		<Dropdown
			className="block-editor-style-changes-indicator"
			contentClassName="block-editor-style-changes-indicator__content"
			popoverProps={ popoverProps }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					size="small"
					icon={ diamond }
					label={ __( 'Style changes' ) }
					description={ __(
						'This block has styles set on it. Show where each of its styles comes from.'
					) }
					onClick={ onToggle }
					aria-expanded={ isOpen }
				/>
			) }
			renderContent={ () => <StyleChangesList rows={ rows } /> }
		/>
	);
}

/**
 * The block card's indicator for a block that sets some of its own styles.
 * It opens a popover listing the styles the block sets, then, on request, the
 * ones it takes from Global Styles and where each comes from.
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
			const { getBlockName, getSettings } = select(
				blockEditorStore
			) as {
				getBlockName: ( id: string ) => string | null;
				getSettings: () => Record< string, unknown >;
			};
			return {
				blockName: getBlockName( clientId ),
				isBlockBasedTheme: !! getSettings().__unstableIsBlockBasedTheme,
			};
		},
		[ clientId ]
	);
	const blockEditContext = useMemo(
		() => ( { name: blockName, clientId, isSelected: true } ),
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
