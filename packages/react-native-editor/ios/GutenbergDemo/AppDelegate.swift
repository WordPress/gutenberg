import Foundation
import UIKit

#if DEBUG
#if FB_SONARKIT_ENABLED
import FlipperKit
#endif
#endif

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        initializeFlipper(with: application)
        
        AppDelegate.setupUITest()
        
        window = UIWindow(frame: UIScreen.main.bounds)

        let rootViewController = GutenbergViewController()

        window?.rootViewController = UINavigationController(rootViewController: rootViewController)
        window?.makeKeyAndVisible()

        return true
    }
    
    private func initializeFlipper(with application: UIApplication) {
      #if DEBUG
      #if FB_SONARKIT_ENABLED
        let client = FlipperClient.shared()
        let layoutDescriptorMapper = SKDescriptorMapper(defaults: ())
        FlipperKitLayoutComponentKitSupport.setUpWith(layoutDescriptorMapper)
        client?.add(FlipperKitLayoutPlugin(rootNode: application, with: layoutDescriptorMapper!))
        client?.add(FKUserDefaultsPlugin(suiteName: nil))
        client?.add(FlipperKitReactPlugin())
        client?.add(FlipperKitNetworkPlugin(networkAdapter: SKIOSNetworkAdapter()))
        client?.add(FlipperReactPerformancePlugin.sharedInstance())
        client?.start()
      #endif
      #endif
    }
    
    static func setupUITest() {
        if ( isUITesting() ) {
            UIApplication.shared.keyWindow?.layer.speed = 100;
            UIView.setAnimationsEnabled(false);
        }
    }
    
    static func isUITesting() -> Bool {
        return ProcessInfo.processInfo.arguments.contains("uitesting")
    }
}
