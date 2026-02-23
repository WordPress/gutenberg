/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalItem as Item,
	__experimentalText as Text,
	FlexBlock,
	Button,
	TextControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { chevronUp, chevronDown } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { ReactNode } from 'react';

export interface ConnectorItemProps {
	icon?: ReactNode;
	name: string;
	description: string;
	children?: ReactNode;
}

export function ConnectorItem( {
	icon,
	name,
	description,
	children,
}: ConnectorItemProps ) {
	const [ isExpanded, setIsExpanded ] = useState( false );

	return (
		<Item>
			<VStack spacing={ 4 }>
				<HStack alignment="center" spacing={ 4 }>
					{ icon }
					<FlexBlock>
						<VStack spacing={ 0 }>
							<Text weight={ 600 }>{ name }</Text>
							<Text variant="muted">{ description }</Text>
						</VStack>
					</FlexBlock>
					<Button
						variant="secondary"
						size="compact"
						icon={ isExpanded ? chevronUp : chevronDown }
						iconPosition="right"
						onClick={ () => setIsExpanded( ! isExpanded ) }
						aria-expanded={ isExpanded }
					>
						{ isExpanded ? __( 'Close' ) : __( 'Install' ) }
					</Button>
				</HStack>

				{ isExpanded && children }
			</VStack>
		</Item>
	);
}

/**
 * Default settings form for connectors that don't provide custom render.
 */
export function DefaultConnectorSettings( {
	onSave,
	onCancel,
}: {
	onSave?: ( apiKey: string ) => void;
	onCancel?: () => void;
} ) {
	const [ apiKey, setApiKey ] = useState( '' );

	return (
		<VStack spacing={ 4 } className="connector-settings">
			<TextControl
				__nextHasNoMarginBottom
				label={ __( 'API Key' ) }
				value={ apiKey }
				onChange={ setApiKey }
				placeholder={ __( 'Enter your API key' ) }
				type="password"
			/>
			<HStack justify="flex-end">
				<Button variant="secondary" onClick={ onCancel }>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					variant="primary"
					onClick={ () => onSave?.( apiKey ) }
				>
					{ __( 'Save' ) }
				</Button>
			</HStack>
		</VStack>
	);
}
