/**
 * Internal dependencies
 */
import Header from './header';

function BottomSheetNavigationHeader( {
	leftButtonOnPress,
	screen,
	applyButtonOnPress,
	isFullscreen,
} ) {
	return (
		<Header>
			{ leftButtonOnPress && isFullscreen && (
				<Header.CancelButton onPress={ leftButtonOnPress } />
			) }
			{ leftButtonOnPress && ! isFullscreen && (
				<Header.BackButton onPress={ leftButtonOnPress } />
			) }
			{ screen && <Header.Title>{ screen }</Header.Title> }
			{ applyButtonOnPress && (
				<Header.ApplyButton onPress={ applyButtonOnPress } />
			) }
		</Header>
	);
}

export default BottomSheetNavigationHeader;
