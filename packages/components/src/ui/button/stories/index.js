/**
 * External dependencies
 */
import { boolean, number, select, text } from '@storybook/addon-knobs';
/**
 * Internal dependencies
 */
import { Button } from '..';

export default {
	component: Button,
	title: 'G2 Components (Experimental)/Button',
};

const createSelectProps = ( collection ) =>
	collection.reduce( ( data, item ) => ( { ...data, [ item ]: item } ), {} );

export const _default = () => {
	const disabled = boolean( 'disabled', false );
	const elevation = number( 'elevation', 0 );
	const hasCaret = boolean( 'hasCaret', false );
	const isActive = boolean( 'isActive', false );
	const isBlock = boolean( 'isBlock', false );
	const isControl = boolean( 'isControl', false );
	const isDestructive = boolean( 'isDestructive', false );
	const isLoading = boolean( 'isLoading', false );
	const isRounded = boolean( 'isRounded', false );
	const isSplit = boolean( 'isSplit', false );
	const isSubtle = boolean( 'isSubtle', false );
	const size = select(
		'size',
		createSelectProps( [ 'large', 'medium', 'small', 'xSmall' ] ),
		'medium'
	);
	const describedBy = text( 'describedBy', undefined );

	const variant = select(
		'variant',
		createSelectProps( [
			'primary',
			'secondary',
			'tertiary',
			'plain',
			'link',
		] ),
		'secondary'
	);

	const props = {
		disabled,
		elevation,
		hasCaret,
		isActive,
		isBlock,
		isControl,
		isDestructive,
		isLoading,
		isRounded,
		isSplit,
		isSubtle,
		size,
		variant,
		describedBy,
	};

	return <Button { ...props }>Button</Button>;
};
