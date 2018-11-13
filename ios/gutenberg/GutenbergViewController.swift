
import UIKit

class GutenbergViewController: UIViewController {
    lazy var gutenberg = Gutenberg()

    override func loadView() {
        view = gutenberg.rootView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        addSaveButton()
        gutenberg.delegate = self
        navigationController?.navigationBar.isTranslucent = false
    }

    func addSaveButton() {
        navigationItem.leftBarButtonItem = UIBarButtonItem(barButtonSystemItem: .save, target: self, action: #selector(saveButtonPressed(sender:)))
    }

    @objc func saveButtonPressed(sender: UIBarButtonItem) {
        gutenberg.requestHTML()
    }
}

extension GutenbergViewController: GutenbergBridgeDelegate {
    func gutenbergDidProvideHTML(_ html: String) {
        print("Did receive HTML: \(html)")
    }
    
    func gutenbergDidRequestMediaPicker(callback: @escaping MediaPickerDidPickMediaCallback) {
        print("Gutenberg did request media picker, passing a sample url in callback")
        callback("https://cldup.com/cXyG__fTLN.jpg")
    }
}
