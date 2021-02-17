/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { Button } from '@wp-g2/components';

/**
 * Internal dependencies
 */
import { CardBody } from '../../card';
import { Popover } from '../index';

describe( 'props', () => {
	let base;

	beforeEach( () => {
		base = render(
			<Popover
				baseId="popover"
				trigger={ <Button>WordPress.org</Button> }
			>
				<CardBody>Code is Poetry</CardBody>
			</Popover>
		);
	} );
	test( 'should render correctly', () => {
		expect( base.container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render visible', () => {
		const { container } = render(
			<Popover
				baseId="popover"
				trigger={ <Button>WordPress.org</Button> }
				visible
			>
				<CardBody>Code is Poetry</CardBody>
			</Popover>
		);
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render without trigger', () => {
		const { container } = render(
			<Popover baseId="popover" visible>
				<CardBody>Code is Poetry</CardBody>
			</Popover>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render without content', () => {
		const { container } = render(
			<Popover
				baseId="popover"
				trigger={ <Button>WordPress.org</Button> }
				visible
			/>
		);
		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render without animation', () => {
		const { container } = render(
			<Popover
				animated={ false }
				baseId="popover"
				trigger={ <Button>WordPress.org</Button> }
			>
				<CardBody>Code is Poetry</CardBody>
			</Popover>
		);
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render gutter', () => {
		const { container } = render(
			<Popover
				baseId="popover"
				gutter={ 8 }
				trigger={ <Button>WordPress.org</Button> }
			>
				<CardBody>Code is Poetry</CardBody>
			</Popover>
		);
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render label', () => {
		const { container } = render(
			<Popover
				baseId="popover"
				gutter={ 8 }
				label="show"
				trigger={ <Button>WordPress.org</Button> }
			>
				<CardBody>Code is Poetry</CardBody>
			</Popover>
		);
		expect( container.firstChild ).toMatchDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render without modal', () => {
		const { container } = render(
			<Popover
				baseId="popover"
				modal={ false }
				trigger={ <Button>WordPress.org</Button> }
			>
				<CardBody>Code is Poetry</CardBody>
			</Popover>
		);
		expect( container.firstChild ).toMatchDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render maxWidth', () => {
		const { container } = render(
			<Popover
				baseId="popover"
				maxWidth={ 321 }
				trigger={ <Button>WordPress.org</Button> }
			>
				<CardBody>Code is Poetry</CardBody>
			</Popover>
		);
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render placement', () => {
		const { container } = render(
			<Popover
				baseId="popover"
				placement="bottom-start"
				trigger={ <Button>WordPress.org</Button> }
			>
				<CardBody>Code is Poetry</CardBody>
			</Popover>
		);
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.container.firstChild
		);
	} );
} );
