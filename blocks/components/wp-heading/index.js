export default function EditableHeading( { value, headingType } ) {
	const headingsMap = {
		H1: 'h1',
		H2: 'h2',
		H3: 'h3',
		H4: 'h4',
		H5: 'h5',
		H6: 'h6',
	};

	const mapHeading = ( nodeName ) => headingsMap[ nodeName ];

	return wp.element.createElement( mapHeading( headingType ), null, value );
}
