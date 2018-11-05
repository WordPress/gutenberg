
import UIKit

class GutenbergViewController: UIViewController {

    override func loadView() {
        view = Gutenberg.sharedInstance().rootView(withInitialProps: [:])
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        addSaveButton()
        Gutenberg.sharedInstance().delegate = self
        navigationController?.navigationBar.isTranslucent = false
    }

    func addSaveButton() {
        navigationItem.leftBarButtonItem = UIBarButtonItem(barButtonSystemItem: .save, target: self, action: #selector(saveButtonPressed(sender:)))
    }

    @objc func saveButtonPressed(sender: UIBarButtonItem) {
        Gutenberg.sharedInstance().requestHTML()
    }
}

extension GutenbergViewController: GutenbergBridgeDelegate {
    func gutenbergDidProvideHTML(_ html: String) {
        print("Did receive HTML: \(html)")
    }
}
