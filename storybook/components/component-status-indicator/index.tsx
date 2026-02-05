import { Markdown, useOf } from '@storybook/addon-docs/blocks';
import { statuses } from './statuses';

export function ComponentStatusIndicator() {
	const resolvedOf = useOf( 'meta' );

	if ( resolvedOf.type !== 'meta' ) {
		return null;
	}

	const { parameters } = resolvedOf.preparedMeta;
	const componentStatus = parameters?.componentStatus;

	if ( ! componentStatus?.status ) {
		return null;
	}

	const statusInfo = statuses[ componentStatus.status ];

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
				lineHeight: '1.5',
			} }
		>
			<div
				style={ {
					display: 'flex',
					flexDirection: 'column',
					width: 'fit-content',
					flexShrink: 0,
					fontSize: 'inherit',
				} }
			>
				<dt
					style={ {
						margin: 0,
						fontStyle: 'normal',
						color: '#757575',
					} }
				>
					Status
				</dt>
				<dd
					style={ {
						margin: 0,
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
						fontSize: 'inherit',
					} }
				>
					<dt
						style={ {
							margin: 0,
							fontStyle: 'normal',
							color: '#757575',
						} }
					>
						Notes
					</dt>
					<dd style={ { margin: 0, padding: 0, fontWeight: 'bold' } }>
						<Markdown style={ { lineHeight: 'inherit' } }>
							{ componentStatus.notes }
						</Markdown>
					</dd>
				</div>
			) }
		</dl>
	);
}
