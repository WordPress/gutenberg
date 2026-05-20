/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './style.module.css';

interface HelloWorldAttributes {
	message?: string;
}

export default function HelloWorld( {
	attributes,
}: {
	attributes?: HelloWorldAttributes;
} ) {
	return (
		<Stack
			align="center"
			justify="center"
			className={ clsx( styles.root ) }
		>
			<Text variant="heading-2xl">
				{ attributes?.message || 'Hello World' }
			</Text>
		</Stack>
	);
}
