/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState, useMemo } from '@wordpress/element';
import {
	Button,
	CheckboxControl,
	Flex,
	FlexItem,
	Icon,
	Modal,
} from '@wordpress/components';
import { desktop, tablet, mobile, seen, unseen } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';
import { cleanEmptyObject } from '../../hooks/utils';

const VIEWPORTS = [
	{ key: 'desktop', label: __( 'Hide on desktop' ), icon: desktop },
	{ key: 'tablet', label: __( 'Hide on tablet' ), icon: tablet },
	{ key: 'mobile', label: __( 'Hide on mobile' ), icon: mobile },
];

export default function BlockVisibilityModal( { clientId, onClose } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const blockInformation = useBlockDisplayInformation( clientId );

	const { currentVisibility, blockMetadata } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			const attributes = getBlockAttributes( clientId );
			return {
				currentVisibility: attributes?.metadata?.blockVisibility,
				blockMetadata: attributes?.metadata,
			};
		},
		[ clientId ]
	);

	const listViewShortcut = useSelect( ( select ) => {
		return select( keyboardShortcutsStore ).getShortcutRepresentation(
			'core/editor/toggle-list-view'
		);
	}, [] );

	const [ hideEverywhere, setHideEverywhere ] = useState( false );
	const [ hiddenViewports, setHiddenViewports ] = useState( {
		desktop: false,
		tablet: false,
		mobile: false,
	} );

	useEffect( () => {
		if ( currentVisibility === false ) {
			setHideEverywhere( true );
			setHiddenViewports( {
				desktop: false,
				tablet: false,
				mobile: false,
			} );
		} else if ( typeof currentVisibility === 'object' ) {
			setHideEverywhere( false );
			setHiddenViewports( {
				desktop: currentVisibility.desktop === false,
				tablet: currentVisibility.tablet === false,
				mobile: currentVisibility.mobile === false,
			} );
		} else {
			setHideEverywhere( false );
			setHiddenViewports( {
				desktop: false,
				tablet: false,
				mobile: false,
			} );
		}
	}, [ currentVisibility ] );

	const handleHideEverywhereChange = ( newValue ) => {
		setHideEverywhere( newValue );
		if ( newValue ) {
			setHiddenViewports( {
				desktop: false,
				tablet: false,
				mobile: false,
			} );
		}
	};

	const handleViewportChange = ( viewport, newValue ) => {
		const updated = { ...hiddenViewports, [ viewport ]: newValue };

		// If all three are checked, switch to "hide everywhere"
		if ( updated.desktop && updated.tablet && updated.mobile ) {
			setHideEverywhere( true );
			setHiddenViewports( {
				desktop: false,
				tablet: false,
				mobile: false,
			} );
		} else {
			setHiddenViewports( updated );
		}
	};

	const hasAnyViewportHidden =
		hiddenViewports.desktop ||
		hiddenViewports.tablet ||
		hiddenViewports.mobile;

	const descriptionText = useMemo( () => {
		if ( hideEverywhere ) {
			return sprintf(
				/* translators: %s: keyboard shortcut to access List View */
				__(
					'Block will be hidden in the editor, and omitted from the published markup on the frontend. You can show it again by selecting it in the List View (%s).'
				),
				listViewShortcut
			);
		}

		if ( ! hasAnyViewportHidden ) {
			return null;
		}

		const hidden = VIEWPORTS.filter( ( v ) => hiddenViewports[ v.key ] )
			.map( ( v ) => v.key )
			.join( ` ${ __( 'and' ) } ` );

		const visible = VIEWPORTS.filter( ( v ) => ! hiddenViewports[ v.key ] )
			.map( ( v ) => v.key )
			.join( ` ${ __( 'and' ) } ` );

		return sprintf(
			/* translators: 1: list of hidden devices (e.g., "desktop and tablet"), 2: list of visible devices (e.g., "mobile"), 3: keyboard shortcut */
			__(
				'Block will be hidden on %1$s, visible on %2$s. It is included in the published markup on the frontend. You can configure it again by selecting it in the List View (%3$s).'
			),
			hidden,
			visible,
			listViewShortcut
		);
	}, [
		hideEverywhere,
		hiddenViewports,
		hasAnyViewportHidden,
		listViewShortcut,
	] );

	const handleSubmit = ( event ) => {
		event.preventDefault();

		let newVisibility;
		if ( hideEverywhere ) {
			newVisibility = false;
		} else if ( hasAnyViewportHidden ) {
			newVisibility = {};
			VIEWPORTS.forEach( ( { key } ) => {
				if ( hiddenViewports[ key ] ) {
					newVisibility[ key ] = false;
				}
			} );
		} else {
			newVisibility = undefined;
		}

		updateBlockAttributes( [ clientId ], {
			metadata: cleanEmptyObject( {
				...blockMetadata,
				blockVisibility: newVisibility,
			} ),
		} );

		onClose();
	};

	return (
		<Modal
			title={ sprintf(
				/* translators: %s: Name of the block (lowercase). */
				__( 'Hide %s' ),
				blockInformation.title.toLowerCase()
			) }
			overlayClassName="block-editor-block-visibility-modal"
			onRequestClose={ onClose }
			size="small"
		>
			<p className="block-editor-block-visibility-modal__description">
				{ __( 'Select options for hiding the block.' ) }
			</p>
			<form onSubmit={ handleSubmit }>
				<fieldset className="block-editor-block-visibility-modal__options">
					<ul className="block-editor-block-visibility-modal__checklist">
						<li className="block-editor-block-visibility-modal__main-option">
							<CheckboxControl
								__nextHasNoMarginBottom
								className="block-editor-block-visibility-modal__options-main"
								label={ __( 'Hide everywhere' ) }
								checked={ hideEverywhere }
								onChange={ handleHideEverywhereChange }
							/>
							{ hideEverywhere && (
								<Icon
									className="block-editor-block-visibility-modal__visibility-icon"
									icon={ unseen }
								/>
							) }
							{ ! hideEverywhere && ! hasAnyViewportHidden && (
								<Icon
									className="block-editor-block-visibility-modal__visibility-icon"
									icon={ seen }
								/>
							) }
							{ ! hideEverywhere && (
								<ul className="block-editor-block-visibility-modal__checklist">
									{ VIEWPORTS.map(
										( { key, label, icon } ) => (
											<li
												key={ key }
												className="block-editor-block-visibility-modal__checklist-item"
											>
												<CheckboxControl
													__nextHasNoMarginBottom
													label={ label }
													checked={
														hiddenViewports[ key ]
													}
													onChange={ ( value ) =>
														handleViewportChange(
															key,
															value
														)
													}
												/>
												<Icon
													className="block-editor-block-visibility-modal__device-icon"
													icon={ icon }
												/>
											</li>
										)
									) }
								</ul>
							) }
						</li>
					</ul>
					{ ( hideEverywhere || hasAnyViewportHidden ) &&
						descriptionText && (
							<p className="block-editor-block-visibility-modal__explanation">
								{ descriptionText }
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
