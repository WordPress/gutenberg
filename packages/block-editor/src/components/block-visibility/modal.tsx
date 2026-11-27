import clsx from 'clsx';
import { __, sprintf } from '@wordpress/i18n';
import {
	useState,
	useMemo,
	useCallback,
	createInterpolateElement,
} from '@wordpress/element';
import {
	Button,
	CheckboxControl as WCCheckboxControl,
	Flex,
	FlexItem,
	Icon as WCIcon,
	Modal,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { store as noticesStore } from '@wordpress/notices';
import type { FormEvent } from 'react';
import { store as blockEditorStore } from '../../store';
import { cleanEmptyObject } from '../../hooks/utils';
import {
	applyVisibilityChanges,
	getVisibilityOptions,
	getVisibilityOptionState,
} from './visibility-options';
import {
	getViewportCheckboxState,
	getHideEverywhereCheckboxState,
} from './utils';
import type { TreeBlock } from '../../store/types';
import type { BlockVisibilityModalProps } from './types';
import type { ViewportSettings } from './ranges';

type CheckboxStates = Record< string, boolean | null >;

const EMPTY_BLOCKS: TreeBlock[] = [];

/**
 * Modal component for configuring block visibility across viewports.
 *
 * Allows users to hide blocks on specific viewport sizes (mobile, tablet, desktop)
 * or hide them everywhere. When editing multiple blocks, checkboxes only show as
 * checked if ALL selected blocks share the same setting to avoid ambiguity.
 *
 * @param props           Component props.
 * @param props.clientIds The client IDs of the blocks to hide.
 * @param props.onClose   Callback function invoked when the modal is closed.
 * @return The modal component.
 */
export default function BlockVisibilityModal( {
	clientIds,
	onClose,
}: BlockVisibilityModalProps ) {
	const { createSuccessNotice } = useDispatch( noticesStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const blocks = useSelect(
		( select ) =>
			// The modal is opened for existing blocks.
			( select( blockEditorStore ).getBlocksByClientId(
				clientIds
			) as TreeBlock[] ) ?? EMPTY_BLOCKS,
		[ clientIds ]
	);
	const listViewShortcut = useSelect( ( select ) => {
		// The editor registers the List View shortcut.
		return select( keyboardShortcutsStore ).getShortcutRepresentation(
			'core/editor/toggle-list-view'
		) as string;
	}, [] );
	const viewportSettings = useSelect(
		( select ) =>
			// The `viewport` setting holds the breakpoints.
			select( blockEditorStore ).getSettings().__experimentalFeatures
				?.viewport as ViewportSettings | undefined,
		[]
	);
	const { options, currentViewportValues } = useMemo( () => {
		const values = blocks.map(
			( block ) => block.attributes?.metadata?.blockVisibility
		);
		const blockOptions = getVisibilityOptions( viewportSettings, values );
		const viewportChecked: CheckboxStates = {};
		for ( const option of blockOptions ) {
			viewportChecked[ option.key ] = option.legacy
				? getViewportCheckboxState( blocks, option.legacy )
				: getVisibilityOptionState( values, option );
		}
		return {
			options: blockOptions,
			currentViewportValues: {
				hideEverywhere: getHideEverywhereCheckboxState( blocks ),
				viewportChecked,
			},
		};
	}, [ blocks, viewportSettings ] );

	// Compare against what the dialog opened with, and apply changes to the latest block attributes.
	const [ initialViewportValues ] = useState( currentViewportValues );
	const [ viewportChecked, setViewportChecked ] = useState(
		initialViewportValues.viewportChecked
	);
	const [ hideEverywhere, setHideEverywhere ] = useState(
		initialViewportValues.hideEverywhere
	);

	const handleViewportCheckboxChange = useCallback(
		( viewport: string, isChecked: boolean ) => {
			setViewportChecked( {
				...viewportChecked,
				[ viewport ]: isChecked,
			} );
		},
		[ viewportChecked ]
	);

	const noticeMessage = useMemo( () => {
		if ( ! hideEverywhere ) {
			return sprintf(
				// translators: %s: The shortcut key to access the List View.
				__(
					'Block visibility settings updated. You can access them via the List View (%s).'
				),
				listViewShortcut
			);
		}

		const message =
			blocks?.length > 1
				? // translators: %s: The shortcut key to access the List View.
					__(
						'Blocks hidden. You can access them via the List View (%s).'
					)
				: // translators: %s: The shortcut key to access the List View.
					__(
						'Block hidden. You can access it via the List View (%s).'
					);

		return sprintf( message, listViewShortcut );
	}, [ hideEverywhere, blocks?.length, listViewShortcut ] );

	const isAnyViewportChecked = useMemo(
		() =>
			Object.values( viewportChecked ).some(
				( checked ) => checked === true || checked === null
			),
		[ viewportChecked ]
	);

	const changedOptions = useMemo( () => {
		const changes: Record< string, boolean > = {};
		for ( const { key } of options ) {
			const checked = viewportChecked[ key ];
			if (
				typeof checked === 'boolean' &&
				checked !== initialViewportValues.viewportChecked[ key ]
			) {
				changes[ key ] = checked;
			}
		}
		return changes;
	}, [ options, viewportChecked, initialViewportValues ] );
	const hideEverywhereChanged =
		hideEverywhere !== initialViewportValues.hideEverywhere;
	const isDirty =
		hideEverywhereChanged || Object.keys( changedOptions ).length > 0;

	const hasIndeterminateValues = useMemo( () => {
		if ( hideEverywhere === null ) {
			return true;
		}
		return Object.values( viewportChecked ).some(
			( checked ) => checked === null
		);
	}, [ hideEverywhere, viewportChecked ] );

	const handleSubmit = useCallback(
		( event: FormEvent ) => {
			event.preventDefault();
			if ( ! isDirty ) {
				return;
			}
			const attributesByClientId = Object.fromEntries(
				blocks.map( ( { clientId, attributes } ) => {
					const previous = attributes?.metadata?.blockVisibility;
					const blockVisibility =
						hideEverywhere === true ||
						( previous === false && ! hideEverywhereChanged )
							? false
							: applyVisibilityChanges(
									previous,
									options,
									changedOptions
								);
					return [
						clientId,
						{
							metadata: cleanEmptyObject( {
								...attributes?.metadata,
								blockVisibility,
							} ),
						},
					];
				} )
			);
			updateBlockAttributes( clientIds, attributesByClientId, {
				uniqueByBlock: true,
			} );

			createSuccessNotice( noticeMessage, {
				id: hideEverywhere
					? 'block-visibility-hidden'
					: 'block-visibility-viewports-updated',
				type: 'snackbar',
			} );
			onClose();
		},
		[
			blocks,
			clientIds,
			createSuccessNotice,
			hideEverywhere,
			hideEverywhereChanged,
			isDirty,
			noticeMessage,
			onClose,
			updateBlockAttributes,
			options,
			changedOptions,
		]
	);

	const hasMultipleBlocks = blocks?.length > 1;

	return (
		<Modal
			title={
				clientIds?.length > 1 ? __( 'Hide blocks' ) : __( 'Hide block' )
			}
			onRequestClose={ onClose }
			overlayClassName="block-editor-block-visibility-modal"
			size="small"
		>
			<form onSubmit={ handleSubmit }>
				<fieldset>
					<legend>
						{ hasMultipleBlocks
							? __(
									'Select the viewport sizes for which you want to hide the blocks. Changes will apply to all selected blocks.'
								)
							: __(
									'Select the viewport size for which you want to hide the block.'
								) }
					</legend>
					<ul className="block-editor-block-visibility-modal__options">
						<li className="block-editor-block-visibility-modal__options-item block-editor-block-visibility-modal__options-item--everywhere">
							<WCCheckboxControl
								className="block-editor-block-visibility-modal__options-checkbox--everywhere"
								label={ __( 'Omit from published content' ) }
								checked={ hideEverywhere === true }
								indeterminate={ hideEverywhere === null }
								onChange={ setHideEverywhere }
							/>
							{ hideEverywhere !== true && (
								<ul className="block-editor-block-visibility-modal__sub-options">
									{ options.map( ( { label, icon, key } ) => (
										<li
											key={ key }
											className="block-editor-block-visibility-modal__options-item"
										>
											<WCCheckboxControl
												label={ sprintf(
													// translators: %s: The viewport name.
													__( 'Hide on %s' ),
													label
												) }
												checked={
													viewportChecked[ key ] ??
													false
												}
												indeterminate={
													viewportChecked[ key ] ===
													null
												}
												onChange={ ( checked ) =>
													handleViewportCheckboxChange(
														key,
														checked
													)
												}
											/>
											<WCIcon
												icon={ icon }
												className={ clsx( {
													'block-editor-block-visibility-modal__options-icon--checked':
														viewportChecked[ key ],
												} ) }
											/>
										</li>
									) ) }
								</ul>
							) }
						</li>
					</ul>
					{ hasMultipleBlocks && hasIndeterminateValues && (
						<p className="block-editor-block-visibility-modal__description">
							{ __(
								'Selected blocks have different visibility settings. The checkboxes show an indeterminate state when settings differ.'
							) }
						</p>
					) }
					{ ! hasMultipleBlocks && hideEverywhere === true && (
						<p className="block-editor-block-visibility-modal__description">
							{ sprintf(
								// translators: %s: The shortcut key to access the List View.
								__(
									'Block will be hidden in the editor, and omitted from the published markup on the frontend. You can configure it again by selecting it in the List View (%s).'
								),
								listViewShortcut
							) }
						</p>
					) }
					{ ! hasMultipleBlocks &&
						! hideEverywhere &&
						isAnyViewportChecked && (
							<p className="block-editor-block-visibility-modal__description">
								{ createInterpolateElement(
									sprintf(
										// translators: %s: The shortcut key to access the List View
										__(
											'Block will be hidden according to the selected viewports. It will be <strong>included in the published markup on the frontend</strong>. You can configure it again by selecting it in the List View (%s).'
										),
										listViewShortcut
									),
									{
										strong: <strong />,
									}
								) }
							</p>
						) }
				</fieldset>
				<Flex
					className="block-editor-block-visibility-modal__actions"
					justify="flex-end"
					expanded={ false }
				>
					<FlexItem>
						<Button
							variant="tertiary"
							onClick={ onClose }
							__next40pxDefaultSize
						>
							{ __( 'Cancel' ) }
						</Button>
					</FlexItem>
					<FlexItem>
						<Button
							variant="primary"
							type="submit"
							disabled={ ! isDirty }
							accessibleWhenDisabled
							__next40pxDefaultSize
						>
							{ __( 'Apply' ) }
						</Button>
					</FlexItem>
				</Flex>
			</form>
		</Modal>
	);
}
