import {
	Button,
	ColorIndicator,
	Dropdown,
	Path,
	SVG,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { Stack, Tooltip } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { store as blockEditorStore } from '../../../store';
import { BlockEditContextProvider } from '../../block-edit/context';
import InspectorPopoverHeader from '../../inspector-popover-header';
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
	inheritedValue?: unknown;
}

/**
 * Returns the line under a row's label: where an inherited value comes from,
 * or what a local value replaced and where that is set.
 *
 * @param row Row from `useStyleChangeRows`.
 * @return Source text.
 */
function getRowSource( row: StyleChangeRow ) {
	if ( row.status === 'override' ) {
		return sprintf(
			/* translators: 1: Replaced value, e.g. "Medium". 2: Where it is set, e.g. "Button element". */
			__( 'Was %1$s · %2$s' ),
			getStyleValueDisplay( row.path, row.inheritedValue ).text,
			row.sourceLabel ?? ''
		);
	}
	if ( row.status === 'local' ) {
		return __( 'Not set in Global Styles' );
	}
	return row.sourceLabel;
}

function StyleValue( { row }: { row: StyleChangeRow } ) {
	const { text, color } = getStyleValueDisplay( row.path, row.value );
	return (
		<Stack
			direction="row"
			gap="sm"
			align="center"
			className="block-editor-style-changes__value"
		>
			{ color && <ColorIndicator colorValue={ color } /> }
			<Tooltip.Root>
				<Tooltip.Trigger render={ <Truncate>{ text }</Truncate> } />
				<Tooltip.Popup>{ text }</Tooltip.Popup>
			</Tooltip.Root>
		</Stack>
	);
}

function StyleChangeItem( { row }: { row: StyleChangeRow } ) {
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
				<StyleValue row={ row } />
			</Stack>
			<span className="block-editor-style-changes__source">
				{ getRowSource( row ) }
			</span>
		</li>
	);
}

function StyleChangeItems( { rows }: { rows: StyleChangeRow[] } ) {
	return (
		<ul className="block-editor-style-changes__items">
			{ rows.map( ( row ) => (
				<StyleChangeItem key={ row.key } row={ row } />
			) ) }
		</ul>
	);
}

function StyleChangesList( {
	rows,
	onClose,
}: {
	rows: StyleChangeRow[];
	onClose: () => void;
} ) {
	const [ showInherited, setShowInherited ] = useState( false );
	const localRows = rows.filter( ( row ) => row.status !== 'inherited' );
	const inheritedRows = rows.filter( ( row ) => row.status === 'inherited' );
	return (
		<div className="block-editor-style-changes">
			<InspectorPopoverHeader
				title={ __( 'Style changes' ) }
				help={ undefined }
				onClose={ onClose }
			/>
			<section className="block-editor-style-changes__group">
				<h3 className="block-editor-style-changes__heading">
					{ sprintf(
						/* translators: %d: Number of styles set on the block. */
						__( 'Changed on this block (%d)' ),
						localRows.length
					) }
				</h3>
				<StyleChangeItems rows={ localRows } />
			</section>
			{ inheritedRows.length > 0 && (
				<section className="block-editor-style-changes__group">
					<Button
						__next40pxDefaultSize={ false }
						size="small"
						className="block-editor-style-changes__toggle"
						icon={ showInherited ? chevronUp : chevronDown }
						iconPosition="right"
						aria-expanded={ showInherited }
						onClick={ () => setShowInherited( ! showInherited ) }
					>
						{ sprintf(
							/* translators: %d: Number of styles the block takes from Global Styles. */
							__( 'Inherited styles (%d)' ),
							inheritedRows.length
						) }
					</Button>
					{ showInherited && (
						<StyleChangeItems rows={ inheritedRows } />
					) }
				</section>
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
			renderContent={ ( { onClose } ) => (
				<StyleChangesList rows={ rows } onClose={ onClose } />
			) }
		/>
	);
}

/**
 * The block card's indicator for a block that sets some of its own styles.
 * It opens a popover listing the styles the block sets and what each replaced,
 * then, on request, the ones it inherits and where each comes from.
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
