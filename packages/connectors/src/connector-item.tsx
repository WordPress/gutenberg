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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { ReactNode } from 'react';

export interface ConnectorItemProps {
	icon?: ReactNode;
	name: string;
	description: string;
	actionArea?: ReactNode;
	children?: ReactNode;
}

export function ConnectorItem( {
	icon,
	name,
	description,
	actionArea,
	children,
}: ConnectorItemProps ) {
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
					{ actionArea }
				</HStack>
				{ children }
			</VStack>
		</Item>
	);
}

/**
 * Default settings form for connectors.
 */
export function DefaultConnectorSettings( {
	onSave,
	onCancel,
	initialValue = '',
}: {
	onSave?: ( apiKey: string ) => void;
	onCancel?: () => void;
	initialValue?: string;
} ) {
	const [ apiKey, setApiKey ] = useState( initialValue );

	return (
		<VStack spacing={ 4 } className="connector-settings">
			<TextControl
				__nextHasNoMarginBottom
				label={ __( 'API Key' ) }
				value={ apiKey }
				onChange={ setApiKey }
				placeholder={ __( 'Enter your API key' ) }
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
