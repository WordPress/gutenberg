/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup, Icon } from '@wordpress/components';
import { useRef, useEffect, useState } from '@wordpress/element';
import { seen, unseen, desktop, tablet, mobile } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockVisibilityModal from './modal';
import useBlockVisibility from './use-block-visibility';
import { VIEWPORT_LABELS } from './utils';

function VisibilityIcon( { blockVisibility } ) {
	// Hidden everywhere or no visibility set - just show unseen/seen icon
	if ( blockVisibility === false ) {
		return <Icon icon={ unseen } />;
	}

	if ( typeof blockVisibility === 'object' ) {
		const hiddenDesktop = blockVisibility.desktop === false;
		const hiddenTablet = blockVisibility.tablet === false;
		const hiddenMobile = blockVisibility.mobile === false;

		// If all three are hidden, just show unseen icon
		if ( hiddenDesktop && hiddenTablet && hiddenMobile ) {
			return <Icon icon={ unseen } />;
		}

		// Viewport-specific hiding - show unseen icon + device icons
		return (
			<span className="block-editor-block-visibility-toolbar__icon-group">
				<Icon icon={ unseen } />
				<span className="block-editor-block-visibility-toolbar__devices">
					{ hiddenDesktop && <Icon icon={ desktop } /> }
					{ hiddenTablet && <Icon icon={ tablet } /> }
					{ hiddenMobile && <Icon icon={ mobile } /> }
				</span>
			</span>
		);
	}

	// Not hidden - show seen icon
	return <Icon icon={ seen } />;
}

export default function BlockVisibilityToolbar( { clientIds } ) {
	const {
		blocks,
		canToggle,
		isHidden,
		viewportType,
		responsiveEditing,
		toggleVisibility,
	} = useBlockVisibility( clientIds );

	const hasBlockVisibilityButtonShownRef = useRef( false );
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	// If the block visibility button has been shown, we don't want to
	// remove it from the toolbar until the toolbar is rendered again
	// without it. Removing it beforehand can cause focus loss issues.
	useEffect( () => {
		if ( isHidden ) {
			hasBlockVisibilityButtonShownRef.current = true;
		}
	}, [ isHidden ] );

	if ( ! isHidden && ! hasBlockVisibilityButtonShownRef.current ) {
		return null;
	}

	const handleClick = () => {
		if ( responsiveEditing ) {
			toggleVisibility();
		} else {
			setIsModalOpen( true );
		}
	};

	// Only show detailed visibility for single block selection
	const isSingleBlock = clientIds.length === 1;
	const blockVisibility = isSingleBlock
		? blocks[ 0 ]?.attributes?.metadata?.blockVisibility
		: undefined;

	// Generate label
	let label;
	if ( responsiveEditing ) {
		label = isHidden
			? sprintf(
					/* translators: %s: Viewport name (Desktop, Tablet, or Mobile) */
					__( 'Hidden on %s' ),
					VIEWPORT_LABELS[ viewportType ]
			  )
			: sprintf(
					/* translators: %s: Viewport name (Desktop, Tablet, or Mobile) */
					__( 'Visible on %s' ),
					VIEWPORT_LABELS[ viewportType ]
			  );
	} else if ( ! isSingleBlock ) {
		label = isHidden ? __( 'Hidden' ) : __( 'Visible' );
	} else if ( blockVisibility === false ) {
		label = __( 'Hidden' );
	} else if ( typeof blockVisibility === 'object' ) {
		const hiddenDevices = [
			blockVisibility.desktop === false && __( 'Desktop' ),
			blockVisibility.tablet === false && __( 'Tablet' ),
			blockVisibility.mobile === false && __( 'Mobile' ),
		].filter( Boolean );

		label =
			hiddenDevices.length === 3
				? __( 'Hidden' )
				: sprintf(
						/* translators: %s: comma-separated list of device types */
						__( 'Hidden on %s' ),
						hiddenDevices.join( ', ' )
				  );
	} else {
		label = __( 'Visible' );
	}

	// For multiselect, just show simple icon
	const icon = isSingleBlock ? (
		<VisibilityIcon blockVisibility={ blockVisibility } />
	) : (
		<Icon icon={ isHidden ? unseen : seen } />
	);

	return (
		<>
			<ToolbarGroup className="block-editor-block-visibility-toolbar">
				<ToolbarButton
					disabled={ ! canToggle }
					icon={ icon }
					label={ label }
					onClick={ handleClick }
					aria-expanded={
						! responsiveEditing ? isModalOpen : undefined
					}
					aria-haspopup={ ! responsiveEditing ? 'dialog' : undefined }
				/>
			</ToolbarGroup>
			{ isModalOpen && (
				<BlockVisibilityModal
					clientId={ clientIds[ 0 ] }
					onClose={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}
