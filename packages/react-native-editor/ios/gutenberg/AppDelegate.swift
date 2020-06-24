import Foundation
import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        AppDelegate.setupUITest()
        
        window = UIWindow(frame: UIScreen.main.bounds)

        let rootViewController = GutenbergViewController()

        window?.rootViewController = UINavigationController(rootViewController: rootViewController)
        window?.makeKeyAndVisible()

        return true
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
