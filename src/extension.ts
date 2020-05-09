// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { upgradeFile } from "./UpgradeFile";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ttFileUpgrade" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('ng.file.rename', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		if (vscode.window.activeTextEditor) {
			upgradeFile(vscode.window.activeTextEditor.document.uri);
		} else {
			vscode.window.showWarningMessage("no active file opened!");
		}
	});

	context.subscriptions.push(disposable);
	
	context.subscriptions.push(vscode.commands.registerCommand('ng.explorer.file.rename', (selected: vscode.Uri, all: vscode.Uri[]) => {
		if (all && all.length > 0) {
			all.forEach((f) => upgradeFile(f));
		} else {
			vscode.window.showInformationMessage("No file selected");
		}
	}));
	
	vscode.languages.registerHoverProvider(
		{ scheme: 'file', language: 'typescript' },
		{
			provideHover(doc: vscode.TextDocument) {
				return new Promise((resolve, reject) => {
					vscode.workspace.fs.stat(doc.uri).then((info) => {
					  resolve(new vscode.Hover(`Size in bytes is ${info.size}`));
					}, (reason) => {
						reject(reason);
					});
				});
			}
		}
	);
	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider("typescript", {
		provideDocumentSymbols: (document) => {
			return [];
		}
	}));
	
}

// this method is called when your extension is deactivated
export function deactivate() {}
