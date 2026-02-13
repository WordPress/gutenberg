/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	useState,
	useMemo,
	useCallback,
	createInterpolateElement,
} from '@wordpress/element';
import {
	Button,
	CheckboxControl,
	Flex,
	FlexItem,
	Icon,
	Modal,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import {
	BLOCK_VISIBILITY_VIEWPORT_ENTRIES,
	BLOCK_VISIBILITY_VIEWPORTS,
} from './constants';
import { store as blockEditorStore } from '../../store';
import { cleanEmptyObject } from '../../hooks/utils';
import {
	getViewportCheckboxState,
	getHideEverywhereCheckboxState,
} from './utils';
import './style.scss';

const DEFAULT_VIEWPORT_CHECKBOX_VALUES = {
	[ BLOCK_VISIBILITY_VIEWPORTS.mobile.key ]: false,
	[ BLOCK_VISIBILITY_VIEWPORTS.tablet.key ]: false,
	[ BLOCK_VISIBILITY_VIEWPORTS.desktop.key ]: false,
};

const EMPTY_BLOCKS = [];

/**
 * Modal component for configuring block visibility across viewports.
 *
 * Allows users to hide blocks on specific viewport sizes (mobile, tablet, desktop)
 * or hide them everywhere. When editing multiple blocks, checkboxes only show as
 * checked if ALL selected blocks share the same setting to avoid ambiguity.
 *
 * @param {Object}   props           Component props.
 * @param {Array}    props.clientIds The client IDs of the blocks to hide.
 * @param {Function} props.onClose   Callback function invoked when the modal is closed.
 * @return {JSX.Element} The modal component.
 */
export default function BlockVisibilityModal( { clientIds, onClose } ) {
	const { createSuccessNotice } = useDispatch( noticesStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const blocks = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlocksByClientId( clientIds ) ??
			EMPTY_BLOCKS,
		[ clientIds ]
	);
	const listViewShortcut = useSelect( ( select ) => {
		return select( keyboardShortcutsStore ).getShortcutRepresentation(
			'core/editor/toggle-list-view'
		);
	}, [] );

	const initialViewportValues = useMemo( () => {
		if ( blocks?.length === 0 ) {
			return {
				hideEverywhere: false,
				viewportChecked: {},
			};
		}

		const viewportValues = {};

		BLOCK_VISIBILITY_VIEWPORT_ENTRIES.forEach( ( [ , { key } ] ) => {
			viewportValues[ key ] = getViewportCheckboxState( blocks, key );
		} );

		return {
			hideEverywhere: getHideEverywhereCheckboxState( blocks ),
			viewportChecked: viewportValues,
		};
	}, [ blocks ] );

	const [ viewportChecked, setViewportChecked ] = useState(
		initialViewportValues?.viewportChecked ?? {}
	);
	const [ hideEverywhere, setHideEverywhere ] = useState(
		initialViewportValues?.hideEverywhere ?? false
	);

	const handleViewportCheckboxChange = useCallback(
		( viewport, isChecked ) => {
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

	const isDirty = useMemo( () => {
		if ( hideEverywhere !== initialViewportValues.hideEverywhere ) {
			return true;
		}
		return BLOCK_VISIBILITY_VIEWPORT_ENTRIES.some(
			( [ , { key } ] ) =>
				viewportChecked[ key ] !==
				initialViewportValues.viewportChecked[ key ]
		);
	}, [ hideEverywhere, viewportChecked, initialViewportValues ] );

	const hasIndeterminateValues = useMemo( () => {
		if ( hideEverywhere === null ) {
			return true;
		}
		return Object.values( viewportChecked ).some(
			( checked ) => checked === null
		);
	}, [ hideEverywhere, viewportChecked ] );

	const handleSubmit = useCallback(
		( event ) => {
			event.preventDefault();
			const newVisibility = hideEverywhere
				? false
				: {
						viewport: BLOCK_VISIBILITY_VIEWPORT_ENTRIES.reduce(
							( acc, [ , { key } ] ) => {
								if ( viewportChecked[ key ] ) {
									// Values are inverted to hide the block on the selected viewport.
									// In the UI, the checkbox is checked (true) when the block is hidden on the selected viewport,
									// so 'false' means hide the block on the selected viewport.
									acc[ key ] = false;
								}
								return acc;
							},
							{}
						),
				  };
			const attributesByClientId = Object.fromEntries(
				blocks.map( ( { clientId, attributes } ) => [
					clientId,
					{
						metadata: cleanEmptyObject( {
							...attributes?.metadata,
							blockVisibility: newVisibility,
						} ),
					},
				] )
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
			noticeMessage,
			onClose,
			updateBlockAttributes,
			viewportChecked,
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
							<CheckboxControl
								className="block-editor-block-visibility-modal__options-checkbox--everywhere"
								label={ __( 'Omit from published content' ) }
								checked={ hideEverywhere === true }
								indeterminate={ hideEverywhere === null }
								onChange={ ( checked ) => {
									setHideEverywhere( checked );
									// Reset viewport checkboxes when hide everywhere is checked.
									setViewportChecked(
										DEFAULT_VIEWPORT_CHECKBOX_VALUES
									);
								} }
							/>
							{ hideEverywhere !== true && (
								<ul className="block-editor-block-visibility-modal__sub-options">
									{ BLOCK_VISIBILITY_VIEWPORT_ENTRIES.map(
										( [ , { label, icon, key } ] ) => (
											<li
												key={ key }
												className="block-editor-block-visibility-modal__options-item"
											>
												<CheckboxControl
													label={ sprintf(
														// translators: %s: The viewport name.
														__( 'Hide on %s' ),
														label
													) }
													checked={
														viewportChecked[
															key
														] ?? false
													}
													indeterminate={
														viewportChecked[
															key
														] === null
													}
													onChange={ ( checked ) =>
														handleViewportCheckboxChange(
															key,
															checked
														)
													}
												/>
												<Icon
													icon={ icon }
													className={ clsx( {
														'block-editor-block-visibility-modal__options-icon--checked':
															viewportChecked[
																key
															],
													} ) }
												/>
											</li>
										)
									) }
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
