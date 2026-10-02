import {
	Button,
	ColorIndicator,
	Dropdown,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Tooltip } from '@wordpress/ui';
import {
	useStyleSourceRows,
	getResetAttributes,
} from './use-style-source-rows';

// Values longer than this truncate, with the full value in a tooltip.
const TRUNCATE_LIMIT = 20;

interface StyleSourceRow {
	id: string;
	label: string;
	value: string;
	colorValue?: unknown;
	sourceLabel: string;
}

interface ChangedStyleSourceRow extends StyleSourceRow {
	isOverride: boolean;
	replacedValue?: string;
	leafPaths: string[][];
	presetAttributes: string[];
}

interface StyleSourcesProps {
	name: string;
	attributes: Record< string, any >;
	setAttributes: ( attributes: Record< string, any > ) => void;
}

function StyleSourceValue( { row }: { row: StyleSourceRow } ) {
	const text =
		row.value.length > TRUNCATE_LIMIT ? (
			<Tooltip.Root>
				<Tooltip.Trigger render={ <span /> }>
					<Truncate limit={ TRUNCATE_LIMIT } ellipsizeMode="tail">
						{ row.value }
					</Truncate>
				</Tooltip.Trigger>
				<Tooltip.Popup>{ row.value }</Tooltip.Popup>
			</Tooltip.Root>
		) : (
			row.value
		);
	return (
		<Stack
			className="editor-style-sources__value"
			direction="row"
			align="center"
			gap="xs"
		>
			{ typeof row.colorValue === 'string' && (
				<ColorIndicator colorValue={ row.colorValue } />
			) }
			{ text }
		</Stack>
	);
}

function StyleSourceItem( {
	row,
	secondary,
	action,
}: {
	row: StyleSourceRow;
	secondary: string;
	action?: React.ReactNode;
} ) {
	return (
		<Item className="editor-style-sources__row">
			<Stack direction="column" gap="xs">
				<Stack direction="row" justify="space-between" gap="sm">
					<span className="editor-style-sources__label">
						{ row.label }
					</span>
					<StyleSourceValue row={ row } />
				</Stack>
				<Stack
					direction="row"
					justify="space-between"
					align="center"
					gap="sm"
				>
					<span className="editor-style-sources__secondary">
						{ secondary }
					</span>
					{ action }
				</Stack>
			</Stack>
		</Item>
	);
}

function getChangedDescription( row: ChangedStyleSourceRow ) {
	if ( ! row.isOverride ) {
		return row.sourceLabel;
	}
	return sprintf(
		// translators: 1: Value the block replaced, e.g. "Accent". 2: Where that value comes from, e.g. "Button block".
		__( 'Was %1$s, %2$s' ),
		row.replacedValue ?? '',
		row.sourceLabel
	);
}

function StyleSourcesContent( {
	name,
	attributes,
	setAttributes,
	onClose,
}: StyleSourcesProps & { onClose: () => void } ) {
	const { changed, inherited, variationLabel } = useStyleSourceRows(
		name,
		attributes
	) as {
		changed: ChangedStyleSourceRow[];
		inherited: StyleSourceRow[];
		variationLabel: string | null;
	};
	const changedHeadingRef = useRef< HTMLHeadingElement >( null );
	const blockTitle = getBlockType( name )?.title ?? name;

	const reset = ( rows: ChangedStyleSourceRow[] ) => {
		setAttributes( getResetAttributes( attributes, rows ) );
		// The reset row's button goes away, so keep focus in the popover.
		changedHeadingRef.current?.focus();
	};

	return (
		<div className="editor-style-sources">
			<InspectorPopoverHeader
				title={ __( 'Where styles come from' ) }
				help={
					variationLabel
						? sprintf(
								// translators: 1: Block title, e.g. "Button". 2: Block style variation label, e.g. "Outline".
								__( '%1$s, %2$s style' ),
								blockTitle,
								variationLabel
							)
						: blockTitle
				}
				onClose={ onClose }
			/>
			<section className="editor-style-sources__group">
				<Stack
					className="editor-style-sources__group-header"
					direction="row"
					justify="space-between"
					align="center"
					gap="sm"
				>
					<h3
						className="editor-style-sources__group-title"
						ref={ changedHeadingRef }
						tabIndex={ -1 }
					>
						{ sprintf(
							// translators: %d: Number of styles set on this block.
							__( 'Changed on this block (%d)' ),
							changed.length
						) }
					</h3>
					{ changed.length > 0 && (
						<Button
							variant="link"
							onClick={ () => reset( changed ) }
						>
							{ __( 'Reset all' ) }
						</Button>
					) }
				</Stack>
				{ changed.length > 0 ? (
					<ItemGroup isBordered isSeparated>
						{ changed.map( ( row ) => (
							<StyleSourceItem
								key={ row.id }
								row={ row }
								secondary={ getChangedDescription( row ) }
								action={
									<Button
										variant="link"
										onClick={ () => reset( [ row ] ) }
										aria-label={ sprintf(
											// translators: %s: Style name, e.g. "Font size".
											__( 'Reset %s' ),
											row.label
										) }
									>
										{ __( 'Reset' ) }
									</Button>
								}
							/>
						) ) }
					</ItemGroup>
				) : (
					<p className="editor-style-sources__note">
						{ __( 'This block uses the site and theme styles.' ) }
					</p>
				) }
			</section>
			<section className="editor-style-sources__group">
				<h3 className="editor-style-sources__group-title editor-style-sources__group-header">
					{ sprintf(
						// translators: %d: Number of styles that come from the site and theme.
						__( 'Not changed (%d)' ),
						inherited.length
					) }
				</h3>
				{ inherited.length > 0 && (
					<ItemGroup isBordered isSeparated>
						{ inherited.map( ( row ) => (
							<StyleSourceItem
								key={ row.id }
								row={ row }
								secondary={ row.sourceLabel }
							/>
						) ) }
					</ItemGroup>
				) }
			</section>
		</div>
	);
}

/**
 * Advanced panel control that opens a popover beside the inspector, listing
 * the styles changed on this block and the ones it takes from Global Styles.
 *
 * @param props Component props.
 */
export default function StyleSourcesDropdown( props: StyleSourcesProps ) {
	const [ popoverAnchor, setPopoverAnchor ] = useState< HTMLElement | null >(
		null
	);
	const helpId = useInstanceId(
		StyleSourcesDropdown,
		'editor-style-sources__help'
	);
	const popoverProps = useMemo(
		() => ( {
			anchor: popoverAnchor,
			placement: 'left-start' as const,
			offset: 36,
			shift: true,
		} ),
		[ popoverAnchor ]
	);

	return (
		<div
			className="editor-push-changes-to-global-styles-control editor-style-sources__control"
			ref={ setPopoverAnchor }
		>
			<Dropdown
				className="editor-style-sources__dropdown"
				popoverProps={ popoverProps }
				contentClassName="editor-style-sources__popover"
				focusOnMount
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						__next40pxDefaultSize
						variant="secondary"
						aria-expanded={ isOpen }
						aria-describedby={ helpId }
						onClick={ onToggle }
					>
						{ __( 'Where styles come from' ) }
					</Button>
				) }
				renderContent={ ( { onClose } ) => (
					<StyleSourcesContent { ...props } onClose={ onClose } />
				) }
			/>
			<p id={ helpId } className="editor-style-sources__help">
				{ __(
					'See which styles are set on this block and which come from the site and theme.'
				) }
			</p>
		</div>
	);
}
