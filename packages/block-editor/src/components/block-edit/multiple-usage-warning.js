/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import Warning from '../warning';

export function MultipleUsageWarning( {
	originalBlockClientId,
	name,
	onReplace,
} ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const blockType = getBlockType( name );

	return (
		<Warning
			actions={ [
				<Button
					__next40pxDefaultSize
					key="find-original"
					variant="secondary"
					onClick={ () => selectBlock( originalBlockClientId ) }
				>
					{ __( 'Find original' ) }
				</Button>,
				<Button
					__next40pxDefaultSize
					key="remove"
					variant="secondary"
					onClick={ () => onReplace( [] ) }
				>
					{ __( 'Remove' ) }
				</Button>,
			] }
		>
			<strong>{ blockType?.title }: </strong>
			{ __( 'This block can only be used once.' ) }
		</Warning>
	);
}
