/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { contextConnect, useContextSystem } from '@wp-g2/context';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { css, styled } from '..';

describe( 'component-interpolation', () => {
	const getLastAppliedCssRule = () => {
		const styles = document.getElementsByTagName( 'style' );
		const lastSheet = Array.from( styles ).slice( -1 )[ 0 ];
		const rules = Array.from( lastSheet.sheet.cssRules );
		return rules.slice( -1 )[ 0 ];
	};

	beforeEach( () => {
		// clean up generated styles and elements
		document.head.innerHTML = '';
	} );

	it( 'should interpolate styled components from core components', () => {
		const StyledA = styled.div`
			background-color: blue;
		`;

		const classes = css`
			color: red;
			${ StyledA } {
				color: blue;
			}
		`;

		const rule = getLastAppliedCssRule();

		const { container } = render(
			<div className={ classes }>
				<StyledA />
			</div>
		);
		const styledA = container.firstChild.firstChild;

		expect( styledA.matches( rule.selectorText ) ).toBe( true );
	} );

	it( 'should interpolate styled components', () => {
		const Component = forwardRef( ( { className }, ref ) => (
			<div ref={ ref } className={ className } />
		) );
		const StyledComponent = styled( Component )``;

		const classes = css`
			color: red;
			${ StyledComponent } {
				color: blue;
			}
		`;

		const rule = getLastAppliedCssRule();

		const { container } = render(
			<div className={ classes }>
				<StyledComponent />
			</div>
		);
		const styledComponent = container.firstChild.firstChild;
		expect( styledComponent.matches( rule.selectorText ) ).toBe( true );
	} );

	it( 'should interpolate styled components inside of styled component styles', () => {
		const StyledA = styled.div``;
		const StyledB = styled.div`
			${ StyledA } {
				color: blue;
			}
		`;

		const { container } = render(
			<StyledB>
				<StyledA />
			</StyledB>
		);
		const rule = getLastAppliedCssRule();

		const styledA = container.firstChild.firstChild;
		expect( styledA.matches( rule.selectorText ) ).toBe( true );
	} );

	it( 'should interpolate context-connected components', () => {
		const TestConnectedStyledComponent = ( props, forwardedRef ) => {
			const connectedProps = useContextSystem(
				props,
				'TestConnectedStyledComponent'
			);
			return <div { ...connectedProps } ref={ forwardedRef } />;
		};

		const Connected = contextConnect(
			TestConnectedStyledComponent,
			'TestConnectedStyledComponent'
		);

		const classes = css`
			color: red;
			${ Connected } {
				color: blue;
			}
		`;

		const rule = getLastAppliedCssRule();

		const { container } = render(
			<div className={ classes }>
				<Connected />
			</div>
		);

		const connected = container.firstChild.firstChild;
		expect( connected.matches( rule.selectorText ) ).toBe( true );
	} );

	it( 'should interpolate context-connected-components in styled', () => {
		const TestConnectedStyledComponent = ( props, forwardedRef ) => {
			const connectedProps = useContextSystem(
				props,
				'TestConnectedStyledComponent'
			);
			return <div { ...connectedProps } ref={ forwardedRef } />;
		};

		const Connected = contextConnect(
			TestConnectedStyledComponent,
			'TestConnectedStyledComponent'
		);

		const Container = styled.div`
			color: red;
			${ Connected } {
				color: blue;
			}
		`;

		const { container } = render(
			<Container>
				<Connected />
			</Container>
		);
		const rule = getLastAppliedCssRule();

		const connected = container.firstChild.firstChild;
		expect( connected.matches( rule.selectorText ) ).toBe( true );
	} );
} );
