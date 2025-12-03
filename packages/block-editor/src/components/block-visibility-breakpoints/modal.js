/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import {
	Button,
	CheckboxControl,
	Flex,
	FlexItem,
	Modal,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { cleanEmptyObject } from '../../hooks/utils';

export default function BlockVisibilityBreakpointsModal( {
	clientIds,
	onClose,
} ) {
	const blocks = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlocksByClientId( clientIds );
		},
		[ clientIds ]
	);

	// Get initial breakpoint visibility state from blocks
	const getInitialBreakpoints = () => {
		const breakpoints = { mobile: false, tablet: false, desktop: false };
		const hasBreakpoints = blocks.some(
			( block ) =>
				block.attributes.metadata?.blockVisibilityBreakpoints
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
	};

	const [ breakpoints, setBreakpoints ] = useState( getInitialBreakpoints );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Check if any block is hidden everywhere
	const hasHiddenEverywhere = blocks.some(
		( block ) => block.attributes.metadata?.blockVisibility === false
	);

	useEffect( () => {
		setBreakpoints( getInitialBreakpoints() );
	}, [ clientIds ] );

	const handleSubmit = ( event ) => {
		event.preventDefault();

		const attributesByClientId = Object.fromEntries(
			blocks.map( ( { clientId, attributes } ) => [
				clientId,
				{
					metadata: cleanEmptyObject( {
						...attributes?.metadata,
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

	const hasAnyBreakpoint = Object.values( breakpoints ).some( Boolean );

	return (
		<Modal
			title={ __( 'Hide block' ) }
			onRequestClose={ onClose }
			overlayClassName="block-editor-block-visibility-breakpoints-modal"
			size="small"
		>
			<form onSubmit={ handleSubmit }>
				<p>{ __( 'Select options for hiding the block.' ) }</p>
				<fieldset className="block-editor-block-visibility-breakpoints-modal__options">
					<CheckboxControl
						__nextHasNoMarginBottom
						label={ __( 'Hide everywhere' ) }
						checked={ hasHiddenEverywhere }
						disabled
						help={ __(
							'This option is managed separately in the block visibility settings.'
						) }
					/>
					<CheckboxControl
						__nextHasNoMarginBottom
						label={ __( 'Hide on mobile' ) }
						checked={ breakpoints.mobile }
						onChange={ ( mobile ) =>
							setBreakpoints( ( prev ) => ( { ...prev, mobile } ) )
						}
					/>
					<CheckboxControl
						__nextHasNoMarginBottom
						label={ __( 'Hide on tablet' ) }
						checked={ breakpoints.tablet }
						onChange={ ( tablet ) =>
							setBreakpoints( ( prev ) => ( { ...prev, tablet } ) )
						}
					/>
					<CheckboxControl
						__nextHasNoMarginBottom
						label={ __( 'Hide on desktop' ) }
						checked={ breakpoints.desktop }
						onChange={ ( desktop ) =>
							setBreakpoints( ( prev ) => ( { ...prev, desktop } ) )
						}
					/>
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

