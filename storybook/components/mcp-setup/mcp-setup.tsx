import type { ReactElement, ReactNode } from 'react';
import { Children, isValidElement, useState } from '@wordpress/element';
import { Subheading } from '@storybook/addon-docs/blocks';
import { SelectControl } from '@wordpress/ui';
import styles from './style.module.css';
import { McpSetupTool, type McpSetupToolProps } from './mcp-setup-tool';
import { ToolIcon } from './tool-icon';

function ToolOption( { tool }: { tool?: ReactElement< McpSetupToolProps > } ) {
	if ( ! tool ) {
		return null;
	}
	return (
		<span className={ styles.option }>
			<ToolIcon logo={ tool.props.logo } />
			{ tool.props.label }
		</span>
	);
}

export function McpSetup( { children }: { children: ReactNode } ) {
	const [ selected, setSelected ] = useState( 0 );
	const tools = Children.toArray( children ).filter(
		( child ) => isValidElement( child ) && child.type === McpSetupTool
	) as ReactElement< McpSetupToolProps >[];
	const tool = tools[ selected ];

	if ( ! tool ) {
		return null;
	}

	const items = tools.map( ( t, index ) => ( {
		value: String( index ),
		label: t.props.label,
	} ) );

	return (
		<div className={ styles.root }>
			<div className={ styles.picker }>
				<SelectControl
					label="AI tool"
					items={ items }
					value={ items[ selected ] }
					onValueChange={ ( item ) => {
						if ( item?.value ) {
							setSelected( Number( item.value ) );
						}
					} }
					trigger={
						<SelectControl.Trigger>
							{ ( item ) => (
								<ToolOption
									tool={ tools[ Number( item.value ) ] }
								/>
							) }
						</SelectControl.Trigger>
					}
				>
					{ items.map( ( item, index ) => (
						<SelectControl.Item
							key={ item.value }
							value={ item }
							label={ item.label }
						>
							<SelectControl.ItemLabel>
								<ToolOption tool={ tools[ index ] } />
							</SelectControl.ItemLabel>
						</SelectControl.Item>
					) ) }
				</SelectControl>
			</div>
			<div className={ styles.tiles } role="group" aria-label="AI tool">
				{ tools.map( ( t, index ) => (
					<button
						key={ t.props.label }
						type="button"
						aria-pressed={ t === tool }
						className={ styles.tile }
						onClick={ () => setSelected( index ) }
					>
						<ToolIcon logo={ t.props.logo } />
						{ t.props.label }
					</button>
				) ) }
			</div>
			<div className={ styles.panel } role="group" aria-live="polite">
				<Subheading disableAnchor>{ tool.props.label }</Subheading>
				{ tool.props.children }
			</div>
		</div>
	);
}
