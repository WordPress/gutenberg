import type { ReactElement, ReactNode } from 'react';
import { Children, isValidElement, useState } from '@wordpress/element';
import { Subheading } from '@storybook/addon-docs/blocks';
import styles from './style.module.css';
import { Tool, type ToolProps } from './tool';
import { ToolIcon } from './tool-icon';

export function InstallGrid( { children }: { children: ReactNode } ) {
	const [ selected, setSelected ] = useState( 0 );
	const tools = Children.toArray( children ).filter(
		( child ) => isValidElement( child ) && child.type === Tool
	) as ReactElement< ToolProps >[];
	const tool = tools[ selected ] ?? tools[ 0 ];

	if ( ! tool ) {
		return null;
	}

	return (
		<div className={ styles.root }>
			<div
				className={ styles.tiles }
				role="radiogroup"
				aria-label="AI tool"
			>
				{ tools.map( ( t, index ) => (
					<button
						key={ t.props.label }
						type="button"
						role="radio"
						aria-checked={ t === tool }
						className={ styles.tile }
						onClick={ () => setSelected( index ) }
					>
						<ToolIcon logo={ t.props.logo } />
						{ t.props.label }
					</button>
				) ) }
			</div>
			<div className={ styles.panel } role="group" aria-live="polite">
				<Subheading>{ tool.props.label }</Subheading>
				{ tool.props.children }
			</div>
		</div>
	);
}
