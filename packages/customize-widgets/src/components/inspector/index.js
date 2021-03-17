/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { BlockInspector } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';

export { default as BlockInspectorButton } from './block-inspector-button';

function InspectorSectionMeta( { closeInspector, inspectorTitleId } ) {
	return (
		<div className="customize-section-description-container section-meta">
			<div className="customize-section-title">
				{ /* Disable reason: We want to use the exiting style of the back button. */ }
				<button // eslint-disable-line react/forbid-elements
					type="button"
					className="customize-section-back"
					tabIndex="0"
					onClick={ closeInspector }
				>
					<span className="screen-reader-text">Back</span>
				</button>
				<h3 id={ inspectorTitleId }>
					<span className="customize-action">
						{ __( 'Customizing ▸ Widgets' ) }
					</span>
					{ __( 'Block Settings' ) }
				</h3>
			</div>
		</div>
	);
}

export default function Inspector( {
	isOpened,
	isAnimating,
	setInspectorOpenState,
} ) {
	const inspectorTitleId = useInstanceId(
		Inspector,
		'customize-widgets-block-settings'
	);

	useEffect( () => {
		const openedSidebarSection = document.querySelector(
			'.control-section-sidebar.open'
		);

		if ( isOpened ) {
			openedSidebarSection.classList.add( 'is-inspector-open' );
		} else {
			openedSidebarSection.classList.remove( 'is-inspector-open' );
		}

		// In case the "transitionend" event for some reasons doesn't fire.
		// (Like when it's set to "display: none", or when the transition property is removed.)
		// See https://github.com/w3c/csswg-drafts/issues/3043
		const timer = setTimeout( () => {
			setInspectorOpenState( 'TRANSITION_END' );
		}, 180 );

		return () => {
			openedSidebarSection.classList.remove( 'is-inspector-open' );
			clearTimeout( timer );
		};
	}, [ isOpened, setInspectorOpenState ] );

	return (
		<div
			role="region"
			aria-labelledby={ inspectorTitleId }
			className={ classnames(
				'customize-pane-child',
				'accordion-section-content',
				'accordion-section',
				'customize-widgets-layout__inspector',
				// Required for some CSS to work.
				'interface-complementary-area',
				{
					open: isOpened,
					// Needed to keep the inspector visible while closing.
					busy: isAnimating,
				}
			) }
			onTransitionEnd={ () => {
				setInspectorOpenState( 'TRANSITION_END' );
			} }
		>
			<InspectorSectionMeta
				closeInspector={ () => setInspectorOpenState( 'CLOSE' ) }
				inspectorTitleId={ inspectorTitleId }
			/>

			<BlockInspector />
		</div>
	);
}
