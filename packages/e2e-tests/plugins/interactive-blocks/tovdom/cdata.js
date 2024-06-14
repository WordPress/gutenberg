const cdata = `
	<div>
		<![CDATA[##1##]]>
		<div data-testid="it should keep this node between CDATA">
			<![CDATA[##2##]]>
		</div>
	</div>
	`;

const cdataElement = new DOMParser()
	.parseFromString( cdata, 'text/xml' )
	.querySelector( 'div' );
document.getElementById( 'replace-with-cdata' ).replaceWith( cdataElement );
