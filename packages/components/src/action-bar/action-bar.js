/**
 * IDEA:
 * This is a general component that powers UI like PageHeader or Toolbar
 */

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { ActionBarContext } from './context';
import Flex from '../flex';

export const defaultProps = {
	dividerSpacing: null,
	isBorderless: false,
	innerPadding: 'medium',
	gap: 'none',
};

function ActionBar( props ) {
	const {
		className,
		dividerSpacing,
		isBorderless,
		innerPadding,
		...restProps
	} = props;
	const classes = classnames(
		className,
		isBorderless && 'is-borderless',
		'components-action-bar'
	);

	const { Provider } = ActionBarContext;

	const contextProps = {
		innerPadding,
		spacing: dividerSpacing || innerPadding, // Used in ActionBarDivider
	};

	return (
		<Provider value={ contextProps }>
			<Flex className={ classes } { ...restProps } />
		</Provider>
	);
}

ActionBar.defaultProps = defaultProps;

export default ActionBar;
