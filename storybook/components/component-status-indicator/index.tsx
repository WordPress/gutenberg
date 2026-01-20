import { useOf } from '@storybook/addon-docs/blocks';
import {
	data as componentStatusData,
	statuses,
} from '../../../packages/components/component-status';

export function ComponentStatusIndicator() {
	const resolvedOf = useOf( 'meta' );

	if ( resolvedOf.type !== 'meta' ) {
		return null;
	}

	const { title } = resolvedOf.preparedMeta;

	// Extract component name from title (e.g., "Components/Button" -> "Button")
	const componentName = title?.split( '/' ).pop();

	// Look up status data
	const componentData = componentStatusData.find(
		( c ) => c.name === componentName
	);

	if ( ! componentData ) {
		return null;
	}

	const statusInfo = statuses.find(
		( s ) => s.value === componentData.status
	);

	if ( ! statusInfo ) {
		return null;
	}

	return (
		<dl
			style={ {
				flexDirection: 'column',
				marginBottom: '24px',
				fontSize: '14px',
			} }
		>
			<div style={ { display: 'flex', gap: '24px' } }>
				<dt style={ { color: '#757575' } }>Status</dt>
				<dd style={ { margin: 0, fontWeight: 'bold' } }>
					{ statusInfo.label.toLowerCase() }
				</dd>
			</div>
			{ componentData.notes && (
				<div style={ { display: 'flex', gap: '24px' } }>
					<dt style={ { color: '#757575' } }>Notes</dt>
					<dd style={ { margin: 0, fontWeight: 'bold' } }>
						{ componentData.notes }
					</dd>
				</div>
			) }
		</dl>
	);
}
