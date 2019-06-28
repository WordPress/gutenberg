/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import withRegistryProvider from './with-registry-provider';

function BlockEditorProvider( {
	settings,
	value,
	children,
	onChange = () => {},
	onInput = () => {},
} ) {
	const { updateSettings, resetBlocks } = useDispatch( 'core/block-editor' );

	useEffect( () => {
		updateSettings( settings );
	}, [ settings ] );

	const { blocks, isPersistent, isIgnored } = useSelect( ( select ) => {
		const {
			getBlocks,
			isLastBlockChangePersistent,
			__unstableIsLastBlockChangeIgnored,
		} = select( 'core/block-editor' );

		return {
			blocks: getBlocks(),
			isPersistent: isLastBlockChangePersistent(),
			isIgnored: __unstableIsLastBlockChangeIgnored(),
		};
	} );

	const previousBlocks = useRef( blocks );
	const previousIsPersistent = useRef( isPersistent );
	const isSyncingIncomingValue = useRef( false );
	const isSyncingOutgoingValue = useRef( false );

	useEffect( () => {
		if (
			blocks !== previousBlocks.current && (
				isSyncingIncomingValue.current ||
				isIgnored
			)
		) {
			isSyncingIncomingValue.current = false;
			previousBlocks.current = blocks;
			previousIsPersistent.current = isPersistent;
		} else if (
			blocks !== previousBlocks.current ||
			// This happens when a previous input is explicitely marked as persistent.
			( isPersistent && ! previousIsPersistent.current )
		) {
			// When knowing the blocks value is changing, assign instance
			// value to skip reset in subsequent `componentDidUpdate`.
			if ( blocks !== previousBlocks.current ) {
				isSyncingOutgoingValue.current = true;
			}

			previousBlocks.current = blocks;
			previousIsPersistent.current = isPersistent;

			if ( isPersistent ) {
				onChange( blocks );
			} else {
				onInput( blocks );
			}
		}
	}, [ blocks, isPersistent ] );

	useEffect( () => {
		if ( isSyncingOutgoingValue.current ) {
			isSyncingOutgoingValue.current = false;
		} else {
			isSyncingIncomingValue.current = true;
			resetBlocks( value );
		}
	}, [ value ] );

	return children;
}

export default withRegistryProvider( BlockEditorProvider );
