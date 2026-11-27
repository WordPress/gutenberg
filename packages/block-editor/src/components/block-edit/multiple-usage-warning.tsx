import { getBlockType } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '../../store';
import Warning from '../warning';
import type { MultipleUsageWarningProps } from './types';

export function MultipleUsageWarning( {
	originalBlockClientId,
	name,
	onReplace,
}: MultipleUsageWarningProps ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const blockType = getBlockType( name );

	const actions = [
		<Button
			__next40pxDefaultSize
			key="find-original"
			variant="secondary"
			onClick={ () => selectBlock( originalBlockClientId ) }
		>
			{ __( 'Find original' ) }
		</Button>,
	];

	// Skip the remove action when removal is disallowed so clicking does not throw.
	if ( onReplace ) {
		actions.push(
			<Button
				__next40pxDefaultSize
				key="remove"
				variant="secondary"
				onClick={ () => onReplace( [] ) }
			>
				{ __( 'Remove' ) }
			</Button>
		);
	}

	return (
		<Warning actions={ actions }>
			<strong>{ blockType?.title }: </strong>
			{ __( 'This block can only be used once.' ) }
		</Warning>
	);
}
