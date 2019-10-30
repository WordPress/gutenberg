/**
 * IDEA:
 * This is a general layout component that helps with aligning content.
 */

/**
 * External dependencies
 */
import classnames from 'classnames';

function Flex( props ) {
	const { align, className, gap, justify, ...restProps } = props;

	const classes = classnames(
		'components-flex',
		align && `is-align-${ align }`,
		gap && `is-gap-${ gap }`,
		justify && `is-justify-${ justify }`,
		className
	);

	return <div { ...restProps } className={ classes } />;
}

Flex.defaultProps = {
	align: 'center',
	gap: 'medium',
	justify: 'space-between',
};

export default Flex;
