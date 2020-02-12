/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import StyledButtonAppender from './styled-button-appender';

function ButtonBlockAppender( { rootClientId, showSeparator } ) {
	return (
		<>
			<Inserter
				rootClientId={ rootClientId }
				renderToggle={ ( { onToggle, disabled, isOpen } ) => (
					<StyledButtonAppender
						onClick={ onToggle }
						isOpen={ isOpen }
						disabled={ disabled }
					/>
				) }
				isAppender
				showSeparator={ showSeparator }
			/>
		</>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/button-block-appender/README.md
 */
export default ButtonBlockAppender;
export { StyledButtonAppender };
