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
	const classNames = classnames(
		className,
		align && `is-align-${ align }`,
		gap && `is-gap-${ gap }`,
		justify && `is-justify-${ justify }`,
		'components-flex'
	);

	return <div className={ classNames } { ...restProps } />;
}

Flex.defaultProps = {
	align: 'center',
	gap: 'medium',
	justify: 'space-between',
};

export default Flex;
