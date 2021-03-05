/**
 * WordPress dependencies
 */
import { useRef, createPortal } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { __experimentalLibrary as Library } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';

/**
 * External dependencies
 */
import { Dialog, DialogBackdrop } from 'reakit/Dialog';

function useTargetDOM() {
	const target = useRef();
	if ( ! target.current ) {
		target.current = document.getElementById( 'widgets-left' );
	}
	return target.current;
}

function Inserter( { ...props } ) {
	const target = useTargetDOM();
	const inserterTitleId = useInstanceId(
		useRef(),
		'customize-widget-layout__inserter-panel-title'
	);

	return createPortal(
		<DialogBackdrop
			className="customize-widgets-layout__inserter-panel-backdrop"
			{ ...props }
		>
			<Dialog
				{ ...props }
				// Unset the "dialog" role to make it possible to be close the quick inserter on focus.
				// See https://github.com/WordPress/gutenberg/pull/16964#discussion_r312015746 for more info.
				role={ undefined }
				className="customize-widgets-layout__inserter-panel"
				hideOnClickOutside={ false }
				aria-labelledby={ inserterTitleId }
			>
				<div className="customize-widgets-layout__inserter-panel-header">
					<h2
						id={ inserterTitleId }
						className="customize-widgets-layout__inserter-panel-header-title"
					>
						{ __( 'Add a widget' ) }
					</h2>
					<Button
						className="customize-widgets-layout__inserter-panel-header-close-button"
						isTertiary
						onClick={ props.hide }
					>
						{ __( 'DONE' ) }
					</Button>
				</div>
				<div className="customize-widgets-layout__inserter-panel-content">
					<Library showInserterHelpPanel onSelect={ props.hide } />
				</div>
			</Dialog>
		</DialogBackdrop>,
		target
	);
}

export default Inserter;
