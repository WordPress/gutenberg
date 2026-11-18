import { BlockPreview } from '@wordpress/block-editor';
import {
	Button,
	Modal,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { CheckboxControl, EmptyState, Stack, Text } from '@wordpress/ui';
import { layout as layoutIcon } from '@wordpress/icons';
import { getAreaLabel, getPreviewBlocks, getReplacedMenu } from './utils';
import withMenuName from './with-menu-name';

function CandidatePreview( { location } ) {
	const blocks = useMemo( () => getPreviewBlocks( location ), [ location ] );

	return (
		<div
			inert=""
			style={ {
				borderRadius: 2,
				// Tall parts, like a vertical header, are clipped so every
				// choice stays a similar, scannable size.
				maxHeight: 200,
				overflow: 'hidden',
				outline:
					'1px solid var(--wpds-color-stroke-surface-neutral, #ddd)',
			} }
		>
			<BlockPreview.Async>
				<BlockPreview blocks={ blocks } viewportWidth={ 1200 } />
			</BlockPreview.Async>
		</div>
	);
}

/**
 * Choose where a menu is shown: every header, footer and overlay with a
 * menu in it, each previewed, to tick or untick.
 *
 * @param {Object}   props
 * @param {Object[]} props.candidates         Every place a menu can be shown.
 * @param {string[]} props.initialSelectedIds The places ticked when it opens.
 * @param {boolean}  props.isUpdate           Whether the menu is already
 *                                            shown somewhere, so unticking
 *                                            removes it.
 * @param {Function} props.onApply            Called with the ticked IDs.
 * @param {Function} props.onClose            Closes the modal.
 * @param {number}   props.navigationId       The menu being placed.
 * @param {string}   props.menuTitle          The menu's name.
 * @param {Object[]} props.menus              Every menu.
 * @param {?number}  props.fallbackMenuId     The menu shown when no menu is chosen.
 * @return {Element} The modal.
 */
export default function ChooseLocationModal( {
	candidates,
	initialSelectedIds,
	isUpdate,
	onApply,
	onClose,
	navigationId,
	menuTitle,
	menus,
	fallbackMenuId,
} ) {
	const [ selectedIds, setSelectedIds ] = useState( initialSelectedIds );
	const [ replacements, setReplacements ] = useState( null );

	// Before showing this menu somewhere that already shows another one (or
	// links of its own), say which, and ask first.
	const apply = () => {
		const found = candidates
			.filter(
				( location ) =>
					selectedIds.includes( location.id ) &&
					! initialSelectedIds.includes( location.id )
			)
			.map( ( location ) => ( {
				location,
				replaced: getReplacedMenu(
					location,
					navigationId,
					menus,
					fallbackMenuId
				),
			} ) )
			.filter( ( { replaced } ) => replaced );

		if ( found.length ) {
			setReplacements( found );
			return;
		}
		onApply( selectedIds );
	};
	const hasChanges =
		selectedIds.length !== initialSelectedIds.length ||
		selectedIds.some( ( id ) => ! initialSelectedIds.includes( id ) );

	const toggle = ( id, isChecked ) =>
		setSelectedIds( ( ids ) =>
			isChecked
				? [ ...new Set( [ ...ids, id ] ) ]
				: ids.filter( ( current ) => current !== id )
		);

	let summary = __( 'Choose one or more places for this menu.' );
	if ( selectedIds.length ) {
		summary = sprintf(
			/* translators: %d: Number of places chosen. */
			_n( '%d place chosen', '%d places chosen', selectedIds.length ),
			selectedIds.length
		);
	} else if ( isUpdate ) {
		summary = __( 'No places chosen. The menu won’t show on your site.' );
	}

	return (
		<Modal
			title={
				isUpdate ? __( 'Update locations' ) : __( 'Choose location' )
			}
			onRequestClose={ onClose }
			size="large"
		>
			<Stack direction="column" gap="lg">
				<Text render={ <p /> } style={ { margin: 0 } }>
					{ __( 'Choose where this menu shows on your site.' ) }
				</Text>
				{ ! candidates.length && (
					<EmptyState.Root>
						<EmptyState.Icon icon={ layoutIcon } />
						<EmptyState.Title>
							{ __( 'No menu locations found' ) }
						</EmptyState.Title>
						<EmptyState.Description>
							{ __(
								'Add a menu to a header, footer or overlay first, then choose it here.'
							) }
						</EmptyState.Description>
					</EmptyState.Root>
				) }
				{ candidates.length > 0 && (
					<div
						style={ {
							display: 'grid',
							gridTemplateColumns:
								'repeat(auto-fill, minmax(300px, 1fr))',
							alignItems: 'start',
							gap: 16,
						} }
					>
						{ candidates.map( ( location ) => (
							<Stack
								key={ location.id }
								direction="column"
								gap="sm"
							>
								<Stack
									direction="row"
									align="center"
									justify="space-between"
								>
									<CheckboxControl
										label={ location.title }
										checked={ selectedIds.includes(
											location.id
										) }
										onCheckedChange={ ( isChecked ) =>
											toggle( location.id, isChecked )
										}
									/>
									<Text
										variant="body-sm"
										style={ {
											color: 'var(--wpds-color-foreground-content-neutral-weak, #757575)',
										} }
									>
										{ getAreaLabel( location.area ) }
									</Text>
								</Stack>
								<CandidatePreview location={ location } />
							</Stack>
						) ) }
					</div>
				) }
				{ candidates.length > 0 && (
					<Stack
						direction="row"
						align="center"
						justify="space-between"
						gap="md"
					>
						<Text
							style={ {
								color: 'var(--wpds-color-foreground-content-neutral-weak, #757575)',
							} }
						>
							{ summary }
						</Text>
						<Stack direction="row" gap="sm">
							<Button
								__next40pxDefaultSize
								variant="tertiary"
								onClick={ onClose }
							>
								{ __( 'Cancel' ) }
							</Button>
							<Button
								__next40pxDefaultSize
								variant="primary"
								disabled={
									! hasChanges ||
									( ! isUpdate && ! selectedIds.length )
								}
								accessibleWhenDisabled
								onClick={ apply }
							>
								{ isUpdate
									? __( 'Update locations' )
									: __( 'Add to locations' ) }
							</Button>
						</Stack>
					</Stack>
				) }
			</Stack>
			{ replacements && (
				<ReplaceMenuDialog
					replacements={ replacements }
					menuTitle={ menuTitle }
					onConfirm={ () => {
						setReplacements( null );
						onApply( selectedIds );
					} }
					onCancel={ () => setReplacements( null ) }
				/>
			) }
		</Modal>
	);
}

/**
 * Confirms replacing the menu already shown in one or more places.
 *
 * @param {Object}   props
 * @param {Object[]} props.replacements `{ location, replaced }` for each place.
 * @param {string}   props.menuTitle    The menu about to be shown.
 * @param {Function} props.onConfirm    Replace them.
 * @param {Function} props.onCancel     Go back to choosing.
 * @return {Element} The dialog.
 */
function ReplaceMenuDialog( { replacements, menuTitle, onConfirm, onCancel } ) {
	const isSingle = replacements.length === 1;
	const [ first ] = replacements;
	const savedMenus = [
		...new Set(
			replacements
				.filter( ( { replaced } ) => ! replaced.isOwnLinks )
				.map( ( { replaced } ) => replaced.title )
		),
	];

	let title;
	if ( ! isSingle ) {
		title = sprintf(
			/* translators: %d: Number of places that already show a menu. */
			_n(
				'Replace the menu in %d place?',
				'Replace the menus in %d places?',
				replacements.length
			),
			replacements.length
		);
	} else if ( first.replaced.isOwnLinks ) {
		title = sprintf(
			/* translators: %s: Where the menu goes, like "Footer". */
			__( 'Replace the links in %s?' ),
			first.location.title
		);
	} else {
		title = sprintf(
			/* translators: 1: Menu already shown there. 2: Where, like "Header". */
			__( 'Replace “%1$s” in %2$s?' ),
			first.replaced.title,
			first.location.title
		);
	}

	return (
		<ConfirmDialog
			isOpen
			title={ title }
			__experimentalHideHeader={ false }
			onConfirm={ onConfirm }
			onCancel={ onCancel }
			confirmButtonText={
				isSingle ? __( 'Replace menu' ) : __( 'Replace menus' )
			}
			size="medium"
		>
			<Stack direction="column" gap="md">
				<Text render={ <p /> } style={ { margin: 0 } }>
					{ isSingle
						? __( 'Another menu is already used in this place.' )
						: __(
								'Other menus are already used in these places.'
							) }
				</Text>
				<ul style={ { margin: 0, paddingInlineStart: 20 } }>
					{ replacements.map( ( { location, replaced } ) => (
						<li key={ location.id }>
							<Text>
								{ replaced.isOwnLinks
									? sprintf(
											/* translators: %s: Where, like "Footer". */
											__(
												'%s uses its own links, which will be removed.'
											),
											location.title
										)
									: withMenuName(
											sprintf(
												/* translators: %s: Where, like "Header". "<menu />" is replaced by the menu's name. */
												__( '%s uses <menu />.' ),
												location.title
											),
											replaced.title
										) }
							</Text>
						</li>
					) ) }
				</ul>
				<Text render={ <p /> } style={ { margin: 0 } }>
					{ withMenuName(
						/* translators: "<menu />" is replaced by the name of the menu being placed. */
						__( '<menu /> will be shown there instead.' ),
						menuTitle
					) }{ ' ' }
					{ savedMenus.length === 1 &&
						withMenuName(
							/* translators: "<menu />" is replaced by the name of the menu being replaced. */
							__( '<menu /> isn’t deleted.' ),
							savedMenus[ 0 ]
						) }
					{ savedMenus.length > 1 &&
						__( 'The other menus aren’t deleted.' ) }{ ' ' }
					{ __( 'Nothing changes on your site until you save.' ) }
				</Text>
			</Stack>
		</ConfirmDialog>
	);
}
