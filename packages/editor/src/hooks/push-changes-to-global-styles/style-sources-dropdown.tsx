import {
	Button,
	ColorIndicator,
	Dropdown,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { reset as resetIcon } from '@wordpress/icons';
import { Stack, Tooltip } from '@wordpress/ui';
import {
	useStyleSourceRows,
	getResetAttributes,
} from './use-style-source-rows';

// Values longer than this truncate, with the full value in a tooltip.
const TRUNCATE_LIMIT = 24;

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
		<li className="editor-style-sources__row">
			<Stack direction="row" align="center" gap="sm">
				<span className="editor-style-sources__label">
					{ row.label }
				</span>
				<StyleSourceValue row={ row } />
				{ action }
			</Stack>
			<span className="editor-style-sources__secondary">
				{ secondary }
			</span>
		</li>
	);
}

function getChangedDescription( row: ChangedStyleSourceRow ) {
	if ( ! row.isOverride ) {
		return row.sourceLabel;
	}
	return sprintf(
		// translators: 1: Value the block replaced, e.g. "Medium". 2: Where that value comes from, e.g. "Button element".
		__( 'Was %1$s · %2$s' ),
		row.replacedValue ?? '',
		row.sourceLabel
	);
}

function StyleSourcesContent( {
	changed,
	inherited,
	onReset,
	onClose,
}: {
	changed: ChangedStyleSourceRow[];
	inherited: StyleSourceRow[];
	onReset: ( rows: ChangedStyleSourceRow[] ) => void;
	onClose: () => void;
} ) {
	const changedHeadingRef = useRef< HTMLHeadingElement >( null );

	const reset = ( rows: ChangedStyleSourceRow[] ) => {
		onReset( rows );
		// The reset row's button goes away, so keep focus in the popover.
		changedHeadingRef.current?.focus();
	};

	return (
		<div className="editor-style-sources">
			<InspectorPopoverHeader
				title={ __( 'Style changes' ) }
				onClose={ onClose }
			/>
			<section className="editor-style-sources__group">
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
				{ changed.length > 0 ? (
					<ul className="editor-style-sources__rows">
						{ changed.map( ( row ) => (
							<StyleSourceItem
								key={ row.id }
								row={ row }
								secondary={ getChangedDescription( row ) }
								action={
									<Button
										size="small"
										icon={ resetIcon }
										label={ sprintf(
											// translators: %s: Style name, e.g. "Font size".
											__( 'Reset %s' ),
											row.label
										) }
										onClick={ () => reset( [ row ] ) }
									/>
								}
							/>
						) ) }
					</ul>
				) : (
					<p className="editor-style-sources__note">
						{ __( 'This block uses the site and theme styles.' ) }
					</p>
				) }
			</section>
			{ inherited.length > 0 && (
				<section className="editor-style-sources__group">
					<h3 className="editor-style-sources__group-title">
						{ sprintf(
							// translators: %d: Number of styles the block takes from Global Styles.
							__( 'Inherited styles (%d)' ),
							inherited.length
						) }
					</h3>
					<ul className="editor-style-sources__rows">
						{ inherited.map( ( row ) => (
							<StyleSourceItem
								key={ row.id }
								row={ row }
								secondary={ row.sourceLabel }
							/>
						) ) }
					</ul>
				</section>
			) }
			{ changed.length > 0 && (
				<Button
					className="editor-style-sources__reset-all"
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ () => reset( changed ) }
				>
					{ __( 'Reset all' ) }
				</Button>
			) }
		</div>
	);
}

/**
 * Link under "Apply globally" in the Advanced panel. It opens a popover beside
 * the inspector, listing the styles changed on this block and the ones it
 * takes from Global Styles.
 *
 * @param props               Component props.
 * @param props.name          Block name.
 * @param props.attributes    Block attributes.
 * @param props.setAttributes Updates the block attributes.
 */
export default function StyleSourcesDropdown( {
	name,
	attributes,
	setAttributes,
}: StyleSourcesProps ) {
	const [ popoverAnchor, setPopoverAnchor ] = useState< HTMLElement | null >(
		null
	);
	const { changed, inherited } = useStyleSourceRows( name, attributes ) as {
		changed: ChangedStyleSourceRow[];
		inherited: StyleSourceRow[];
		variationLabel: string | null;
	};
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
		<div className="editor-style-sources__control" ref={ setPopoverAnchor }>
			<Dropdown
				popoverProps={ popoverProps }
				contentClassName="editor-style-sources__popover"
				focusOnMount
				renderToggle={ ( { isOpen, onToggle } ) =>
					// Stays while open, so resetting the last change keeps the popover.
					( isOpen || changed.length > 0 ) && (
						<Button
							variant="link"
							aria-expanded={ isOpen }
							onClick={ onToggle }
						>
							{ sprintf(
								// translators: %d: Number of styles set on this block.
								_n(
									'See %d style change',
									'See %d style changes',
									changed.length
								),
								changed.length
							) }
						</Button>
					)
				}
				renderContent={ ( { onClose } ) => (
					<StyleSourcesContent
						changed={ changed }
						inherited={ inherited }
						onReset={ ( rows ) =>
							setAttributes(
								getResetAttributes( attributes, rows )
							)
						}
						onClose={ onClose }
					/>
				) }
			/>
		</div>
	);
}
