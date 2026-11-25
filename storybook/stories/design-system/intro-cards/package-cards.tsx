import { Stack } from '@wordpress/ui';
import styles from './style.module.scss';

export const PackageCards = ( { children }: { children: React.ReactNode } ) => (
	<Stack
		direction="row"
		gap="lg"
		wrap="wrap"
		className={ styles[ 'card-group' ] }
	>
		{ children }
	</Stack>
);
