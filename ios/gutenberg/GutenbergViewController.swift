
import UIKit

class GutenbergViewController: UIViewController {
    lazy var gutenberg = Gutenberg()
    
    fileprivate var htmlMode: Bool = false
    
    override func loadView() {
        view = gutenberg.rootView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        configureNavigationBar()
        gutenberg.delegate = self
        navigationController?.navigationBar.isTranslucent = false
    }
    
    @objc func moreButtonPressed(sender: UIBarButtonItem) {
        showMoreSheet()
    }
    
    @objc func saveButtonPressed(sender: UIBarButtonItem) {
        gutenberg.requestHTML()
    }
}

extension GutenbergViewController: GutenbergBridgeDelegate {
    
    func gutenbergDidProvideHTML(_ html: String, changed: Bool) {
        print("Did receive HTML: \(html) changed: \(changed)")
    }

    func gutenbergDidRequestMediaPicker(callback: @escaping MediaPickerDidPickMediaCallback) {
        print("Gutenberg did request media picker, passing a sample url in callback")
        callback("https://cldup.com/cXyG__fTLN.jpg")
    }
}

//MARK: - Navigation bar

extension GutenbergViewController {
    
    func configureNavigationBar() {
        addSaveButton()
        addMoreButton()
    }
    
    func addSaveButton() {
        navigationItem.leftBarButtonItem = UIBarButtonItem(barButtonSystemItem: .save,
                                                           target: self,
                                                           action: #selector(saveButtonPressed(sender:)))
    }
    
    func addMoreButton() {
        navigationItem.rightBarButtonItem = UIBarButtonItem(title: "...",
                                                            style: .plain,
                                                            target: self,
                                                            action: #selector(moreButtonPressed(sender:)))
    }
}

//MARK: - More actions

extension GutenbergViewController {
    
    func showMoreSheet() {
        let alert = UIAlertController(title: nil, message: nil, preferredStyle: .actionSheet)
        
        let toggleHTMLModeAction = UIAlertAction(
            title: htmlMode ? "Switch To Visual" : "Switch to HTML",
            style: .default,
            handler: { [unowned self] action in
                self.toggleHTMLMode(action)
            }
        )
        let cancelAction = UIAlertAction(title: "Keep Editing", style: .cancel)
        alert.addAction(toggleHTMLModeAction)
        alert.addAction(cancelAction)
        
        present(alert, animated: true)
    }
    
    func toggleHTMLMode(_ action: UIAlertAction) {
        htmlMode = !htmlMode
        gutenberg.toggleHTMLMode()
    }
}
