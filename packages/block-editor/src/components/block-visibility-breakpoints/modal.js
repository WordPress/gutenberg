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
import { desktop, tablet, mobile } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { cleanEmptyObject } from '../../hooks/utils';
import './style.scss';

export default function BlockVisibilityBreakpointsModal( {
	clientIds,
	onClose,
} ) {
	const { blocks, blockType } = useSelect(
		( select ) => {
			const _blocks =
				select( blockEditorStore ).getBlocksByClientId( clientIds );
			const firstBlock = _blocks[ 0 ];
			const _blockType = firstBlock
				? select( blocksStore ).getBlockType( firstBlock.name )
				: null;
			return {
				blocks: _blocks,
				blockType: _blockType,
			};
		},
		[ clientIds ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Get initial breakpoint visibility state from blocks
	const initialBreakpoints = useMemo( () => {
		const breakpoints = { mobile: false, tablet: false, desktop: false };
		const hasBreakpoints = blocks.some(
			( block ) => block.attributes.metadata?.blockVisibilityBreakpoints
		);

		if ( hasBreakpoints ) {
			// If any block has breakpoints, check if all have the same values
			const firstBlockBreakpoints =
				blocks[ 0 ]?.attributes.metadata?.blockVisibilityBreakpoints;
			if ( firstBlockBreakpoints ) {
				breakpoints.mobile = firstBlockBreakpoints.mobile || false;
				breakpoints.tablet = firstBlockBreakpoints.tablet || false;
				breakpoints.desktop = firstBlockBreakpoints.desktop || false;
			}
		}

		return breakpoints;
	}, [ blocks ] );

	const initialHideEverywhere = useMemo( () => {
		return blocks.some(
			( block ) => block.attributes.metadata?.blockVisibility === false
		);
	}, [ blocks ] );

	const [ breakpoints, setBreakpoints ] = useState( initialBreakpoints );
	const [ hideEverywhere, setHideEverywhere ] = useState(
		initialHideEverywhere
	);

	useEffect( () => {
		setBreakpoints( initialBreakpoints );
		setHideEverywhere( initialHideEverywhere );
	}, [ initialBreakpoints, initialHideEverywhere ] );

	// Handle "Hide everywhere" toggle
	const handleHideEverywhereChange = ( newValue ) => {
		setHideEverywhere( newValue );
		if ( newValue ) {
			// If checking "Hide everywhere", check all breakpoints
			setBreakpoints( {
				mobile: true,
				tablet: true,
				desktop: true,
			} );
		} else {
			// If unchecking "Hide everywhere", uncheck all breakpoints
			setBreakpoints( {
				mobile: false,
				tablet: false,
				desktop: false,
			} );
		}
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
			newBreakpoints.mobile &&
			newBreakpoints.tablet &&
			newBreakpoints.desktop;

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

		const attributesByClientId = Object.fromEntries(
			blocks.map( ( { clientId, attributes } ) => [
				clientId,
				{
					metadata: cleanEmptyObject( {
						...attributes?.metadata,
						blockVisibility: hideEverywhere ? false : undefined,
						blockVisibilityBreakpoints:
							breakpoints.mobile ||
							breakpoints.tablet ||
							breakpoints.desktop
								? {
										mobile: breakpoints.mobile || false,
										tablet: breakpoints.tablet || false,
										desktop: breakpoints.desktop || false,
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
							checked={ breakpoints.desktop }
							onChange={ ( value ) =>
								handleBreakpointChange( 'desktop', value )
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
							checked={ breakpoints.tablet }
							onChange={ ( value ) =>
								handleBreakpointChange( 'tablet', value )
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
							checked={ breakpoints.mobile }
							onChange={ ( value ) =>
								handleBreakpointChange( 'mobile', value )
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
