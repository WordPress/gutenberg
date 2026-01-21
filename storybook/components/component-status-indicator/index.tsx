import { Markdown, useOf } from '@storybook/addon-docs/blocks';
import type { Parameters } from 'storybook/internal/types';
import { statuses } from './statuses';

export function ComponentStatusIndicator() {
	const resolvedOf = useOf( 'meta' );

	if ( resolvedOf.type !== 'meta' ) {
		return null;
	}

	const { parameters } = resolvedOf.preparedMeta;
	const componentStatus =
		parameters?.componentStatus as Parameters[ 'componentStatus' ];

	if ( ! componentStatus?.status ) {
		return null;
	}

	const statusInfo = statuses.find(
		( s ) => s.value === componentStatus.status
	);

	if ( ! statusInfo ) {
		return null;
	}

	return (
		<dl
			style={ {
				display: 'flex',
				gap: '40px',
				flexDirection: 'row',
				marginBottom: '20px',
				fontSize: '14px',
			} }
		>
			<div
				style={ {
					display: 'flex',
					flexDirection: 'column',
					width: 'fit-content',
					flexShrink: 0,
				} }
			>
				<dt style={ { fontStyle: 'normal', color: '#757575' } }>
					Status
				</dt>
				<dd
					style={ {
						fontStyle: 'normal',
						padding: 0,
						fontWeight: 'bold',
					} }
				>
					{ statusInfo.icon } { statusInfo.label }
				</dd>
			</div>
			{ componentStatus.notes && (
				<div
					style={ {
						display: 'flex',
						flexDirection: 'column',
						width: 'fit-content',
					} }
				>
					<dt style={ { fontStyle: 'normal', color: '#757575' } }>
						Notes
					</dt>
					<dd style={ { padding: 0, fontWeight: 'bold' } }>
						<Markdown>{ componentStatus.notes }</Markdown>
					</dd>
				</div>
			) }
		</dl>
	);
}
