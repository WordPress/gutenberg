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
	Notice,
} from '@wordpress/components';
import { desktop, tablet, mobile } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { cleanEmptyObject } from '../../hooks/utils';
import { createDefaultBreakpoints, BREAKPOINT_NAMES } from './constants';
import './style.scss';

/**
 * Modal component for configuring block visibility across responsive breakpoints.
 *
 * Allows users to hide blocks on specific viewport sizes (mobile, tablet, desktop)
 * or hide them everywhere. When editing multiple blocks, checkboxes only show as
 * checked if ALL selected blocks share the same setting to avoid ambiguity.
 *
 * @param {Object}   props           Component props.
 * @param {string[]} props.clientIds Array of block client IDs to configure visibility for.
 * @param {Function} props.onClose   Callback function invoked when the modal is closed.
 * @return {JSX.Element} The modal component.
 */
export default function BlockVisibilityBreakpointsModal( {
	clientIds,
	onClose,
} ) {
	const { blocks, blockType } = useSelect(
		( select ) => {
			const _blocks =
				select( blockEditorStore ).getBlocksByClientId( clientIds );
			const firstBlock = _blocks?.[ 0 ];
			const _blockType =
				firstBlock && firstBlock.name
					? select( blocksStore ).getBlockType( firstBlock.name )
					: null;
			return {
				blocks: _blocks || [],
				blockType: _blockType,
			};
		},
		[ clientIds ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Get initial breakpoint visibility state from blocks
	// Only show a value as checked if ALL blocks have that value set
	const initialBreakpoints = useMemo( () => {
		const breakpoints = createDefaultBreakpoints();

		if ( blocks.length === 0 ) {
			return breakpoints;
		}

		// Check if all blocks have the same value for each breakpoint
		const allBlocksHaveMobile = blocks.every(
			( block ) =>
				block &&
				block.attributes?.metadata?.blockVisibilityBreakpoints?.[
					BREAKPOINT_NAMES.MOBILE
				] === true
		);
		const allBlocksHaveTablet = blocks.every(
			( block ) =>
				block &&
				block.attributes?.metadata?.blockVisibilityBreakpoints?.[
					BREAKPOINT_NAMES.TABLET
				] === true
		);
		const allBlocksHaveDesktop = blocks.every(
			( block ) =>
				block &&
				block.attributes?.metadata?.blockVisibilityBreakpoints?.[
					BREAKPOINT_NAMES.DESKTOP
				] === true
		);

		breakpoints[ BREAKPOINT_NAMES.MOBILE ] = allBlocksHaveMobile;
		breakpoints[ BREAKPOINT_NAMES.TABLET ] = allBlocksHaveTablet;
		breakpoints[ BREAKPOINT_NAMES.DESKTOP ] = allBlocksHaveDesktop;

		return breakpoints;
	}, [ blocks ] );

	// Only show "Hide everywhere" as checked if ALL blocks have it set
	const initialHideEverywhere = useMemo( () => {
		if ( blocks.length === 0 ) {
			return false;
		}
		return blocks.every(
			( block ) =>
				block && block.attributes?.metadata?.blockVisibility === false
		);
	}, [ blocks ] );

	const [ breakpoints, setBreakpoints ] = useState( initialBreakpoints );
	const [ hideEverywhere, setHideEverywhere ] = useState(
		initialHideEverywhere
	);
	const [ error, setError ] = useState( null );

	useEffect( () => {
		setBreakpoints( initialBreakpoints );
		setHideEverywhere( initialHideEverywhere );
	}, [ initialBreakpoints, initialHideEverywhere ] );

	// Handle "Hide everywhere" toggle
	const handleHideEverywhereChange = ( newValue ) => {
		setHideEverywhere( newValue );
		setBreakpoints( {
			[ BREAKPOINT_NAMES.MOBILE ]: newValue,
			[ BREAKPOINT_NAMES.TABLET ]: newValue,
			[ BREAKPOINT_NAMES.DESKTOP ]: newValue,
		} );
	};

	// Handle individual breakpoint toggle
	const handleBreakpointChange = ( breakpoint, value ) => {
		const newBreakpoints = {
			...breakpoints,
			[ breakpoint ]: value,
		};
		setBreakpoints( newBreakpoints );

		// Check if all breakpoints are now selected
		const allSelected =
			newBreakpoints[ BREAKPOINT_NAMES.MOBILE ] &&
			newBreakpoints[ BREAKPOINT_NAMES.TABLET ] &&
			newBreakpoints[ BREAKPOINT_NAMES.DESKTOP ];

		// If all breakpoints are selected, check "Hide everywhere"
		// If any breakpoint is unchecked and "Hide everywhere" is checked, uncheck it
		if ( allSelected ) {
			setHideEverywhere( true );
		} else if ( hideEverywhere ) {
			setHideEverywhere( false );
		}
	};

	const handleSubmit = ( event ) => {
		event.preventDefault();

		try {
			const attributesByClientId = Object.fromEntries(
				blocks
					.filter( ( block ) => block && block.clientId )
					.map( ( { clientId, attributes } ) => [
						clientId,
						{
							metadata: cleanEmptyObject( {
								...attributes?.metadata,
								blockVisibility: hideEverywhere
									? false
									: undefined,
								blockVisibilityBreakpoints:
									breakpoints[ BREAKPOINT_NAMES.MOBILE ] ||
									breakpoints[ BREAKPOINT_NAMES.TABLET ] ||
									breakpoints[ BREAKPOINT_NAMES.DESKTOP ]
										? {
												[ BREAKPOINT_NAMES.MOBILE ]:
													breakpoints[
														BREAKPOINT_NAMES.MOBILE
													] || false,
												[ BREAKPOINT_NAMES.TABLET ]:
													breakpoints[
														BREAKPOINT_NAMES.TABLET
													] || false,
												[ BREAKPOINT_NAMES.DESKTOP ]:
													breakpoints[
														BREAKPOINT_NAMES.DESKTOP
													] || false,
										  }
										: undefined,
							} ),
						},
					] )
			);

			updateBlockAttributes( clientIds, attributesByClientId, {
				uniqueByBlock: true,
			} );

			onClose();
		} catch ( err ) {
			setError(
				__( 'Failed to save visibility settings. Please try again.' )
			);
		}
	};

	const modalTitle = blockType?.title
		? sprintf(
				/* translators: %s: Block type title (e.g., "Image", "Paragraph") */
				__( 'Hide %s' ),
				blockType.title
		  )
		: __( 'Hide block' );

	return (
		<Modal
			title={ modalTitle }
			onRequestClose={ onClose }
			overlayClassName="block-editor-block-visibility-breakpoints-modal"
			size="small"
		>
			<form onSubmit={ handleSubmit }>
				{ error && (
					<Notice status="error" isDismissible={ false }>
						{ error }
					</Notice>
				) }
				<p>{ __( 'Select options for hiding the block.' ) }</p>
				<fieldset className="block-editor-block-visibility-breakpoints-modal__options">
					<CheckboxControl
						__nextHasNoMarginBottom
						label={
							<span className="block-editor-block-visibility-breakpoints-modal__hide-everywhere">
								{ __( 'Hide everywhere' ) }
							</span>
						}
						checked={ hideEverywhere }
						onChange={ handleHideEverywhereChange }
					/>
					<div className="block-editor-block-visibility-breakpoints-modal__breakpoints">
						<CheckboxControl
							__nextHasNoMarginBottom
							label={
								<span className="block-editor-block-visibility-breakpoints-modal__label">
									{ __( 'Hide on desktop' ) }
									<Icon
										icon={ desktop }
										className="block-editor-block-visibility-breakpoints-modal__icon"
									/>
								</span>
							}
							checked={ breakpoints[ BREAKPOINT_NAMES.DESKTOP ] }
							onChange={ ( value ) =>
								handleBreakpointChange(
									BREAKPOINT_NAMES.DESKTOP,
									value
								)
							}
						/>
						<CheckboxControl
							__nextHasNoMarginBottom
							label={
								<span className="block-editor-block-visibility-breakpoints-modal__label">
									{ __( 'Hide on tablet' ) }
									<Icon
										icon={ tablet }
										className="block-editor-block-visibility-breakpoints-modal__icon"
									/>
								</span>
							}
							checked={ breakpoints[ BREAKPOINT_NAMES.TABLET ] }
							onChange={ ( value ) =>
								handleBreakpointChange(
									BREAKPOINT_NAMES.TABLET,
									value
								)
							}
						/>
						<CheckboxControl
							__nextHasNoMarginBottom
							label={
								<span className="block-editor-block-visibility-breakpoints-modal__label">
									{ __( 'Hide on mobile' ) }
									<Icon
										icon={ mobile }
										className="block-editor-block-visibility-breakpoints-modal__icon"
									/>
								</span>
							}
							checked={ breakpoints[ BREAKPOINT_NAMES.MOBILE ] }
							onChange={ ( value ) =>
								handleBreakpointChange(
									BREAKPOINT_NAMES.MOBILE,
									value
								)
							}
						/>
					</div>
				</fieldset>
				<Flex
					className="block-editor-block-visibility-breakpoints-modal__actions"
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
