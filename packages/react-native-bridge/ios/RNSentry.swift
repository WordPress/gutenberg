@objc (RNSentry)
public class RNSentry: NSObject, RCTBridgeModule {
    weak var gutenbergBridge: RNReactNativeGutenbergBridge?
    weak var dataSource: GutenbergBridgeDataSource?
    
    public static func moduleName() -> String! {
        return "RNSentry"
    }

    public static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    public func constantsToExport() -> [AnyHashable : Any]! {
        return ["nativeClientAvailable": true, "nativeTransport": true]
    }

    @objc
    func attachScopeToEvent(_ event: [String: Any], resolve: @escaping RCTPromiseResolveBlock, rejecter:@escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            let eventWithScope = self.dataSource?.attachScopeToSentryEvent(event)
            resolve(eventWithScope);
        }
    }
    
    @objc
    func shouldSendEvent(_ resolve: @escaping RCTPromiseResolveBlock, rejecter:@escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            let shouldSendEvent = self.dataSource?.shouldSendSentryEvent()
            resolve(shouldSendEvent);
        }
    }
    
    @objc
    func getOptions(_ resolve: @escaping RCTPromiseResolveBlock, rejecter:@escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            resolve(self.dataSource?.getSentryOptions())
        }
    }

    @objc
    func captureEnvelope(_ envelopeDict: [String: Any], resolve: @escaping RCTPromiseResolveBlock, rejecter:@escaping RCTPromiseRejectBlock) {
        gutenbergBridge?.logSentryEnvelope(envelopeDict)
        resolve(true);
    }
}

// MARK: - Disabled original methods

extension RNSentry {
    // Disabled because the Sentry SDK is initialized in the main apps.
    @objc
    func startWithOptions(_ options: [String:Any], resolve: @escaping RCTPromiseResolveBlock, rejecter:@escaping RCTPromiseRejectBlock) {
        resolve(true);
    }
    
    // Disabled because the device context is fetched via the attachScopeToEvent method.
    @objc
    func deviceContexts(_ resolve: @escaping RCTPromiseResolveBlock, rejecter:@escaping RCTPromiseRejectBlock) {
        resolve({});
    }
    
    // Disabled as it's set by the main apps.
    @objc
    func setLogLevel(_ level: Int) { }
    
    // Disabled as it's not required by the current Sentry integrations.
    @objc
    func fetchRelease(_ resolve: @escaping RCTPromiseResolveBlock, rejecter:@escaping RCTPromiseRejectBlock) {
        resolve({});
    }
    
    // Disabled as it's set by the main apps.
    @objc
    func setUser(_ user: [String:Any], otherUserKeys: [String:Any]) { }
    
    // Disabled as breadcrumbs are managed by the main apps.
    @objc
    func addBreadcrumb(_ breadcrumb: [String: Any]) { }
    
    // Disabled as breadcrumbs are managed by the main apps.
    @objc
    func clearBreadcrumbs() { }
    
    // Disabled as extra tags are managed by the main apps.
    @objc
    func setExtra(_ key: String, extra: String) { }
    
    // Disabled as context is managed by the main apps.
    @objc
    func setContext(_ key: String, context: [String: Any]) { }
    
    // Disabled as tags are managed by the main apps.
    @objc
    func setTag(_ key: String, value: String) { }
    
    // Disabled as it's only meant to be used in development.
    @objc
    func crash() { }
}
