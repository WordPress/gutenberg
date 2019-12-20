/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../../utils/create-higher-order-component';
import usePreferredColorScheme from '../../hooks/use-preferred-color-scheme';

const withPreferredColorScheme = createHigherOrderComponent(
	( WrappedComponent ) => ( props ) => {
		const colorScheme = usePreferredColorScheme();
		const isDarkMode = colorScheme === 'dark';

		const getStyles = ( lightStyles, darkStyles ) => {
			const finalDarkStyles = {
				...lightStyles,
				...darkStyles,
			};

			return isDarkMode ? finalDarkStyles : lightStyles;
		};

		return (
			<WrappedComponent
				preferredColorScheme={ colorScheme }
				getStylesFromColorScheme={ getStyles }
				{ ...props }
			/>
		);
	},
	'withPreferredColorScheme'
);

export default withPreferredColorScheme;
