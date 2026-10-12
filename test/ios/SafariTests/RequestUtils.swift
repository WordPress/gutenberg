import XCTest

/// Sets up content through the REST API, like the request utilities of the
/// Playwright end-to-end tests: log in, get a REST nonce, then create
/// records as that user.
final class RequestUtils {
	let base: String
	private let session = URLSession( configuration: .ephemeral )
	private var nonce = ""

	init( base: String ) {
		self.base = base
	}

	/// Logs in as the Playground administrator and keeps the REST nonce.
	func login( username: String = "admin", password: String = "password" ) throws {
		let form = [ "log": username, "pwd": password ]
			.map { "\( $0.key )=\( $0.value.addingPercentEncoding( withAllowedCharacters: .alphanumerics ) ?? "" )" }
			.joined( separator: "&" )
		_ = try send( "POST", "/wp-login.php", body: Data( form.utf8 ), type: "application/x-www-form-urlencoded" )
		nonce = String( decoding: try send( "GET", "/wp-admin/admin-ajax.php?action=rest-nonce" ), as: UTF8.self )
	}

	/// Creates a post and returns its ID.
	func createPost( title: String, content: String, status: String = "draft" ) throws -> Int {
		let body = try JSONSerialization.data( withJSONObject: [ "title": title, "content": content, "status": status ] )
		let data = try send( "POST", "/?rest_route=/wp/v2/posts", body: body, type: "application/json" )
		let post = try JSONSerialization.jsonObject( with: data ) as? [ String: Any ]
		return try XCTUnwrap( post?[ "id" ] as? Int, "No post ID in \( String( decoding: data, as: UTF8.self ) )" )
	}

	private func send( _ method: String, _ path: String, body: Data? = nil, type: String? = nil ) throws -> Data {
		var request = URLRequest( url: URL( string: base + path )! )
		request.httpMethod = method
		request.httpBody = body
		if let type {
			request.setValue( type, forHTTPHeaderField: "Content-Type" )
		}
		if !nonce.isEmpty {
			request.setValue( nonce, forHTTPHeaderField: "X-WP-Nonce" )
		}
		var result: Result<Data, Error>!
		let done = XCTestExpectation()
		session.dataTask( with: request ) { data, response, error in
			if let error {
				result = .failure( error )
			} else if let status = ( response as? HTTPURLResponse )?.statusCode, status >= 400 {
				result = .failure( NSError( domain: "RequestUtils", code: status, userInfo: [
					NSLocalizedDescriptionKey: "\( method ) \( path ) returned \( status ): \( String( decoding: data ?? Data(), as: UTF8.self ).prefix( 300 ) )",
				] ) )
			} else {
				result = .success( data ?? Data() )
			}
			done.fulfill()
		}.resume()
		XCTAssertEqual( XCTWaiter.wait( for: [ done ], timeout: 60 ), .completed, "\( method ) \( path ) timed out" )
		return try result.get()
	}
}
