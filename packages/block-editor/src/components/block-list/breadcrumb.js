/**
 * WordPress dependencies
 */
import { Toolbar, Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { BACKSPACE, DELETE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import BlockTitle from '../block-title';

/**
 * Block breadcrumb component, displaying the label of the block. If the block
 * descends from a root block, a button is displayed enabling the user to select
 * the root block.
 *
 * @param {string} props          Component props.
 * @param {string} props.clientId Client ID of block.
 *
 * @return {WPComponent} The component to be rendered.
 */
function BlockBreadcrumb( { clientId, ...props } ) {
	const ref = useRef();
	const {
		setNavigationMode,
		removeBlock,
	} = useDispatch( 'core/block-editor' );

	// Focus the breadcrumb in navigation mode.
	useEffect( () => {
		ref.current.focus();
	} );

	function onKeyDown( event ) {
		const { keyCode } = event;

		if ( keyCode === BACKSPACE || keyCode === DELETE ) {
			removeBlock( clientId );
			event.preventDefault();
		}
	}

	return (
		<div className="block-editor-block-list__breadcrumb" { ...props }>
			<Toolbar>
				<Button
					ref={ ref }
					onClick={ () => setNavigationMode( false ) }
					onKeyDown={ onKeyDown }
				>
					<BlockTitle clientId={ clientId } />
				</Button>
			</Toolbar>
		</div>
	);
}

export default BlockBreadcrumb;
