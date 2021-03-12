/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useState, createPortal } from '@wordpress/element';
import { BlockInspector } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export { default as BlockInspectorButton } from './block-inspector-button';

const container = document.createElement( 'div' );

function InspectorSectionMeta( { collapse } ) {
	return (
		<div className="customize-section-description-container section-meta">
			<div className="customize-section-title">
				<button // eslint-disable-line react/forbid-elements
					className="customize-section-back"
					tabIndex="0"
					onClick={ ( event ) => {
						event.preventDefault();
						collapse();
					} }
				>
					<span className="screen-reader-text">Back</span>
				</button>
				<h3>
					<span className="customize-action">
						{ __( 'Customizing ▸ Widgets' ) }
					</span>
					{ __( 'Block Settings' ) }
				</h3>
			</div>
		</div>
	);
}

export default function Inspector( { isExpanded, collapse } ) {
	const [ busy, setBusy ] = useState( false );

	useEffect( () => {
		const parent = document.getElementById( 'customize-theme-controls' );

		parent.appendChild( container );

		return () => {
			parent.removeChild( container );
		};
	}, [] );

	useEffect( () => {
		setBusy( true );

		const openedSidebarSection = document.querySelector(
			'.control-section-sidebar.open'
		);

		if ( isExpanded ) {
			openedSidebarSection.classList.add( 'is-inspector-open' );
		} else {
			openedSidebarSection.classList.remove( 'is-inspector-open' );
		}

		const timer = setTimeout( () => {
			setBusy( false );
		}, 180 );

		return () => {
			clearTimeout( timer );
			openedSidebarSection.classList.remove( 'is-inspector-open' );
		};
	}, [ isExpanded ] );

	return createPortal(
		<div
			className={ classnames(
				'customize-pane-child',
				'accordion-section-content',
				'accordion-section',
				'customize-widgets-layout__inspector',
				{
					open: isExpanded,
					busy,
				}
			) }
		>
			<InspectorSectionMeta collapse={ collapse } />

			<BlockInspector />
		</div>,
		container
	);
}
